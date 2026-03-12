import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, RefreshCw, ChevronDown, Check, X, Clock,
    User, Calendar, AlertCircle, ArrowUpCircle,
} from "lucide-react";
import {
    useTenants, useSetTenantStatus, useSetTenantPlan,
    usePlanRequests, useProcessPlanRequest, useAdminPlans,
} from "../../hooks/useAdmin";
import { useToast, Toast } from "../../components/ui/Toast";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

const STATUS_COLORS = {
    active: "bg-emerald-100 text-emerald-700",
    trial: "bg-blue-100 text-blue-700",
    suspended: "bg-red-100 text-red-700",
    expired: "bg-slate-100 text-slate-500",
};

const PLAN_COLORS = {
    starter: "bg-slate-100 text-slate-600",
    business: "bg-blue-100 text-blue-700",
    enterprise: "bg-purple-100 text-purple-700",
};

// ─── Modal upgrade manuel ─────────────────────────────────────────────────────
const UpgradeModal = ({ tenant, plans, onClose, onConfirm, isPending }) => {
    const [plan, setPlan] = useState(tenant?.plan || "starter");
    const [duration, setDuration] = useState(1);
    const [note, setNote] = useState("");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full z-10">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-black text-slate-900">Modifier l'abonnement</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mb-4 p-3 bg-slate-50 rounded-xl">
                    <p className="text-sm font-semibold text-slate-700">{tenant?.name}</p>
                    <p className="text-xs text-slate-400">{tenant?.ownerEmail}</p>
                    <p className="text-xs text-slate-500 mt-1">
                        Plan actuel : <span className="font-bold">{tenant?.plan}</span>
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2">Nouveau plan</label>
                        <div className="grid grid-cols-1 gap-2">
                            {plans.map((p) => (
                                <button key={p.name} onClick={() => setPlan(p.name)}
                                    className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${plan === p.name ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"}`}>
                                    <div>
                                        <span className="font-bold text-sm text-slate-800">{p.label}</span>
                                        <span className="text-xs text-slate-400 ml-2">{p.price?.toLocaleString()} XOF/mois</span>
                                    </div>
                                    {plan === p.name && <Check className="w-4 h-4 text-slate-800" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2">Durée (mois)</label>
                        <div className="flex gap-2">
                            {[1, 3, 6, 12].map((d) => (
                                <button key={d} onClick={() => setDuration(d)}
                                    className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${duration === d ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                                    {d}m
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2">Note interne (optionnel)</label>
                        <input value={note} onChange={(e) => setNote(e.target.value)}
                            placeholder="Ex: Paiement Orange Money du 12/03"
                            className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20" />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
                        Annuler
                    </button>
                    <button
                        onClick={() => onConfirm({ plan, durationMonths: duration, note })}
                        disabled={isPending}
                        className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-700 disabled:opacity-50">
                        {isPending ? "..." : "Appliquer"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Panel demandes en attente ────────────────────────────────────────────────
const PlanRequestsPanel = ({ toast }) => {
    const { data, isLoading, refetch } = usePlanRequests("pending");
    const process = useProcessPlanRequest();
    const [processingId, setProcessingId] = useState(null);
    const [adminNote, setAdminNote] = useState("");

    const requests = data?.requests ?? [];

    const handleProcess = (id, action) => {
        setProcessingId(id);
        process.mutate({ id, action, adminNote },
            {
                onSuccess: (res) => {
                    toast.success(res.message);
                    setAdminNote("");
                    setProcessingId(null);
                },
                onError: (err) => {
                    toast.error(err.response?.data?.error || "Erreur");
                    setProcessingId(null);
                },
            }
        );
    };

    if (isLoading) return null;
    if (requests.length === 0) return (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-black text-slate-900 mb-2">Demandes d'upgrade</h2>
            <p className="text-sm text-slate-400 text-center py-4">Aucune demande en attente ✓</p>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-amber-100 bg-amber-50 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h2 className="font-black text-amber-900">
                    {requests.length} demande{requests.length > 1 ? "s" : ""} d'upgrade en attente
                </h2>
            </div>
            <div className="divide-y divide-slate-100">
                {requests.map((r) => (
                    <div key={r._id} className="p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <p className="font-bold text-slate-800">{r.tenant_id?.name || "—"}</p>
                                <p className="text-xs text-slate-400">{r.tenant_id?.ownerEmail}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PLAN_COLORS[r.currentPlan] || "bg-slate-100 text-slate-600"}`}>
                                        {r.currentPlan}
                                    </span>
                                    <ArrowUpCircle className="w-4 h-4 text-slate-400" />
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PLAN_COLORS[r.requestedPlan] || "bg-slate-100 text-slate-600"}`}>
                                        {r.requestedPlan}
                                    </span>
                                </div>
                                {r.message && (
                                    <p className="text-xs text-slate-500 mt-1 italic">"{r.message}"</p>
                                )}
                            </div>
                            <span className="text-xs text-slate-400">
                                {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <input value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                                placeholder="Note (optionnel)"
                                className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                            <button onClick={() => handleProcess(r._id, "approved")}
                                disabled={processingId === r._id}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Approuver
                            </button>
                            <button onClick={() => handleProcess(r._id, "rejected")}
                                disabled={processingId === r._id}
                                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-bold disabled:opacity-50 flex items-center gap-1">
                                <X className="w-3.5 h-3.5" /> Refuser
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Page principale ──────────────────────────────────────────────────────────
const AdminTenantsPage = () => {
    const toast = useToast();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const { data, isLoading, refetch } = useTenants({ status: statusFilter || undefined });
    const { data: plansData } = useAdminPlans();
    const setStatus = useSetTenantStatus();
    const setPlan = useSetTenantPlan();

    const [upgradeModal, setUpgradeModal] = useState(null); // tenant object
    const [confirmSuspend, setConfirmSuspend] = useState(null);

    const tenants = (data?.tenants ?? []).filter((t) =>
        !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.ownerEmail?.toLowerCase().includes(search.toLowerCase())
    );
    const plans = plansData?.plans ?? [];

    const handleStatusChange = (tenant, newStatus) => {
        if (newStatus === "suspended") {
            setConfirmSuspend({ tenant, newStatus });
            return;
        }
        setStatus.mutate({ id: tenant._id, status: newStatus }, {
            onSuccess: () => toast.success(`Statut mis à jour : ${newStatus}`),
            onError: (e) => toast.error(e.response?.data?.error || "Erreur"),
        });
    };

    const handlePlanChange = ({ plan, durationMonths, note }) => {
        setPlan.mutate({ id: upgradeModal._id, plan, durationMonths, note }, {
            onSuccess: (res) => {
                toast.success(res.message);
                setUpgradeModal(null);
            },
            onError: (e) => toast.error(e.response?.data?.error || "Erreur"),
        });
    };

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
            <Toast toasts={toast.toasts} onRemove={toast.remove} />

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-slate-900">Tenants & Abonnements</h1>
                <button onClick={refetch} className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : "text-slate-500"}`} />
                </button>
            </div>

            {/* Demandes en attente */}
            <PlanRequestsPanel toast={toast} />

            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher par nom ou email..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none text-slate-700">
                    <option value="">Tous les statuts</option>
                    <option value="active">Actif</option>
                    <option value="trial">En essai</option>
                    <option value="suspended">Suspendu</option>
                    <option value="expired">Expiré</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
                    </div>
                ) : tenants.length === 0 ? (
                    <p className="text-center text-slate-400 py-16 text-sm">Aucun tenant trouvé</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70">
                                    {["Tenant", "Plan", "Statut", "Expiration", "Utilisateurs", "Actions"].map((h) => (
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
                                            <select value={t.status}
                                                onChange={(e) => handleStatusChange(t, e.target.value)}
                                                className={`text-xs font-bold px-2.5 py-1 rounded-full border-0 focus:outline-none cursor-pointer ${STATUS_COLORS[t.status] || "bg-slate-100 text-slate-600"}`}>
                                                <option value="active">Actif</option>
                                                <option value="trial">Essai</option>
                                                <option value="suspended">Suspendu</option>
                                                <option value="expired">Expiré</option>
                                            </select>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-500">
                                            {t.activeSubscription
                                                ? new Date(t.activeSubscription.expiresAt).toLocaleDateString("fr-FR")
                                                : <span className="text-slate-300">—</span>}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-600">{t.userCount ?? 0}</td>
                                        <td className="px-5 py-4">
                                            <button onClick={() => setUpgradeModal(t)}
                                                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors">
                                                <ArrowUpCircle className="w-3.5 h-3.5" />
                                                Modifier plan
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal upgrade */}
            <AnimatePresence>
                {upgradeModal && (
                    <UpgradeModal
                        tenant={upgradeModal}
                        plans={plans}
                        onClose={() => setUpgradeModal(null)}
                        onConfirm={handlePlanChange}
                        isPending={setPlan.isPending}
                    />
                )}
            </AnimatePresence>

            {/* Confirm suspend */}
            <ConfirmModal
                isOpen={!!confirmSuspend}
                onClose={() => setConfirmSuspend(null)}
                title="Suspendre ce tenant ?"
                message={`Le compte de "${confirmSuspend?.tenant?.name}" sera bloqué. Les utilisateurs ne pourront plus se connecter.`}
                confirmLabel="Suspendre"
                onConfirm={() => {
                    setStatus.mutate({ id: confirmSuspend.tenant._id, status: "suspended" }, {
                        onSuccess: () => { toast.success("Compte suspendu"); setConfirmSuspend(null); },
                        onError: (e) => toast.error(e.response?.data?.error || "Erreur"),
                    });
                }}
                isPending={setStatus.isPending}
            />
        </div>
    );
};

export default AdminTenantsPage;