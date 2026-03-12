import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Settings2, Plus, Edit3, Trash2, ToggleLeft, ToggleRight,
    X, Check, RefreshCw, AlertTriangle, Infinity,
} from "lucide-react";
import {
    useAdminPlans, useCreatePlan, useUpdatePlan, useDeletePlan, useTogglePlan,
} from "../../hooks/useAdmin";
import { useToast, Toast } from "../../components/ui/Toast";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

const COLORS = ["slate", "blue", "purple", "emerald", "amber", "rose", "indigo"];
const COLOR_STYLES = {
    slate: "bg-slate-100 text-slate-700 border-slate-300",
    blue: "bg-blue-100 text-blue-700 border-blue-300",
    purple: "bg-purple-100 text-purple-700 border-purple-300",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-300",
    amber: "bg-amber-100 text-amber-700 border-amber-300",
    rose: "bg-rose-100 text-rose-700 border-rose-300",
    indigo: "bg-indigo-100 text-indigo-700 border-indigo-300",
};

const DEFAULT_FEATURES = [
    { key: "transfertInterBoutiques", label: "Transfert de stock entre boutiques" },
    { key: "statsAvancees", label: "Statistiques avancées" },
    { key: "export", label: "Export de données" },
];

const inputCls = "w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20 text-slate-800 placeholder-slate-400";

