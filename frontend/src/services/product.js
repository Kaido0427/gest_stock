// frontend/src/services/product.js
const API_URL = "https://api.mahoutodji.online/produit";

// ➤ 1. Créer un produit
export async function addProduit(produit) {
  try {
    const res = await fetch(`${API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(produit),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Erreur lors de la création" };
    return data;
  } catch (err) {
    return { error: "Serveur injoignable" };
  }
}

// ➤ 2. Récupérer tous les produits
export async function getProduits() {
  try {
    const res = await fetch(`${API_URL}`);
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Erreur récupération produits" };
    return data;
  } catch (err) {
    return { error: "Serveur injoignable" };
  }
}

// ➤ 3. Récupérer un produit par ID
export async function getProduit(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`);
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Produit introuvable" };
    return data;
  } catch (err) {
    return { error: "Serveur injoignable" };
  }
}

// ➤ 4. Modifier un produit
export async function updateProduit(id, updates) {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Erreur modification produit" };
    return data;
  } catch (err) {
    return { error: "Serveur injoignable" };
  }
}

// ➤ 5. Supprimer un produit
export async function deleteProduit(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Erreur suppression produit" };
    return data;
  } catch (err) {
    return { error: "Serveur injoignable" };
  }
}

// ✅ Approvisionner un produit
export const approvisionnerProduit = async (productId, data) => {
  try {
    const res = await fetch(`${API_URL}/${productId}/approvisionner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    console.error("Erreur approvisionnerProduit:", error);
    return { error: error.message };
  }
};

// ✅ Transfert de stock entre boutiques
export const transfertStockBoutiques = async (data) => {
  try {
    const res = await fetch(`${API_URL}/transfert-stock`, { // ✅ Corrigé
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    console.error("Erreur transfertStockBoutiques:", error);
    return { error: error.message };
  }
};

// ➤ Récupérer les produits par boutique
export async function getProduitsByBoutique(boutiqueId) {
  try {
    const res = await fetch(`${API_URL}/boutique/${boutiqueId}`);
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Erreur récupération produits" };
    return data;
  } catch (err) {
    return { error: "Serveur injoignable" };
  }
}