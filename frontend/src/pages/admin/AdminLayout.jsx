import React, { useState } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, CreditCard, Settings2, ChevronRight } from "lucide-react";
import AdminDashboard from "./AdminDashboard";
import AdminTenantsPage from "./AdminTenantsPage";
import AdminPaymentsPage from "./AdminPaymentsPage";
import AdminConfigPage from "./AdminConfigPage";

const ADMIN_TABS = [
    { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { id: "tenants", label: "Tenants & Abonnements", icon: Users },
    { id: "payments", label: "Paiements", icon: CreditCard },
    { id: "config", label: "Configuration", icon: Settings2 },
];

const AdminLayout = () => {
    const [activeTab, setActiveTab] = useState("dashboard");

    const pages = {
        dashboard: <AdminDashboard onNavigate={setActiveTab} />,
        tenants: <AdminTenantsPage />,
        payments: <AdminPaymentsPage />,
        config: <AdminConfigPage />,
    };

    return (
        <div className="min-h-screen bg-[#f5f6fa]">
            {/* Sub-navigation admin */}
            <div className="bg-white border-b border-slate-200 px-4 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto flex overflow-x-auto gap-1 py-1">
                    {ADMIN_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap text-sm font-semibold transition-all ${isActive
                                        ? "bg-slate-900 text-white shadow"
                                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Contenu */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {pages[activeTab]}
            </motion.div>
        </div>
    );
};

export default AdminLayout;