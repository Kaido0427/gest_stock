const BASE_URL = "http://localhost:3000"; // l'URL de ton backend

export async function login(email, password) {
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Erreur lors de la connexion" };
    }

    return data; // { message: "Connexion réussie", token: "..." }
  } catch (err) {
    return { error: "Impossible de joindre le serveur" };
  }
}
