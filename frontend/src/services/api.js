import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    timeout: 10000,
    headers: { "Content-Type": "application/json" },
});

// Injecter le token automatiquement
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Ne pas rediriger sur 401 — laisser getCurrentUser retourner null
api.interceptors.response.use(
    (res) => res,
    (error) => Promise.reject(error)
);

export default api;