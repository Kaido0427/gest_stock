// services/sale.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// services/sale.js

// ➤ Vendre un produit (sans variante)
export async function vendreProduit(produitId, quantity, unit = null, customPrice = null) {
  console.group("🧾 vendreProduit DEBUG");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const url = `${API_URL}/produit/${produitId}/vendre`;
    console.log("🌐 URL :", url);

    // Construire le payload
    const payload = {
      quantity: parseFloat(quantity),  // ✅ Nombre
      unit: unit || undefined,         // ✅ Unité (optionnel)
      customPrice: customPrice !== null && customPrice !== undefined
        ? parseFloat(customPrice)
        : undefined
    };

    console.log("📦 Payload :", payload);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify(payload),
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
    const res = await fetch(`${API_URL}/ventes`, { // ✅ Corrigé la syntaxe
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(venteData),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || "Erreur lors de la vente" };
    }

    return data;

  } catch (err) {
    console.error("🔥 erreur validerVente :", err);
    return { error: "Serveur injoignable" };
  }
}

/**
 * Récupérer les statistiques de ventes
 * @param {string} periode - "jour", "mois", "annee"
 * @param {string|null} boutiqueId - ID de la boutique (optionnel)
 */
export async function getStatistiquesVentes(periode = "jour", boutiqueId = null) {
  try {
    const url = boutiqueId
      ? `${API_URL}/ventes/stats?periode=${periode}&boutique_id=${boutiqueId}`
      : `${API_URL}/ventes/stats?periode=${periode}`;

    console.log("📊 Fetching stats:", url);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Stats error:", data);
      return { error: data.error || "Erreur récupération des statistiques" };
    }

    console.log("✅ Stats received:", data);
    return data;
  } catch (err) {
    console.error("❌ Stats fetch error:", err);
    return { error: "Serveur injoignable" };
  }
}

/**
 * Récupérer l'historique des ventes
 * @param {Object} params - Paramètres de filtrage
 * @param {number} params.limit - Nombre de résultats
 * @param {string} params.boutiqueId - ID de la boutique
 * @param {string} params.dateFrom - Date de début
 * @param {string} params.dateTo - Date de fin
 */
export async function getHistoriqueVentes(params = {}) {
  try {
    const queryParams = new URLSearchParams();

    if (params.limit) queryParams.append("limit", params.limit);
    if (params.boutiqueId) queryParams.append("boutique_id", params.boutiqueId);
    if (params.dateFrom) queryParams.append("dateFrom", params.dateFrom);
    if (params.dateTo) queryParams.append("dateTo", params.dateTo);
    if (params.page) queryParams.append("page", params.page);

    // ✅ FIX: Utiliser des parenthèses () au lieu de backticks `` pour fetch
    const url = `${API_URL}/ventes?${queryParams}`;
    console.log("🛒 Fetching sales:", url);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Sales error:", data);
      return { error: data.error || "Erreur récupération ventes" };
    }

    console.log("✅ Sales received:", data);
    return data;
  } catch (err) {
    console.error("❌ Sales fetch error:", err);
    return { error: "Serveur injoignable" };
  }
}

/**
 * Récupérer les alertes de stock faible
 * @param {number} seuil - Seuil d'alerte (défaut: 10)
 * @param {string|null} boutiqueId - ID de la boutique (optionnel)
 */
export async function getAlertesStock(seuil = 10, boutiqueId = null) {
  try {
    const url = boutiqueId
      ? `${API_URL}/produit/alertes-stock?seuil=${seuil}&boutique_id=${boutiqueId}`
      : `${API_URL}/produit/alertes-stock?seuil=${seuil}`;

    console.log("⚠️ Fetching stock alerts:", url);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Alerts error:", data);
      return { error: data.error || "Erreur récupération alertes stock" };
    }

    console.log("✅ Alerts received:", data);
    return data;
  } catch (err) {
    console.error("❌ Alerts fetch error:", err);
    return { error: "Serveur injoignable" };
  }
}

// NOUVEAU : Récupérer la liste des boutiques
export async function getBoutiques() {
  try {
    const res = await fetch(`${API_URL}/boutiques`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Erreur récupération boutiques" };
    return data;
  } catch (err) {
    return { error: "Serveur injoignable" };
  }
}