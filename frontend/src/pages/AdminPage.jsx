import React, { useState } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, Shield, RefreshCw, ChevronDown } from "lucide-react";
import { useAdminStats, useTenants, useSetTenantStatus, useSetTenantPlan } from "../hooks/useAdmin";

const STATUS_COLORS = {
    active: "bg-emerald-100 text-emerald-700",
    trial: "bg-blue-100 text-blue-700",
    suspended: "bg-red-100 text-red-700",
    expired: "bg-slate-100 text-slate-600",
};

const PLAN_COLORS = {
    starter: "bg-slate-100 text-slate-600",
    business: "bg-blue-100 text-blue-700",
    enterprise: "bg-purple-100 text-purple-700",
};

function StatCard({ label, value, icon: Icon, accent, delay }) {
    const colors = {
        slate: "from-slate-800 to-slate-600",
        emerald: "from-emerald-500 to-teal-600",
        blue: "from-blue-500 to-indigo-600",
        amber: "from-amber-400 to-orange-500",
    };
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: "spring", stiffness: 200, damping: 20 }}
            className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg bg-gradient-to-br ${colors[accent]}`}>
            <div className="absolute -right-4 -top-4 opacity-20">
                <Icon className="w-20 h-20" strokeWidth={1} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-2">{label}</p>
            <p className="text-3xl font-black">{value}</p>
        </motion.div>
    );
}

const AdminPage = () => {
    const { data: stats, isLoading: loadingStats, refetch } = useAdminStats();
    const { data: tenantsData, isLoading: loadingTenants } = useTenants();
    const setStatus = useSetTenantStatus();
    const setPlan = useSetTenantPlan();

    const tenants = tenantsData?.tenants ?? [];
    const global = stats || {};

    const fmt = (n) => (n || 0).toLocaleString("fr-FR");

    return (
        <div className="min-h-screen bg-[#f5f6fa] p-3 sm:p-6">
            <div className="max-w-7xl mx-auto space-y-5">

                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-5 h-5 text-slate-700" />
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Super Admin</h1>
                        </div>
                        <p className="text-slate-500 text-sm">Vue globale de tous les tenants</p>
                    </div>
                    <button onClick={refetch} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 shadow-sm">
                        <RefreshCw className={`w-4 h-4 ${loadingStats ? "animate-spin" : ""}`} />
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard label="Tenants total" value={global.tenants?.total ?? 0} icon={Users} accent="slate" delay={0.05} />
                    <StatCard label="Actifs" value={global.tenants?.active ?? 0} icon={TrendingUp} accent="emerald" delay={0.1} />
                    <StatCard label="En essai" value={global.tenants?.trial ?? 0} icon={Users} accent="blue" delay={0.15} />
                    <StatCard label="MRR" value={`${fmt(global.mrr)} XOF`} icon={TrendingUp} accent="amber" delay={0.2} />
                </div>

                {/* Distribution plans */}
                {global.planDistribution && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <h2 className="font-black text-slate-900 mb-4">Distribution des plans</h2>
                        <div className="grid grid-cols-3 gap-3">
                            {global.planDistribution.map((p) => (
                                <div key={p._id} className={`rounded-xl p-3 text-center ${PLAN_COLORS[p._id] || "bg-slate-100 text-slate-600"}`}>
                                    <p className="text-2xl font-black">{p.count}</p>
                                    <p className="text-xs font-bold capitalize mt-0.5">{p._id}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tenants table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h2 className="font-black text-slate-900">Tous les tenants</h2>
                    </div>
                    {loadingTenants ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/70">
                                        {["Tenant", "Plan", "Statut", "Utilisateurs", "Actions"].map((h) => (
                                            <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {tenants.map((t) => (
                                        <tr key={t._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-slate-800 text-sm">{t.name}</p>
                                                <p className="text-xs text-slate-400">{t.ownerEmail}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${PLAN_COLORS[t.plan] || "bg-slate-100 text-slate-600"}`}>
                                                    {t.plan}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[t.status] || "bg-slate-100 text-slate-600"}`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-slate-600">{t.userCount ?? 0}</td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={t.status}
                                                        onChange={(e) => setStatus.mutate({ id: t._id, status: e.target.value })}
                                                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none">
                                                        <option value="active">Actif</option>
                                                        <option value="trial">Essai</option>
                                                        <option value="suspended">Suspendu</option>
                                                        <option value="expired">Expiré</option>
                                                    </select>
                                                    <select
                                                        value={t.plan}
                                                        onChange={(e) => setPlan.mutate({ id: t._id, plan: e.target.value })}
                                                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none">
                                                        <option value="starter">Starter</option>
                                                        <option value="business">Business</option>
                                                        <option value="enterprise">Enterprise</option>
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AdminPage;