import api from "./api";

export const getProduits = async (params = {}) => {
  const { data } = await api.get("/produits", { params });
  return data;
};

export const getProduit = async (id) => {
  const { data } = await api.get(`/produits/${id}`);
  return data;
};

export const addProduit = async (produit) => {
  const { data } = await api.post("/produits", produit);
  return data;
};

export const updateProduit = async (id, updates) => {
  const { data } = await api.put(`/produits/${id}`, updates);
  return data;
};

export const deleteProduit = async (id) => {
  const { data } = await api.delete(`/produits/${id}`);
  return data;
};

export const approvisionnerProduit = async (id, payload) => {
  const { data } = await api.post(`/produits/${id}/approvisionner`, payload);
  return data;
};

export const vendreProduit = async (id, payload) => {
  const { data } = await api.post(`/produits/${id}/vendre`, payload);
  return data;
};

export const transfertStock = async (payload) => {
  const { data } = await api.post("/produits/transfert-stock", payload);
  return data;
};

export const getAlertesStock = async (params = {}) => {
  const { data } = await api.get("/produits/alertes-stock", { params });
  return data;
};