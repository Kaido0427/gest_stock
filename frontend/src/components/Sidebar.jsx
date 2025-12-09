import React from "react";
import {
  Home,
  ShoppingCart,
  Package,
  FileText,
  Settings,
  X,
} from "lucide-react";
import LogoutButton from "./LogoutButton";

const Sidebar = ({ currentPage, onPageChange, onLogout, isOpen, onClose }) => {
  const menuItems = [
    { id: "dashboard", label: "Tableau de bord", icon: Home },
    { id: "sales", label: "Ventes / Caisse", icon: ShoppingCart },
    { id: "products", label: "Produits", icon: Package },
    { id: "reports", label: "Rapports", icon: FileText },
    { id: "settings", label: "Paramètres", icon: Settings },
  ];

  const handleNavigation = (id) => {
    onPageChange(id);
    // Ferme la sidebar sur mobile après navigation
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay sombre sur mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg flex flex-col h-full transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-blue-600">
              Ma Boutique
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">Gestion complète</p>
          </div>
          {/* Bouton fermer visible uniquement sur mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPage === item.id
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm sm:text-base">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bouton de déconnexion en bas */}
        <div className="p-4 border-t">
          <LogoutButton onLogout={onLogout} />
        </div>
      </div>
    </>
  );
};

export default Sidebar;