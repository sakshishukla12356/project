// AUTH
export const signup = async (data: any) => {
  const res = await API.post("/auth/signup", data);
  return res.data;
};

export const login = async (data: any) => {
  const formData = new URLSearchParams();
  formData.append("username", data.email);
  formData.append("password", data.password);

  const res = await API.post("/auth/login", formData);
  return res.data;
};

// DASHBOARD
export const getDashboard = async () => {
  const res = await API.get("/dashboard");
  return res.data;
};