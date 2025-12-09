import React from "react";
import {
  Home,
  ShoppingCart,
  Package,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import LogoutButton from "./LogoutButton"; 

const Sidebar = ({ currentPage, onPageChange, onLogout }) => {
  const menuItems = [
    { id: "dashboard", label: "Tableau de bord", icon: Home },
    { id: "sales", label: "Ventes / Caisse", icon: ShoppingCart },
    { id: "products", label: "Produits", icon: Package },
    { id: "reports", label: "Rapports", icon: FileText },
    { id: "settings", label: "Paramètres", icon: Settings },
  ];

  return (
    <div className="w-64 bg-white shadow-lg flex-shrink-0 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-blue-600">Ma Boutique</h1>
        <p className="text-sm text-gray-500">Gestion complète</p>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPage === item.id
                  ? "bg-blue-50 text-blue-600 font-semibold"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bouton de déconnexion en bas */}
      <div className="p-4 border-t">
        <LogoutButton onLogout={onLogout} />
      </div>
    </div>
  );
};

export default Sidebar;
