import api from "./api";

export const login = async (email, password) => {
  try {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.token) localStorage.setItem("token", data.token);
    return data;
  } catch (err) {
    return { error: err.response?.data?.error || "Erreur de connexion" };
  }
};

export const register = async (email, password, name, boutiqueName) => {
  try {
    const { data } = await api.post("/auth/register", { email, password, name, boutiqueName });
    if (data.token) localStorage.setItem("token", data.token);
    return data;
  } catch (err) {
    return { error: err.response?.data?.error || "Erreur d'inscription" };
  }
};

export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } finally {
    localStorage.removeItem("token");
  }
};

export const getCurrentUser = async () => {
  try {
    const { data } = await api.get("/auth/me");
    return data;
  } catch {
    localStorage.removeItem("token");
    return null;
  }
};