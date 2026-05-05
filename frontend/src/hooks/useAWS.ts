import { useQuery } from "@tanstack/react-query";
import API from "../lib/api";

// 🔥 Hook to fetch AWS data from backend
export function useAWSData() {
  return useQuery({
    queryKey: ["aws-data"],

    queryFn: async () => {
      const response = await API.get("/costs"); // FastAPI endpoint
      return response.data;
    },

    // Auto refresh every 5 minutes
    refetchInterval: 5 * 60 * 1000,

    // Retry twice if request fails
    retry: 2,
  });
}