// ─── Form de plan (création / édition) ───────────────────────────────────────
const PlanForm = ({ initial, onClose, onSave, isPending }) => {
    const isEdit = !!initial?._id;

    const [form, setForm] = useState({
        name: initial?.name || "",
        label: initial?.label || "",
        price: initial?.price ?? 0,
        description: initial?.description || "",
        color: initial?.color || "slate",
        sortOrder: initial?.sortOrder ?? 99,
        isActive: initial?.isActive ?? true,
        isDefault: initial?.isDefault ?? false,
        limits: {
            boutiques: initial?.limits?.boutiques ?? 0,
            produits: initial?.limits?.produits ?? 100,
            employes: initial?.limits?.employes ?? 1,
            historiqueJours: initial?.limits?.historiqueJours ?? 30,
        },
        features: {
            transfertInterBoutiques: initial?.features?.transfertInterBoutiques ?? false,
            statsAvancees: initial?.features?.statsAvancees ?? false,
            export: initial?.features?.export ?? false,
        },
        // Features custom supplémentaires
        extraFeatures: Object.entries(initial?.features || {})
            .filter(([k]) => !["transfertInterBoutiques", "statsAvancees", "export"].includes(k))
            .map(([k, v]) => ({ key: k, label: k, enabled: Boolean(v) })),
    });

    const [newFeatureKey, setNewFeatureKey] = useState("");

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const setLimit = (k, v) => setForm((f) => ({ ...f, limits: { ...f.limits, [k]: v } }));
    const setFeature = (k, v) => setForm((f) => ({ ...f, features: { ...f.features, [k]: v } }));

    const addExtraFeature = () => {
        if (!newFeatureKey.trim()) return;
        setForm((f) => ({
            ...f,
            features: { ...f.features, [newFeatureKey.trim()]: false },
            extraFeatures: [...f.extraFeatures, { key: newFeatureKey.trim(), label: newFeatureKey.trim(), enabled: false }],
        }));
        setNewFeatureKey("");
    };

    const handleSave = () => {
        const payload = {
            ...form,
            price: Number(form.price),
            sortOrder: Number(form.sortOrder),
            limits: {
                boutiques: Number(form.limits.boutiques),
                produits: Number(form.limits.produits),
                employes: Number(form.limits.employes),
                historiqueJours: Number(form.limits.historiqueJours),
            },
        };
        delete payload.extraFeatures;
        if (isEdit) payload.id = initial._id;
        onSave(payload);
    };

    const LimitField = ({ label, field, hint }) => (
        <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
                {label}
                <span className="font-normal text-slate-400 ml-1">(-1 = illimité)</span>
            </label>
            <div className="flex items-center gap-2">
                <input type="number" value={form.limits[field]}
                    onChange={(e) => setLimit(field, parseInt(e.target.value))}
                    className={inputCls} min={-1} />
                {form.limits[field] === -1 && (
                    <Infinity className="w-5 h-5 text-purple-500 flex-shrink-0" />
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full z-10 max-h-[92vh] overflow-y-auto">

                <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                    <h3 className="font-black text-slate-900">{isEdit ? "Modifier le plan" : "Créer un plan"}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Infos de base */}
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Informations de base</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Nom interne *</label>
                                <input value={form.name} onChange={(e) => set("name", e.target.value)}
                                    placeholder="ex: starter, business..." disabled={isEdit}
                                    className={`${inputCls} ${isEdit ? "opacity-50 cursor-not-allowed" : ""}`} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Label affiché *</label>
                                <input value={form.label} onChange={(e) => set("label", e.target.value)}
                                    placeholder="ex: Starter, Business Pro..."
                                    className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Prix mensuel (XOF) *</label>
                                <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)}
                                    placeholder="Ex: 8000"
                                    className={inputCls} min={0} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Ordre d'affichage</label>
                                <input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)}
                                    className={inputCls} min={1} />
                            </div>
                        </div>
                        <div className="mt-3">
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Description</label>
                            <input value={form.description} onChange={(e) => set("description", e.target.value)}
                                placeholder="Ex: Idéal pour les petites boutiques"
                                className={inputCls} />
                        </div>
                    </div>

                    {/* Couleur */}
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Couleur</h4>
                        <div className="flex gap-2 flex-wrap">
                            {COLORS.map((c) => (
                                <button key={c} onClick={() => set("color", c)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${COLOR_STYLES[c]} ${form.color === c ? "ring-2 ring-offset-1 ring-slate-900" : ""}`}>
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Limites */}
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Quotas</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <LimitField label="Boutiques annexes" field="boutiques" />
                            <LimitField label="Produits" field="produits" />
                            <LimitField label="Employés" field="employes" />
                            <LimitField label="Historique (jours)" field="historiqueJours" />
                        </div>
                    </div>

                    {/* Features */}
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Fonctionnalités</h4>
                        <div className="space-y-2">
                            {DEFAULT_FEATURES.map((f) => (
                                <div key={f.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <span className="text-sm text-slate-700">{f.label}</span>
                                    <button onClick={() => setFeature(f.key, !form.features[f.key])}
                                        className={`transition-colors ${form.features[f.key] ? "text-emerald-600" : "text-slate-300"}`}>
                                        {form.features[f.key]
                                            ? <ToggleRight className="w-8 h-8" />
                                            : <ToggleLeft className="w-8 h-8" />}
                                    </button>
                                </div>
                            ))}

                            {/* Features custom */}
                            {form.extraFeatures.map((f) => (
                                <div key={f.key} className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                                    <span className="text-sm text-indigo-700 font-medium">{f.label}</span>
                                    <button onClick={() => {
                                        setFeature(f.key, !form.features[f.key]);
                                        setForm((prev) => ({
                                            ...prev,
                                            extraFeatures: prev.extraFeatures.map((ef) =>
                                                ef.key === f.key ? { ...ef, enabled: !ef.enabled } : ef
                                            ),
                                        }));
                                    }}
                                        className={`transition-colors ${form.features[f.key] ? "text-indigo-600" : "text-slate-300"}`}>
                                        {form.features[f.key]
                                            ? <ToggleRight className="w-8 h-8" />
                                            : <ToggleLeft className="w-8 h-8" />}
                                    </button>
                                </div>
                            ))}

                            {/* Ajouter feature custom */}
                            <div className="flex gap-2 mt-2">
                                <input value={newFeatureKey} onChange={(e) => setNewFeatureKey(e.target.value)}
                                    placeholder="Nouvelle fonctionnalité (ex: api_access)"
                                    onKeyDown={(e) => e.key === "Enter" && addExtraFeature()}
                                    className="flex-1 px-3 py-2 text-xs bg-white border border-dashed border-slate-300 rounded-xl focus:outline-none text-slate-600 placeholder-slate-400" />
                                <button onClick={addExtraFeature}
                                    className="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl text-xs font-bold">
                                    + Ajouter
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)}
                                className="w-4 h-4 rounded" />
                            <span className="text-sm text-slate-700">Plan actif (visible)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.isDefault} onChange={(e) => set("isDefault", e.target.checked)}
                                className="w-4 h-4 rounded" />
                            <span className="text-sm text-slate-700">Plan par défaut (nouveaux tenants)</span>
                        </label>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-3 rounded-b-2xl">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
                        Annuler
                    </button>
                    <button onClick={handleSave} disabled={isPending || !form.name || !form.label}
                        className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-sm font-bold disabled:opacity-50">
                        {isPending ? "..." : isEdit ? "Enregistrer" : "Créer le plan"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Page principale ──────────────────────────────────────────────────────────
const AdminConfigPage = () => {
    const toast = useToast();
    const { data, isLoading, refetch } = useAdminPlans();
    const createPlan = useCreatePlan();
    const updatePlan = useUpdatePlan();
    const deletePlan = useDeletePlan();
    const togglePlan = useTogglePlan();

    const [showForm, setShowForm] = useState(false);
    const [editPlan, setEditPlan] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const plans = data?.plans ?? [];

    const handleCreate = (body) => {
        createPlan.mutate(body, {
            onSuccess: (res) => { toast.success(res.message); setShowForm(false); },
            onError: (e) => toast.error(e.response?.data?.error || "Erreur"),
        });
    };

    const handleUpdate = (body) => {
        updatePlan.mutate(body, {
            onSuccess: (res) => { toast.success(res.message); setEditPlan(null); },
            onError: (e) => toast.error(e.response?.data?.error || "Erreur"),
        });
    };

    const handleDelete = () => {
        deletePlan.mutate(confirmDelete._id, {
            onSuccess: (res) => { toast.success(res.message); setConfirmDelete(null); },
            onError: (e) => toast.error(e.response?.data?.error || "Erreur"),
        });
    };

    const handleToggle = (id) => {
        togglePlan.mutate(id, {
            onSuccess: (res) => toast.success(res.message),
            onError: (e) => toast.error(e.response?.data?.error || "Erreur"),
        });
    };

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
            <Toast toasts={toast.toasts} onRemove={toast.remove} />

            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Settings2 className="w-6 h-6 text-slate-700" />
                        <h1 className="text-2xl font-black text-slate-900">Configuration des plans</h1>
                    </div>
                    <p className="text-slate-500 text-sm mt-0.5">Créez et gérez les plans d'abonnement</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={refetch} className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-slate-700" : "text-slate-500"}`} />
                    </button>
                    <button onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-700 shadow-sm">
                        <Plus className="w-4 h-4" /> Nouveau plan
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {plans.map((plan) => (
                        <motion.div key={plan._id} layout
                            className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden ${plan.isActive ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1.5 rounded-xl text-sm font-black border-2 ${COLOR_STYLES[plan.color] || COLOR_STYLES.slate}`}>
                                            {plan.label}
                                        </span>
                                        {plan.isDefault && (
                                            <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                                                Par défaut
                                            </span>
                                        )}
                                        {!plan.isActive && (
                                            <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                                                Inactif
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-slate-900">{plan.price?.toLocaleString()} XOF/mois</span>
                                    </div>
                                </div>

                                {plan.description && (
                                    <p className="text-xs text-slate-500 mb-4">{plan.description}</p>
                                )}

                                {/* Limites */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                                    {[
                                        { label: "Boutiques annexes", val: plan.limits?.boutiques },
                                        { label: "Produits", val: plan.limits?.produits },
                                        { label: "Employés", val: plan.limits?.employes },
                                        { label: "Historique", val: plan.limits?.historiqueJours, suffix: "j" },
                                    ].map((item) => (
                                        <div key={item.label} className="bg-slate-50 rounded-xl p-2.5 text-center">
                                            <p className="text-xs text-slate-500 mb-0.5">{item.label}</p>
                                            <p className="font-black text-slate-800 text-sm">
                                                {item.val === -1
                                                    ? <Infinity className="w-4 h-4 inline text-purple-500" />
                                                    : `${item.val}${item.suffix || ""}`
                                                }
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Features */}
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {Object.entries(plan.features || {}).map(([k, v]) => (
                                        <span key={k}
                                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${v ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400 line-through"}`}>
                                            {k.replace(/([A-Z])/g, " $1").toLowerCase()}
                                        </span>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                                    <button onClick={() => handleToggle(plan._id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${plan.isActive ? "text-slate-600 hover:bg-slate-100" : "text-emerald-600 hover:bg-emerald-50"}`}>
                                        {plan.isActive ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                                        {plan.isActive ? "Désactiver" : "Activer"}
                                    </button>
                                    <button onClick={() => setEditPlan(plan)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors">
                                        <Edit3 className="w-4 h-4" /> Modifier
                                    </button>
                                    <button onClick={() => setConfirmDelete(plan)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-colors ml-auto">
                                        <Trash2 className="w-4 h-4" /> Supprimer
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {plans.length === 0 && (
                        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                            <Settings2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                            <p className="text-slate-400 font-medium mb-2">Aucun plan configuré</p>
                            <p className="text-xs text-slate-400 mb-4">Créez vos plans ou lancez le seed</p>
                            <button onClick={() => setShowForm(true)}
                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">
                                Créer le premier plan
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {showForm && (
                    <PlanForm onClose={() => setShowForm(false)} onSave={handleCreate} isPending={createPlan.isPending} />
                )}
                {editPlan && (
                    <PlanForm initial={editPlan} onClose={() => setEditPlan(null)} onSave={handleUpdate} isPending={updatePlan.isPending} />
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                title="Supprimer ce plan ?"
                message={`Le plan "${confirmDelete?.label}" sera définitivement supprimé. Cette action est irréversible si aucun tenant ne l'utilise.`}
                confirmLabel="Supprimer"
                onConfirm={handleDelete}
                isPending={deletePlan.isPending}
            />
        </div>
    );
};

export default AdminConfigPage;