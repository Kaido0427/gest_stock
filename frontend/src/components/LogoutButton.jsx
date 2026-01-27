import React from "react";
import { logout } from "../services/auth";
import { LogOut } from "lucide-react";

const LogoutButton = () => {
  const handleLogout = async () => {
    try {
   
      await logout();
      localStorage.removeItem("token");

      window.location.href = "/login";
    } catch (error) {
      console.error("❌ Erreur logout:", error);
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
