import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
});

export const login = async (data: any) => {
  const formData = new URLSearchParams();
  formData.append("username", data.email);
  formData.append("password", data.password);

  const res = await API.post("/auth/login", formData);
  return res.data;
};

export default API;