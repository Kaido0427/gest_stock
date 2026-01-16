const API_URL = "http://localhost:3000/produit";

// ➤ 1. Créer un produit avec variantes
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

// ➤ 6. Approvisionner une VARIANTE spécifique
export async function approvisionnerVariant(produitId, variantId, quantity) {
  try {
    const res = await fetch(`${API_URL}/${produitId}/approvisionner`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        variantId,
        quantity
      }),
    });

    const data = await res.json();
    if (!res.ok) return { error: data.error || "Erreur approvisionnement" };

    return data;
  } catch (err) {
    return { error: "Serveur injoignable" };
  }
}

// ➤ 7. Supprimer une variante
export async function deleteVariant(produitId, variantId) {
  try {
    const res = await fetch(`${API_URL}/${produitId}/variant`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        variantId
      }),
    });

    const data = await res.json();
    if (!res.ok) return { error: data.error || "Erreur suppression variante" };

    return data;
  } catch (err) {
    return { error: "Serveur injoignable" };
  }
}

// ➤ 8. Fonction helper pour ajouter une nouvelle variante à un produit existant
export async function addVariantToProduit(produitId, nouvelleVariante) {
  // Récupérer le produit actuel
  const produit = await getProduit(produitId);
  if (produit.error) return produit;

  // Ajouter la nouvelle variante à la liste existante
  const updatedVariants = [...produit.variants, nouvelleVariante];

  // Mettre à jour le produit
  return updateProduit(produitId, {
    ...produit,
    variants: updatedVariants
  });
}