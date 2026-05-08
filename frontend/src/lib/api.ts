import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const dashboardApi = {
  getStats: () => api.get("/dashboard/stats"),
  getCostData: () => api.get("/dashboard/cost-history"),
};

export const carbonApi = {
  getFootprint: () => api.get("/carbon/footprint"),
};

export const authApi = {
  login: (credentials: any) => api.post("/auth/login", credentials),
  signup: (userData: any) => api.post("/auth/signup", userData),
};

export default api;