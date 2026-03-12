import React from "react";
import { Menu, Store } from "lucide-react";

const TopBar = ({ onMenuOpen, tenantName }) => {
    return (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shadow-sm">
            <button
                onClick={onMenuOpen}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Ouvrir le menu"
            >
                <Menu className="w-5 h-5 text-slate-700" />
            </button>
            <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-slate-600" />
                <h1 className="text-base font-black text-slate-900">
                    {tenantName || "Ma Boutique"}
                </h1>
            </div>
        </div>
    );
};

export default TopBar;