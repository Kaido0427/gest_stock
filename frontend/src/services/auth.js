// frontend/src/services/auth.js
const BASE_URL =import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function login(email, password) {
  console.log("🔵 Tentative de connexion à:", `${BASE_URL}/auth/login`);
  console.log("🔵 Données envoyées:", { email, password: "***" });
  
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    console.log("🔵 Statut de la réponse:", res.status);
    
    const data = await res.json();
    console.log("🔵 Données reçues:", data);

    if (!res.ok) {
      console.error("❌ Erreur:", data.error);
      return { error: data.error || "Erreur lors de la connexion" };
    }

    if (data.token) {
      localStorage.setItem("token", data.token);
      console.log("✅ Token stocké");
    }

    return data;
  } catch (err) {
    console.error("❌ Erreur de connexion:", err);
    return { error: "Impossible de joindre le serveur" };
  }
}

export const logout = async () => {
  const token = localStorage.getItem("token");
  console.log("🔵 Déconnexion - Token:", token ? "Présent" : "Absent");

  try {
    const res = await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    localStorage.removeItem("token");
    console.log("✅ Token supprimé du localStorage");

    if (!res.ok) {
      console.warn("⚠️ Erreur lors de la déconnexion backend");
    }

    return res.ok ? await res.json() : { message: "Déconnecté localement" };
  } catch (err) {
    localStorage.removeItem("token");
    console.error("❌ Erreur logout:", err);
    return { message: "Déconnecté localement" };
  }
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem("token");
  console.log("🔵 getCurrentUser - Token:", token ? "Présent" : "Absent");

  if (!token) {
    console.log("⚠️ Pas de token, utilisateur non connecté");
    return null;
  }

  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("🔵 /auth/me - Statut:", res.status);

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem("token");
        console.log("❌ Token invalide, supprimé");
      }
      return null;
    }

    const user = await res.json();
    console.log("✅ Utilisateur récupéré:", user);
    return user;
  } catch (err) {
    console.error("❌ Erreur getCurrentUser:", err);
    return null;
  }
};