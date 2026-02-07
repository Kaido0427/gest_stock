const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Récupérer toutes les boutiques
export const getAllBoutiques = async () => {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BASE_URL}/boutiques`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        const data = await res.json();

        if (!res.ok) {
            return { error: data.error || "Erreur lors de la récupération des boutiques" };
        }

        return data;
    } catch (err) {
        return { error: "Impossible de joindre le serveur" };
    }
};