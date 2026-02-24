// frontend/src/services/product.js
const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/produit`
  : "http://localhost:3000/produit";

// ─── helpers ──────────────────────────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || `Erreur HTTP ${res.status}` };
    return data;
  } catch {
    return { error: "Serveur injoignable" };
  }
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const addProduitMultiBoutiques = (produitData) =>
  apiFetch(`${API_URL}/multi-boutiques`, { method: "POST", body: JSON.stringify(produitData) });

export const addProduit = (produit) =>
  apiFetch(`${API_URL}`, { method: "POST", body: JSON.stringify(produit) });

// ─── READ ─────────────────────────────────────────────────────────────────────

// ✅ FIX : Support pagination + filtre boutique côté API
// params: { page, limit, boutique_id }
export async function getProduits(params = {}) {
  const qs = new URLSearchParams();
  if (params.page)       qs.set("page", params.page);
  if (params.limit)      qs.set("limit", params.limit);
  if (params.boutique_id) qs.set("boutique_id", params.boutique_id);

  const query = qs.toString() ? `?${qs}` : "";
  return apiFetch(`${API_URL}${query}`);
}

export const getProduit = (id) => apiFetch(`${API_URL}/${id}`);

export const getProduitsByBoutique = (boutiqueId) =>
  apiFetch(`${API_URL}/boutique/${boutiqueId}`);

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updateProduit = (id, updates) =>
  apiFetch(`${API_URL}/${id}`, { method: "PUT", body: JSON.stringify(updates) });

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deleteProduit = (id) =>
  apiFetch(`${API_URL}/${id}`, { method: "DELETE" });

// ─── STOCK OPS ────────────────────────────────────────────────────────────────
export const approvisionnerProduit = (productId, data) =>
  apiFetch(`${API_URL}/${productId}/approvisionner`, { method: "POST", body: JSON.stringify(data) });

export const transfertStockBoutiques = (data) =>
  apiFetch(`${API_URL}/transfert-stock`, { method: "POST", body: JSON.stringify(data) });