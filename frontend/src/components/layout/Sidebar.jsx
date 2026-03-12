import React from "react";
import {
  Home, ShoppingCart, Package, FileText,
  Settings, X, Store, Shield,
  CreditCard, ChevronRight, LayoutDashboard,
} from "lucide-react";

const MENU = [
  {
    id: "dashboard",
    label: "Tableau de bord",
    icon: Home,
    roles: ["owner", "manager", "employe"],
  },
  {
    id: "ventes",
    label: "Caisse / Ventes",
    icon: ShoppingCart,
    roles: ["owner", "manager", "employe"],
  },
  {
    id: "produits",
    label: "Produits",
    icon: Package,
    roles: ["owner", "manager"],
  },
  {
    id: "rapports",
    label: "Rapports",
    icon: FileText,
    roles: ["owner", "manager"],
  },
  {
    id: "compte",
    label: "Mon compte",
    icon: Settings,
    roles: ["owner"],
  },
  {
    id: "admin",
    label: "Back-office",
    icon: LayoutDashboard,
    roles: ["super_admin"],
  },
];

const NavItem = ({ item, isActive, onClick, isAdmin }) => {
  const Icon = item.icon;
  return (
    <button
      onClick={() => onClick(item.id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group ${
        isActive
          ? isAdmin
            ? "bg-indigo-600 text-white shadow-md"
            : "bg-slate-900 text-white shadow-md"
          : isAdmin
          ? "text-slate-300 hover:bg-white/10 hover:text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <Icon
        className={`w-5 h-5 flex-shrink-0 ${
          isActive ? "text-white" : isAdmin ? "text-slate-400 group-hover:text-white" : "text-slate-500 group-hover:text-slate-700"
        }`}
      />
      <span className="text-sm font-semibold flex-1">{item.label}</span>
      {isActive && <ChevronRight className="w-4 h-4 opacity-60" />}
    </button>
  );
};

const Sidebar = ({ currentPage, onPageChange, onLogout, isOpen, onClose, user }) => {
  const role = user?.role || "employe";
  const isAdmin = role === "super_admin";

  const tenantName = user?.tenant?.name || "Ma Boutique";
  const plan = user?.tenant?.plan || "starter";
  const planLabel = { starter: "Starter", business: "Business", enterprise: "Enterprise" };
  const planColor = {
    enterprise: "bg-purple-100 text-purple-700",
    business: "bg-blue-100 text-blue-700",
    starter: "bg-slate-100 text-slate-600",
  };

  const filtered = MENU.filter((item) => item.roles.includes(role));

  const handleNav = (id) => {
    onPageChange(id);
    if (window.innerWidth < 1024) onClose();
  };

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col h-full transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isAdmin ? "bg-slate-900 border-r border-slate-700" : "bg-white border-r border-slate-200"}
        `}
      >
        {/* ── Header : différent selon le rôle ── */}
        {isAdmin ? (
          /* Backoffice header */
          <div className="p-5 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-black text-white">GestStock</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Back-office
                </span>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-700 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* Tenant header */
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Store className="w-5 h-5 text-slate-700 flex-shrink-0" />
                <h1 className="text-base font-black text-slate-900 truncate">{tenantName}</h1>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${planColor[plan] || planColor.starter}`}>
                {planLabel[plan] || plan}
              </span>
            </div>
            <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ── User info ── */}
        <div className={`px-4 py-3 border-b ${isAdmin ? "border-slate-700" : "border-slate-100"}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${isAdmin ? "bg-indigo-600 text-white" : "bg-slate-900 text-white"}`}>
              {(user?.name || user?.email || "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-semibold truncate ${isAdmin ? "text-white" : "text-slate-800"}`}>
                {user?.name || user?.email}
              </p>
              <p className={`text-[10px] capitalize ${isAdmin ? "text-indigo-400" : "text-slate-400"}`}>
                {isAdmin ? "Administrateur" : role}
              </p>
            </div>
          </div>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {filtered.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={currentPage === item.id}
              onClick={handleNav}
              isAdmin={isAdmin}
            />
          ))}
        </nav>

        {/* ── Trial banner (tenants uniquement) ── */}
        {!isAdmin && user?.tenant?.status === "trial" && (
          <div className="mx-3 mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-3.5 h-3.5 text-amber-600" />
              <p className="text-xs font-bold text-amber-700">Période d'essai</p>
            </div>
            <p className="text-[10px] text-amber-600">
              Souscrivez pour continuer après la période d'essai.
            </p>
            <button
              onClick={() => handleNav("compte")}
              className="mt-2 w-full text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white py-1.5 rounded-lg transition-colors"
            >
              Voir les plans
            </button>
          </div>
        )}

        {/* ── Logout ── */}
        <div className={`p-3 border-t ${isAdmin ? "border-slate-700" : "border-slate-100"}`}>
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-semibold ${
              isAdmin
                ? "text-slate-400 hover:bg-slate-800 hover:text-red-400"
                : "text-red-500 hover:bg-red-50"
            }`}
          >
            <X className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;