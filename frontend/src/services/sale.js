// services/sale.js
const API_URL = "http://localhost:3000";

// ➤ Vendre une variante spécifique
export async function vendreProduit(produitId, variantId, quantity) {
  console.group("🧾 vendreProduit DEBUG");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const url = `${API_URL}/produit/${produitId}/vendre`;
    console.log("🌐 URL :", url);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({ variantId, quantity }),
    });

    console.log("✅ status :", res.status);

    const text = await res.text();
    console.log("📄 réponse brute :", text);

    const data = text ? JSON.parse(text) : {};

    if (!res.ok) {
      return { error: data?.error || data?.message || `HTTP ${res.status}` };
    }

    return data || { success: true };

  } catch (err) {
    console.error("🔥 erreur fetch :", err);

    if (err.name === "AbortError") {
      return { error: "Timeout backend" };
    }

    return { error: "Serveur injoignable" };

  } finally {
    clearTimeout(timeoutId);
    console.groupEnd();
  }
}


// ➤ Valider une vente complète
export async function validerVente(venteData) {
  try {
    const res = await fetch(`${API_URL}/ventes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(venteData),
    });

    const data = await res.json();
    if (!res.ok) return { error: data.error || "Erreur lors de la vente" };

    return data;
  } catch (err) {
    return { error: "Serveur injoignable" };
  }
}

// ➤ Récupérer l'historique des ventes
export async function getHistoriqueVentes(params = {}) {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/ventes?${queryParams}`);
    const data = await res.json();

    if (!res.ok) return { error: data.error || "Erreur récupération des ventes" };

    return data;
  } catch (err) {
    return { error: "Serveur injoignable" };
  }
}

// ➤ Récupérer les statistiques
export async function getStatistiquesVentes(periode = "jour") {
  try {
    const res = await fetch(`${API_URL}/ventes/stats?periode=${periode}`);
    const data = await res.json();

    if (!res.ok) return { error: data.error || "Erreur récupération des statistiques" };

    return data;
  } catch (err) {
    return { error: "Serveur injoignable" };
  }
}