import { useQuery } from "@tanstack/react-query";
import API from "../lib/api";

// 🔥 Hook to fetch AWS data from backend
export function useAWSData(type: string = "all") {
  return useQuery({
    queryKey: ["aws-data", type],

    queryFn: async () => {
      // Map frontend request types to backend endpoints
      const endpointMap: Record<string, string> = {
        "all": "/aws/costs",
        "cost-by-service": "/aws/costs",
        "cost-daily": "/aws/costs",
        "resources": "/aws/resources",
        "summary": "/aws/summary"
      };

      const endpoint = endpointMap[type] || "/aws/costs";
      const response = await API.get(endpoint);
      return response.data;
    },

    // Auto refresh every 5 minutes
    refetchInterval: 5 * 60 * 1000,

    // Retry twice if request fails
    retry: 2,
  });
}
