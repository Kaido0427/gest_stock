import api from "./api";

export const validerVente = async (venteData) => {
  const { data } = await api.post("/ventes", venteData);
  return data;
};

export const getHistoriqueVentes = async (params = {}) => {
  const { data } = await api.get("/ventes", { params });
  return data;
};

export const getVente = async (id) => {
  const { data } = await api.get(`/ventes/${id}`);
  return data;
};

export const getStatistiquesVentes = async (params = {}) => {
  const { data } = await api.get("/ventes/stats", { params });
  return data;
};