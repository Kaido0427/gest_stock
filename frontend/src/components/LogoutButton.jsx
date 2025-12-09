import React from "react";
import { logout } from "../services/auth";
import { LogOut } from "lucide-react";

const LogoutButton = () => {
  const handleLogout = async () => {
    try {
      await logout(); // Appel à ton API pour supprimer le token côté backend
      localStorage.removeItem("token"); // supprime le token côté frontend
      window.location.href = "/login"; // redirige directement vers Login.jsx
    } catch (error) {
      console.error("Erreur logout:", error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
    >
      <LogOut className="w-5 h-5" />
      <span>Déconnexion</span>
    </button>
  );
};

export default LogoutButton;
