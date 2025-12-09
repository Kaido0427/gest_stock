const API_URL = "http://localhost:3000/produits"; // base route pour produits

// ➤ Ajouter un produit
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

// ➤ Récupérer tous les produits
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

// ➤ Récupérer un produit par ID
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

// ➤ Modifier un produit (SANS modifier le stock)
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

// ➤ Supprimer un produit
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

// ➤ Approvisionner un produit
export async function approvisionnerProduit(id, payload) {
  try {
    const res = await fetch(`${API_URL}/${id}/approvisionner`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // { quantity, name?, expirationDate? }
    });

    const data = await res.json();
    if (!res.ok) return { error: data.error || "Erreur approvisionnement" };

    return data;
  } catch (err) {
    return { error: "Serveur injoignable" };
  }
}
