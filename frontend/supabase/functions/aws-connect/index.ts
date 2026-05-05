import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claims.claims.sub as string;

    const { accessKeyId, secretAccessKey, action } = await req.json();

    // Handle disconnect
    if (action === "disconnect") {
      const { error } = await supabase.from("aws_credentials").delete().eq("user_id", userId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, message: "AWS credentials removed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle check (does user have credentials?)
    if (action === "check") {
      const { data, error } = await supabase
        .from("aws_credentials")
        .select("id, access_key_id, is_valid, connected_at, last_synced_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return new Response(
        JSON.stringify({
          connected: !!data,
          accessKeyId: data ? `${data.access_key_id.slice(0, 4)}****${data.access_key_id.slice(-4)}` : null,
          connectedAt: data?.connected_at,
          isValid: data?.is_valid,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate keys by calling AWS STS GetCallerIdentity
    if (!accessKeyId || !secretAccessKey) {
      return new Response(JSON.stringify({ error: "Access Key ID and Secret Access Key are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stsResult = await callAWS({
      service: "sts",
      region: "us-east-1",
      action: "GetCallerIdentity",
      accessKeyId,
      secretAccessKey,
    });

    if (!stsResult.ok) {
      return new Response(
        JSON.stringify({ error: "Invalid AWS credentials. Please check your Access Key ID and Secret Access Key." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert credentials
    const { error: upsertError } = await supabase.from("aws_credentials").upsert(
      { user_id: userId, access_key_id: accessKeyId, secret_access_key: secretAccessKey, is_valid: true, connected_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    if (upsertError) throw upsertError;

    const stsBody = await stsResult.text();
    const accountMatch = stsBody.match(/<Account>(\d+)<\/Account>/);
    const arnMatch = stsBody.match(/<Arn>([^<]+)<\/Arn>/);

    return new Response(
      JSON.stringify({
        success: true,
        account: accountMatch?.[1] || "Unknown",
        arn: arnMatch?.[1] || "Unknown",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("aws-connect error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// AWS Signature V4 signing helper
async function callAWS({
  service,
  region,
  action,
  accessKeyId,
  secretAccessKey,
  method = "POST",
  body = "",
  extraHeaders = {},
}: {
  service: string;
  region: string;
  action: string;
  accessKeyId: string;
  secretAccessKey: string;
  method?: string;
  body?: string;
  extraHeaders?: Record<string, string>;
}) {
  const host = `${service}.${region}.amazonaws.com`;
  const url = `https://${host}/`;
  const now = new Date();
  const dateStamp = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 8);
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";

  const contentType = "application/x-www-form-urlencoded";
  const requestBody = `Action=${action}&Version=2011-06-15`;

  const headers: Record<string, string> = {
    host,
    "x-amz-date": amzDate,
    "content-type": contentType,
    ...extraHeaders,
  };

  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((k) => `${k}:${headers[k]}\n`)
    .join("");

  const payloadHash = await sha256Hex(requestBody);
  const canonicalRequest = [method, "/", "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, await sha256Hex(canonicalRequest)].join("\n");

  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = await hmacHex(signingKey, stringToSign);

  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return fetch(url, {
    method,
    headers: { ...headers, authorization },
    body: requestBody,
  });
}

async function sha256Hex(data: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

async function hmacHex(key: ArrayBuffer | Uint8Array, data: string): Promise<string> {
  const sig = await hmac(key, data);
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getSignatureKey(key: string, dateStamp: string, region: string, service: string): Promise<ArrayBuffer> {
  const kDate = await hmac(new TextEncoder().encode("AWS4" + key), dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}
