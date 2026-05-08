import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extracts a human-readable error message from an API error response.
 * Handles FastAPI validation errors (422) and standard error messages.
 */
export function getErrorMessage(error: any): string {
  if (typeof error === "string") return error;
  
  // FastAPI error structure: { detail: "string" } or { detail: [{ msg: "string", ... }] }
  const detail = error?.response?.data?.detail;
  
  if (typeof detail === "string") return detail;
  
  if (Array.isArray(detail) && detail.length > 0) {
    const firstError = detail[0];
    if (typeof firstError === "object" && firstError.msg) {
      return firstError.msg;
    }
    // Fallback if detail is an array but first element isn't an object with msg
    return JSON.stringify(firstError);
  }

  // Axios error message or generic fallback
  return error?.response?.data?.message || error?.message || "An unexpected error occurred";
}
