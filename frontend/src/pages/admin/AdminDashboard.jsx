import React from "react";
import { motion } from "framer-motion";
import {
    Users, TrendingUp, AlertCircle, Clock, RefreshCw,
    ArrowRight, CheckCircle, XCircle, Shield,
} from "lucide-react";
import { useAdminStats, usePlanRequests } from "../../hooks/useAdmin";

const ACCENT = {
    slate: "from-slate-800 to-slate-600",
    emerald: "from-emerald-500 to-teal-600",
    blue: "from-blue-500 to-indigo-600",
    amber: "from-amber-400 to-orange-500",
    red: "from-red-500 to-rose-600",
};

const StatCard = ({ label, value, icon: Icon, accent = "slate", sub, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, type: "spring", stiffness: 200, damping: 20 }}
        className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg bg-gradient-to-br ${ACCENT[accent]}`}
    >
        <div className="absolute -right-4 -top-4 opacity-20">
            <Icon className="w-20 h-20" strokeWidth={1} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">{label}</p>
        <p className="text-3xl font-black">{value}</p>
        {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
    </motion.div>
);

const AdminDashboard = ({ onNavigate }) => {
    const { data: stats, isLoading, refetch } = useAdminStats();
    const { data: requestsData } = usePlanRequests("pending");

    const s = stats || {};
    const pendingRequests = requestsData?.requests ?? [];
    const fmt = (n) => (n || 0).toLocaleString("fr-FR");

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Shield className="w-6 h-6 text-slate-700" />
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Tableau de bord Admin</h1>
                    </div>
                    <p className="text-slate-500 text-sm mt-0.5">Vue d'ensemble de la plateforme</p>
                </div>
                <button onClick={refetch} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 shadow-sm">
                    <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Tenants total" value={s.tenants?.total ?? 0} icon={Users} accent="slate" delay={0.05} />
                <StatCard label="Actifs" value={s.tenants?.active ?? 0} icon={CheckCircle} accent="emerald" delay={0.1} sub={`+${s.tenants?.newThisMonth ?? 0} ce mois`} />
                <StatCard label="En essai" value={s.tenants?.trial ?? 0} icon={Clock} accent="blue" delay={0.15} />
                <StatCard label="MRR" value={`${fmt(s.mrr)} XOF`} icon={TrendingUp} accent="amber" delay={0.2} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Alertes */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Demandes en attente */}
                    {pendingRequests.length > 0 && (
                        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                            className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-amber-600" />
                                    <h3 className="font-black text-amber-900">
                                        {pendingRequests.length} demande{pendingRequests.length > 1 ? "s" : ""} d'upgrade en attente
                                    </h3>
                                </div>
                                <button onClick={() => onNavigate("tenants")}
                                    className="flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900">
                                    Gérer <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {pendingRequests.slice(0, 3).map((r) => (
                                    <div key={r._id} className="bg-white rounded-xl px-3 py-2.5 border border-amber-200 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">
                                                {r.tenant_id?.name || "—"}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {r.currentPlan} → <span className="font-bold text-indigo-600">{r.requestedPlan}</span>
                                            </p>
                                        </div>
                                        <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                                            En attente
                                        </span>
                                    </div>
                                ))}
                                {pendingRequests.length > 3 && (
                                    <p className="text-xs text-amber-600 text-center">
                                        +{pendingRequests.length - 3} autre{pendingRequests.length - 3 > 1 ? "s" : ""}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Tenants suspendus */}
                    {(s.tenants?.suspended ?? 0) > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-red-600" />
                                <div>
                                    <p className="font-bold text-red-900">{s.tenants.suspended} tenant(s) suspendu(s)</p>
                                    <p className="text-xs text-red-600">Vérifiez les paiements en retard</p>
                                </div>
                            </div>
                            <button onClick={() => onNavigate("tenants")}
                                className="flex items-center gap-1 text-xs font-bold text-red-700 hover:text-red-900">
                                Voir <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Distribution plans */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <h3 className="font-black text-slate-900 mb-4">Distribution plans</h3>
                    {s.planDistribution?.length > 0 ? (
                        <div className="space-y-3">
                            {s.planDistribution.map((p) => {
                                const total = s.tenants?.total || 1;
                                const pct = Math.round((p.count / total) * 100);
                                const colors = { starter: "bg-slate-400", business: "bg-blue-500", enterprise: "bg-purple-500" };
                                return (
                                    <div key={p._id}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-semibold text-slate-700 capitalize">{p._id}</span>
                                            <span className="text-slate-500">{p.count} ({pct}%)</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ delay: 0.3, duration: 0.6 }}
                                                className={`h-full rounded-full ${colors[p._id] || "bg-slate-400"}`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 text-center py-4">Aucune donnée</p>
                    )}
                </div>
            </div>

            {/* Raccourcis */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                    { id: "tenants", label: "Gérer les tenants", sub: "Voir tous les comptes", color: "bg-blue-50 border-blue-200 text-blue-700" },
                    { id: "payments", label: "Enregistrer un paiement", sub: "Paiement manuel", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
                    { id: "config", label: "Configurer les plans", sub: "Modifier les limites", color: "bg-purple-50 border-purple-200 text-purple-700" },
                ].map((item) => (
                    <button key={item.id} onClick={() => onNavigate(item.id)}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 hover:shadow-md transition-all text-left ${item.color}`}>
                        <div>
                            <p className="font-bold text-sm">{item.label}</p>
                            <p className="text-xs opacity-70 mt-0.5">{item.sub}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 opacity-60" />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboard;