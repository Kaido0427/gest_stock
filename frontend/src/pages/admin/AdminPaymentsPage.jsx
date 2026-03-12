import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Plus, RefreshCw, Search, X, Check, AlertTriangle } from "lucide-react";
import { useAdminPayments, useRecordManualPayment, useCancelSubscription, useAdminPlans, useTenants } from "../../hooks/useAdmin";
import { useToast, Toast } from "../../components/ui/Toast";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

const TYPE_COLORS = {
    manual: "bg-amber-100 text-amber-700",
    online: "bg-emerald-100 text-emerald-700",
};

const STATUS_COLORS = {
    active: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-slate-100 text-slate-500",
    expired: "bg-red-100 text-red-600",
};

// ─── Modal paiement manuel ────────────────────────────────────────────────────
const ManualPaymentModal = ({ onClose, onConfirm, isPending, tenants, plans }) => {
    const [form, setForm] = useState({
        tenant_id: "",
        plan: "starter",
        amount: "",
        paymentRef: "",
        durationMonths: 1,
        paymentDate: new Date().toISOString().split("T")[0],
        note: "",
    });

    const selectedPlan = plans.find((p) => p.name === form.plan);
    const suggestedAmount = selectedPlan?.price ?? 0;

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full z-10 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <CreditCard className="w-4 h-4 text-emerald-600" />
                        </div>
                        <h3 className="font-black text-slate-900">Enregistrer un paiement manuel</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Tenant *</label>
                        <select value={form.tenant_id} onChange={(e) => set("tenant_id", e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none text-slate-700">
                            <option value="">— Sélectionner un tenant —</option>
                            {tenants.map((t) => (
                                <option key={t._id} value={t._id}>{t.name} ({t.ownerEmail})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Plan *</label>
                            <select value={form.plan} onChange={(e) => { set("plan", e.target.value); set("amount", plans.find(p => p.name === e.target.value)?.price ?? ""); }}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none text-slate-700">
                                {plans.map((p) => (
                                    <option key={p.name} value={p.name}>{p.label} — {p.price?.toLocaleString()} XOF</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Durée (mois)</label>
                            <div className="flex gap-1">
                                {[1, 3, 6, 12].map((d) => (
                                    <button key={d} onClick={() => set("durationMonths", d)}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${form.durationMonths === d ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                                        {d}m
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">
                                Montant reçu (XOF)
                                {suggestedAmount > 0 && (
                                    <button onClick={() => set("amount", suggestedAmount * form.durationMonths)}
                                        className="ml-2 text-indigo-600 text-[10px] underline">
                                        Auto ({(suggestedAmount * form.durationMonths).toLocaleString()})
                                    </button>
                                )}
                            </label>
                            <input type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)}
                                placeholder="Ex: 8000"
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Date du paiement</label>
                            <input type="date" value={form.paymentDate} onChange={(e) => set("paymentDate", e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Référence paiement (optionnel)</label>
                        <input value={form.paymentRef} onChange={(e) => set("paymentRef", e.target.value)}
                            placeholder="Ex: OM-2024-001, Wave-XYZ..."
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Note</label>
                        <textarea value={form.note} onChange={(e) => set("note", e.target.value)}
                            placeholder="Ex: Paiement par virement, confirmé par téléphone..."
                            rows={2}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none" />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
                        Annuler
                    </button>
                    <button
                        onClick={() => onConfirm(form)}
                        disabled={isPending || !form.tenant_id || !form.plan}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold disabled:opacity-50">
                        {isPending ? "..." : "Enregistrer le paiement"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Page principale ──────────────────────────────────────────────────────────
const AdminPaymentsPage = () => {
    const toast = useToast();
    const [typeFilter, setTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(null);

    const { data, isLoading, refetch } = useAdminPayments({ type: typeFilter || undefined, status: statusFilter || undefined });
    const { data: plansData } = useAdminPlans();
    const { data: tenantsData } = useTenants({ limit: 200 });
    const recordPayment = useRecordManualPayment();
    const cancelSub = useCancelSubscription();

    const payments = data?.payments ?? [];
    const plans = plansData?.plans ?? [];
    const tenants = tenantsData?.tenants ?? [];
    const mrr = data?.stats?.mrr ?? 0;

    const handleRecord = (form) => {
        recordPayment.mutate(
            { ...form, amount: form.amount ? Number(form.amount) : undefined },
            {
                onSuccess: (res) => { toast.success(res.message); setShowModal(false); },
                onError: (e) => toast.error(e.response?.data?.error || "Erreur"),
            }
        );
    };

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
            <Toast toasts={toast.toasts} onRemove={toast.remove} />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Paiements</h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        MRR : <span className="font-bold text-emerald-600">{mrr.toLocaleString()} XOF</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={refetch} className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-slate-700" : "text-slate-500"}`} />
                    </button>
                    <button onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-700 shadow-sm">
                        <Plus className="w-4 h-4" />
                        Paiement manuel
                    </button>
                </div>
            </div>

            {/* Filtres */}
            <div className="flex gap-3 flex-wrap">
                {[
                    { value: "", label: "Tous types" },
                    { value: "manual", label: "Manuel" },
                    { value: "online", label: "En ligne" },
                ].map((f) => (
                    <button key={f.value} onClick={() => setTypeFilter(f.value)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${typeFilter === f.value ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                        {f.label}
                    </button>
                ))}
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none text-slate-700">
                    <option value="">Tous statuts</option>
                    <option value="active">Actif</option>
                    <option value="cancelled">Annulé</option>
                    <option value="expired">Expiré</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
                    </div>
                ) : payments.length === 0 ? (
                    <p className="text-center text-slate-400 py-16 text-sm">Aucun paiement trouvé</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70">
                                    {["Tenant", "Plan", "Montant", "Type", "Statut", "Période", "Réf.", "Actions"].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((p) => (
                                    <tr key={p._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                        <td className="px-4 py-3.5">
                                            <p className="font-semibold text-slate-800 text-sm">{p.tenant_id?.name || "—"}</p>
                                            <p className="text-xs text-slate-400">{p.tenant_id?.ownerEmail}</p>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="text-xs font-bold capitalize text-slate-700">{p.plan}</span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="font-bold text-sm text-slate-800">
                                                {p.amount?.toLocaleString()} {p.currency}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${TYPE_COLORS[p.paymentType]}`}>
                                                {p.paymentType === "manual" ? "Manuel" : "En ligne"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[p.status]}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-slate-500">
                                            <div>{new Date(p.startsAt).toLocaleDateString("fr-FR")}</div>
                                            <div>→ {new Date(p.expiresAt).toLocaleDateString("fr-FR")}</div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="text-xs text-slate-400 font-mono">{p.paymentRef?.slice(0, 16) || "—"}</span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {p.status === "active" && (
                                                <button onClick={() => setConfirmCancel(p)}
                                                    className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-colors">
                                                    Annuler
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal paiement manuel */}
            <AnimatePresence>
                {showModal && (
                    <ManualPaymentModal
                        onClose={() => setShowModal(false)}
                        onConfirm={handleRecord}
                        isPending={recordPayment.isPending}
                        tenants={tenants}
                        plans={plans}
                    />
                )}
            </AnimatePresence>

            {/* Confirm annulation */}
            <ConfirmModal
                isOpen={!!confirmCancel}
                onClose={() => setConfirmCancel(null)}
                title="Annuler cet abonnement ?"
                message={`L'abonnement ${confirmCancel?.plan} de "${confirmCancel?.tenant_id?.name}" sera annulé et le compte passera en expiré.`}
                confirmLabel="Annuler l'abonnement"
                onConfirm={() => {
                    cancelSub.mutate(confirmCancel._id, {
                        onSuccess: () => { toast.success("Abonnement annulé"); setConfirmCancel(null); },
                        onError: (e) => toast.error(e.response?.data?.error || "Erreur"),
                    });
                }}
                isPending={cancelSub.isPending}
            />
        </div>
    );
};

export default AdminPaymentsPage;