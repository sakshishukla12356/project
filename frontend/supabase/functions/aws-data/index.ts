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

    // Get AWS credentials
    const { data: creds, error: credsError } = await supabase
      .from("aws_credentials")
      .select("access_key_id, secret_access_key")
      .eq("user_id", userId)
      .maybeSingle();

    if (credsError) throw credsError;
    if (!creds) {
      return new Response(JSON.stringify({ error: "No AWS credentials found. Please connect your AWS account first." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type } = await req.json();
    const { access_key_id: accessKeyId, secret_access_key: secretAccessKey } = creds;

    let result: any;

    switch (type) {
      case "cost-summary":
        result = await getCostSummary(accessKeyId, secretAccessKey);
        break;
      case "cost-by-service":
        result = await getCostByService(accessKeyId, secretAccessKey);
        break;
      case "cost-daily":
        result = await getDailyCosts(accessKeyId, secretAccessKey);
        break;
      case "ec2-instances":
        result = await getEC2Instances(accessKeyId, secretAccessKey);
        break;
      case "recommendations":
        result = await getCostRecommendations(accessKeyId, secretAccessKey);
        break;
      case "all":
        const [costSummary, costByService, dailyCosts, ec2Instances, recommendations] = await Promise.all([
          getCostSummary(accessKeyId, secretAccessKey),
          getCostByService(accessKeyId, secretAccessKey),
          getDailyCosts(accessKeyId, secretAccessKey),
          getEC2Instances(accessKeyId, secretAccessKey),
          getCostRecommendations(accessKeyId, secretAccessKey),
        ]);
        result = { costSummary, costByService, dailyCosts, ec2Instances, recommendations };
        break;
      default:
        return new Response(JSON.stringify({ error: "Invalid type. Use: cost-summary, cost-by-service, cost-daily, ec2-instances, recommendations, all" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Update last_synced_at
    await supabase.from("aws_credentials").update({ last_synced_at: new Date().toISOString() }).eq("user_id", userId);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("aws-data error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ---- AWS Cost Explorer API calls ----

async function getCostSummary(accessKeyId: string, secretAccessKey: string) {
  const now = new Date();
  const endDate = now.toISOString().split("T")[0];
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
  const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];

  const [current, previous] = await Promise.all([
    callCostExplorer(accessKeyId, secretAccessKey, "GetCostAndUsage", {
      TimePeriod: { Start: startDate, End: endDate },
      Granularity: "MONTHLY",
      Metrics: ["UnblendedCost"],
    }),
    callCostExplorer(accessKeyId, secretAccessKey, "GetCostAndUsage", {
      TimePeriod: { Start: prevStart, End: prevEnd },
      Granularity: "MONTHLY",
      Metrics: ["UnblendedCost"],
    }),
  ]);

  const currentCost = parseFloat(current?.ResultsByTime?.[0]?.Total?.UnblendedCost?.Amount || "0");
  const previousCost = parseFloat(previous?.ResultsByTime?.[0]?.Total?.UnblendedCost?.Amount || "0");
  const changePercent = previousCost > 0 ? ((currentCost - previousCost) / previousCost) * 100 : 0;

  return { currentCost, previousCost, changePercent, currency: "USD" };
}

async function getCostByService(accessKeyId: string, secretAccessKey: string) {
  const now = new Date();
  const endDate = now.toISOString().split("T")[0];
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

  const data = await callCostExplorer(accessKeyId, secretAccessKey, "GetCostAndUsage", {
    TimePeriod: { Start: startDate, End: endDate },
    Granularity: "MONTHLY",
    Metrics: ["UnblendedCost"],
    GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }],
  });

  const services = (data?.ResultsByTime?.[0]?.Groups || [])
    .map((g: any) => ({
      name: g.Keys[0],
      cost: parseFloat(g.Metrics.UnblendedCost.Amount),
    }))
    .filter((s: any) => s.cost > 0.01)
    .sort((a: any, b: any) => b.cost - a.cost);

  return { services };
}

async function getDailyCosts(accessKeyId: string, secretAccessKey: string) {
  const now = new Date();
  const endDate = now.toISOString().split("T")[0];
  const startDate = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];

  const data = await callCostExplorer(accessKeyId, secretAccessKey, "GetCostAndUsage", {
    TimePeriod: { Start: startDate, End: endDate },
    Granularity: "DAILY",
    Metrics: ["UnblendedCost"],
  });

  const daily = (data?.ResultsByTime || []).map((r: any) => ({
    date: r.TimePeriod.Start,
    cost: parseFloat(r.Total.UnblendedCost.Amount),
  }));

  return { daily };
}

async function getEC2Instances(accessKeyId: string, secretAccessKey: string) {
  // Try multiple regions
  const regions = ["us-east-1", "us-west-2", "eu-west-1", "ap-south-1", "ap-southeast-1"];
  const allInstances: any[] = [];

  for (const region of regions) {
    try {
      const data = await callEC2(accessKeyId, secretAccessKey, region, "DescribeInstances");
      const reservations = data?.DescribeInstancesResponse?.reservationSet?.item || [];
      const resList = Array.isArray(reservations) ? reservations : [reservations];
      for (const res of resList) {
        if (!res) continue;
        const instances = Array.isArray(res.instancesSet?.item) ? res.instancesSet.item : [res.instancesSet?.item];
        for (const inst of instances) {
          if (!inst) continue;
          const nameTag = Array.isArray(inst.tagSet?.item)
            ? inst.tagSet.item.find((t: any) => t.key === "Name")?.value
            : inst.tagSet?.item?.key === "Name" ? inst.tagSet?.item?.value : undefined;
          allInstances.push({
            instanceId: inst.instanceId,
            name: nameTag || inst.instanceId,
            type: inst.instanceType,
            state: inst.instanceState?.name,
            region,
            launchTime: inst.launchTime,
            publicIp: inst.ipAddress || null,
          });
        }
      }
    } catch {
      // Region may not be available, skip
    }
  }

  return { instances: allInstances };
}

async function getCostRecommendations(accessKeyId: string, secretAccessKey: string) {
  try {
    const data = await callCostExplorer(accessKeyId, secretAccessKey, "GetRightsizingRecommendation", {
      Service: "AmazonEC2",
      Configuration: {
        RecommendationTarget: "SAME_INSTANCE_FAMILY",
        BenefitsConsidered: true,
      },
    });

    const recommendations = (data?.RightsizingRecommendations || []).map((r: any) => ({
      instanceId: r.CurrentInstance?.ResourceId,
      instanceType: r.CurrentInstance?.InstanceType,
      recommendation: r.RightsizingType,
      estimatedSavings: r.ModifyRecommendationDetail?.TargetInstances?.[0]?.EstimatedMonthlySavings?.Value || "0",
      suggestedType: r.ModifyRecommendationDetail?.TargetInstances?.[0]?.InstanceType || "N/A",
    }));

    return { recommendations };
  } catch {
    return { recommendations: [], error: "Cost optimization recommendations require Cost Explorer to be enabled in your AWS account." };
  }
}

// ---- AWS API call helpers with SigV4 ----

async function callCostExplorer(accessKeyId: string, secretAccessKey: string, action: string, payload: any) {
  const host = "ce.us-east-1.amazonaws.com";
  const url = `https://${host}/`;
  const body = JSON.stringify(payload);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);
  const region = "us-east-1";
  const service = "ce";

  const target = `AWSInsightsIndexService.${action}`;
  const headers: Record<string, string> = {
    host,
    "x-amz-date": amzDate,
    "x-amz-target": target,
    "content-type": "application/x-amz-json-1.1",
  };

  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers).sort().map((k) => `${k}:${headers[k]}\n`).join("");
  const payloadHash = await sha256Hex(body);
  const canonicalRequest = ["POST", "/", "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, await sha256Hex(canonicalRequest)].join("\n");
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = await hmacHex(signingKey, stringToSign);
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const resp = await fetch(url, { method: "POST", headers: { ...headers, authorization }, body });
  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`Cost Explorer ${action} error:`, resp.status, errText);
    throw new Error(`AWS Cost Explorer error: ${resp.status}`);
  }
  return resp.json();
}

async function callEC2(accessKeyId: string, secretAccessKey: string, region: string, action: string) {
  const host = `ec2.${region}.amazonaws.com`;
  const url = `https://${host}/`;
  const requestBody = `Action=${action}&Version=2016-11-15`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);
  const service = "ec2";

  const headers: Record<string, string> = {
    host,
    "x-amz-date": amzDate,
    "content-type": "application/x-www-form-urlencoded",
  };

  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers).sort().map((k) => `${k}:${headers[k]}\n`).join("");
  const payloadHash = await sha256Hex(requestBody);
  const canonicalRequest = ["POST", "/", "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, await sha256Hex(canonicalRequest)].join("\n");
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = await hmacHex(signingKey, stringToSign);
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const resp = await fetch(url, { method: "POST", headers: { ...headers, authorization }, body: requestBody });
  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`EC2 ${action} error in ${region}:`, resp.status, errText);
    throw new Error(`EC2 error: ${resp.status}`);
  }
  // Parse XML response
  const text = await resp.text();
  return parseXML(text);
}

// Simple XML parser for AWS responses
function parseXML(xml: string): any {
  const obj: any = {};
  const tagRegex = /<(\w+)>([\s\S]*?)<\/\1>/g;
  let match;
  while ((match = tagRegex.exec(xml))) {
    const [, tag, content] = match;
    if (content.includes("<")) {
      // Check if it's a list (multiple same-named children)
      const childRegex = new RegExp(`<(\\w+)>`, "g");
      const childTags: string[] = [];
      let cm;
      while ((cm = childRegex.exec(content))) childTags.push(cm[1]);
      const unique = [...new Set(childTags)];
      if (unique.length === 1 && childTags.length > 1) {
        obj[tag] = { item: [] };
        const itemRegex = new RegExp(`<${unique[0]}>([\\s\\S]*?)</${unique[0]}>`, "g");
        let im;
        while ((im = itemRegex.exec(content))) {
          obj[tag].item.push(parseXML(`<${unique[0]}>${im[1]}</${unique[0]}>`)?.[unique[0]] || im[1]);
        }
      } else {
        obj[tag] = parseXML(content);
      }
    } else {
      obj[tag] = content;
    }
  }
  return obj;
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
