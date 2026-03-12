import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Store, Users, CreditCard, Plus, Trash2,
    ToggleLeft, ToggleRight, RefreshCw, Check, X,
    Clock, CheckCircle, XCircle, Send, AlertCircle,
} from "lucide-react";
import {
    useAccount,
    useCreateBoutiqueAnnexe,
    useDeleteBoutiqueAnnexe,
    useInviterEmploye,
    useToggleEmploye,
} from "../hooks/useAccount";
import {
    useAvailablePlans,
    useRequestPlanUpgrade,
    useMyPlanRequests,
} from "../hooks/useAccount";
import { useToast, Toast } from "../components/ui/Toast";
import { ConfirmModal } from "../components/ui/ConfirmModal";

const inputCls = "w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20 text-slate-800 placeholder-slate-400";

const PLAN_COLORS = {
    slate: "from-slate-700 to-slate-900",
    blue: "from-blue-500 to-indigo-600",
    purple: "from-purple-500 to-violet-700",
    emerald: "from-emerald-500 to-teal-600",
    amber: "from-amber-400 to-orange-500",
};

const REQUEST_STATUS = {
    pending: { label: "En attente", icon: Clock, cls: "bg-amber-100 text-amber-700" },
    approved: { label: "Approuvée", icon: CheckCircle, cls: "bg-emerald-100 text-emerald-700" },
    rejected: { label: "Refusée", icon: XCircle, cls: "bg-red-100 text-red-600" },
};

function Section({ title, icon: Icon, children, badge }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
                <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Icon className="w-4 h-4 text-slate-600" />
                </div>
                <h2 className="font-black text-slate-900 flex-1">{title}</h2>
                {badge}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

// ─── Modal de demande d'upgrade ───────────────────────────────────────────────
const PlanRequestModal = ({ plan, currentPlan, onClose, onConfirm, isPending }) => {
    const [message, setMessage] = useState("");
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full z-10"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-slate-900">Demander le plan {plan?.label}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4">
                    <p className="text-xs text-slate-500 mb-1">Passage de</p>
                    <p className="text-sm font-bold text-slate-700">
                        <span className="capitalize">{currentPlan}</span>
                        <span className="text-slate-400 mx-2">→</span>
                        <span className="text-indigo-600">{plan?.label}</span>
                    </p>
                    <p className="text-sm font-black text-slate-900 mt-1">
                        {plan?.price?.toLocaleString()} {plan?.currency || "XOF"} / mois
                    </p>
                </div>

                <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                        Message pour l'admin (optionnel)
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ex: Je souhaite passer au plan Business pour ajouter une deuxième boutique..."
                        rows={3}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20 text-slate-800 placeholder-slate-400 resize-none"
                    />
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-5">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700">
                            Votre demande sera envoyée à l'administrateur qui vous contactera pour finaliser le paiement et activer votre nouveau plan.
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
                        Annuler
                    </button>
                    <button
                        onClick={() => onConfirm({ requestedPlan: plan.name, message })}
                        disabled={isPending}
                        className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Envoyer
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Page principale ──────────────────────────────────────────────────────────
const ComptePage = () => {
    const toast = useToast();

    const { data: account, isLoading } = useAccount();
    const { data: plansData } = useAvailablePlans();
    const { data: requestsData } = useMyPlanRequests();
    const createBoutique = useCreateBoutiqueAnnexe();
    const deleteBoutique = useDeleteBoutiqueAnnexe();
    const inviterEmploye = useInviterEmploye();
    const toggleEmploye = useToggleEmploye();
    const requestUpgrade = useRequestPlanUpgrade();

    const [newBoutique, setNewBoutique] = useState({ name: "", address: "", phone: "" });
    const [showBoutiqueForm, setShowBoutiqueForm] = useState(false);
    const [newEmploye, setNewEmploye] = useState({ email: "", name: "", password: "", role: "employe", boutique_id: "" });
    const [showEmployeForm, setShowEmployeForm] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [confirmDeleteBoutique, setConfirmDeleteBoutique] = useState(null);

    if (isLoading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
        </div>
    );

    const { tenant, boutiques = [], employes = [], limits, subscription } = account || {};
    const currentPlan = tenant?.plan || "starter";
    const plans = plansData?.plans ?? [];
    const requests = requestsData?.requests ?? [];
    const pendingRequest = requests.find((r) => r.status === "pending");

    const handleRequestUpgrade = ({ requestedPlan, message }) => {
        requestUpgrade.mutate({ requestedPlan, message }, {
            onSuccess: (res) => {
                toast.success(res.message, "Demande envoyée");
                setSelectedPlan(null);
            },
            onError: (e) => toast.error(e.response?.data?.error || "Erreur"),
        });
    };

    const handleCreateBoutique = () => {
        createBoutique.mutate(newBoutique, {
            onSuccess: () => {
                toast.success("Boutique créée avec succès");
                setShowBoutiqueForm(false);
                setNewBoutique({ name: "", address: "", phone: "" });
            },
            onError: (e) => toast.error(e.response?.data?.error || "Erreur"),
        });
    };

    const handleDeleteBoutique = () => {
        deleteBoutique.mutate(confirmDeleteBoutique._id, {
            onSuccess: () => {
                toast.success("Boutique supprimée");
                setConfirmDeleteBoutique(null);
            },
            onError: (e) => toast.error(e.response?.data?.error || "Erreur"),
        });
    };

    const handleInviterEmploye = () => {
        inviterEmploye.mutate(newEmploye, {
            onSuccess: () => {
                toast.success("Employé invité avec succès");
                setShowEmployeForm(false);
                setNewEmploye({ email: "", name: "", password: "", role: "employe", boutique_id: "" });
            },
            onError: (e) => toast.error(e.response?.data?.error || "Erreur"),
        });
    };

    const handleToggleEmploye = (id) => {
        toggleEmploye.mutate(id, {
            onError: (e) => toast.error(e.response?.data?.error || "Erreur"),
        });
    };

    // Nb boutiques annexes (hors principale)
    const annexCount = boutiques.filter((b) => !b.isMain).length;
    const boutiqueMax = limits?.boutiques ?? 0;
    const canAddBoutique = boutiqueMax === -1 || annexCount < boutiqueMax;

    return (
        <div className="min-h-screen bg-[#f5f6fa] p-3 sm:p-6">
            <Toast toasts={toast.toasts} onRemove={toast.remove} />

            <div className="max-w-4xl mx-auto space-y-5">

                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Mon compte</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Gérez votre boutique, vos employés et votre abonnement</p>
                </div>

                {/* ── Boutiques ── */}
                <Section title="Boutiques" icon={Store}>
                    <div className="space-y-3 mb-4">
                        {boutiques.map((b) => (
                            <div key={b._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-slate-800 text-sm">{b.name}</p>
                                        {b.isMain && (
                                            <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-bold">
                                                Principale
                                            </span>
                                        )}
                                    </div>
                                    {b.address && <p className="text-xs text-slate-400 mt-0.5">{b.address}</p>}
                                </div>
                                {!b.isMain && (
                                    <button
                                        onClick={() => setConfirmDeleteBoutique(b)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {canAddBoutique ? (
                        !showBoutiqueForm ? (
                            <button
                                onClick={() => setShowBoutiqueForm(true)}
                                className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Ajouter une boutique annexe
                            </button>
                        ) : (
                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                                className="border border-slate-200 rounded-xl p-4 space-y-3">
                                <input placeholder="Nom de la boutique *" value={newBoutique.name}
                                    onChange={(e) => setNewBoutique(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                                <input placeholder="Adresse" value={newBoutique.address}
                                    onChange={(e) => setNewBoutique(f => ({ ...f, address: e.target.value }))} className={inputCls} />
                                <input placeholder="Téléphone" value={newBoutique.phone}
                                    onChange={(e) => setNewBoutique(f => ({ ...f, phone: e.target.value }))} className={inputCls} />
                                <div className="flex gap-2">
                                    <button onClick={handleCreateBoutique}
                                        disabled={!newBoutique.name || createBoutique.isPending}
                                        className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                                        {createBoutique.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        Créer
                                    </button>
                                    <button onClick={() => setShowBoutiqueForm(false)}
                                        className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )
                    ) : (
                        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mt-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            Limite atteinte ({boutiqueMax} boutique{boutiqueMax > 1 ? "s" : ""} annexe{boutiqueMax > 1 ? "s" : ""}).
                            Passez à un plan supérieur pour en ajouter.
                        </div>
                    )}
                </Section>

                {/* ── Employés ── */}
                <Section title="Employés" icon={Users}>
                    <div className="space-y-3 mb-4">
                        {employes.map((e) => (
                            <div key={e._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                                        {(e.name || e.email)[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800 text-sm">{e.name || e.email}</p>
                                        <p className="text-xs text-slate-400">{e.role} • {e.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleToggleEmploye(e._id)}
                                    className={`p-1.5 rounded-lg transition-colors ${e.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100"}`}
                                >
                                    {e.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                </button>
                            </div>
                        ))}
                        {employes.length === 0 && (
                            <p className="text-sm text-slate-400 text-center py-4">Aucun employé</p>
                        )}
                    </div>

                    {!showEmployeForm ? (
                        <button onClick={() => setShowEmployeForm(true)}
                            className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors">
                            <Plus className="w-4 h-4" /> Inviter un employé
                        </button>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                            className="border border-slate-200 rounded-xl p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <input placeholder="Nom" value={newEmploye.name}
                                    onChange={(e) => setNewEmploye(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                                <input placeholder="Email *" type="email" value={newEmploye.email}
                                    onChange={(e) => setNewEmploye(f => ({ ...f, email: e.target.value }))} className={inputCls} />
                                <input placeholder="Mot de passe *" type="password" value={newEmploye.password}
                                    onChange={(e) => setNewEmploye(f => ({ ...f, password: e.target.value }))} className={inputCls} />
                                <select value={newEmploye.role}
                                    onChange={(e) => setNewEmploye(f => ({ ...f, role: e.target.value }))}
                                    className={inputCls}>
                                    <option value="employe">Employé</option>
                                    <option value="manager">Manager</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleInviterEmploye}
                                    disabled={!newEmploye.email || !newEmploye.password || inviterEmploye.isPending}
                                    className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                                    {inviterEmploye.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    Inviter
                                </button>
                                <button onClick={() => setShowEmployeForm(false)}
                                    className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </Section>

                {/* ── Abonnement ── */}
                <Section
                    title="Abonnement"
                    icon={CreditCard}
                    badge={
                        pendingRequest && (
                            <span className="flex items-center gap-1.5 text-[11px] font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                                <Clock className="w-3 h-3" /> Demande en attente
                            </span>
                        )
                    }
                >
                    {/* Abonnement actif */}
                    {subscription && (
                        <div className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Abonnement actif</p>
                            <p className="font-black text-slate-900 capitalize">
                                {subscription.plan} — {subscription.amount?.toLocaleString()} XOF
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                Expire le {new Date(subscription.expiresAt).toLocaleDateString("fr-FR")}
                            </p>
                        </div>
                    )}

                    {/* Demande en attente */}
                    {pendingRequest && (
                        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-amber-800">
                                    Demande de passage au plan <span className="capitalize">{pendingRequest.requestedPlan}</span> en attente
                                </p>
                                <p className="text-xs text-amber-600 mt-0.5">
                                    L'administrateur va traiter votre demande et vous contacter pour le paiement.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Historique des demandes */}
                    {requests.filter(r => r.status !== "pending").length > 0 && (
                        <div className="mb-5">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Historique des demandes</p>
                            <div className="space-y-2">
                                {requests.filter(r => r.status !== "pending").slice(0, 3).map((r) => {
                                    const { label, icon: Icon, cls } = REQUEST_STATUS[r.status] || REQUEST_STATUS.pending;
                                    return (
                                        <div key={r._id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                                            <p className="text-xs text-slate-600">
                                                <span className="capitalize">{r.currentPlan}</span>
                                                <span className="text-slate-400 mx-1.5">→</span>
                                                <span className="font-semibold capitalize">{r.requestedPlan}</span>
                                            </p>
                                            <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${cls}`}>
                                                <Icon className="w-3 h-3" />{label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Grille des plans (depuis la DB) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {plans.map((plan) => {
                            const isCurrent = currentPlan === plan.name;
                            const gradientCls = PLAN_COLORS[plan.color] || PLAN_COLORS.slate;
                            const features = Object.entries(plan.features || {})
                                .filter(([, v]) => v === true)
                                .map(([k]) => k.replace(/([A-Z])/g, " $1").toLowerCase());

                            return (
                                <div
                                    key={plan.name}
                                    className={`rounded-2xl border-2 p-4 transition-all ${
                                        isCurrent
                                            ? "border-slate-900 bg-slate-900 text-white"
                                            : "border-slate-200 bg-white hover:border-slate-300"
                                    }`}
                                >
                                    <p className={`font-black text-lg ${isCurrent ? "text-white" : "text-slate-900"}`}>
                                        {plan.label}
                                    </p>
                                    <p className={`text-sm font-bold mt-0.5 mb-3 ${isCurrent ? "text-slate-300" : "text-indigo-600"}`}>
                                        {plan.price?.toLocaleString()} XOF / mois
                                    </p>

                                    <ul className="space-y-1 mb-4">
                                        <li className={`text-xs flex items-center gap-1.5 ${isCurrent ? "text-slate-300" : "text-slate-600"}`}>
                                            <Check className="w-3 h-3 flex-shrink-0" />
                                            {plan.limits?.boutiques === -1 ? "Boutiques illimitées" : `${plan.limits?.boutiques} boutique(s) annexe`}
                                        </li>
                                        <li className={`text-xs flex items-center gap-1.5 ${isCurrent ? "text-slate-300" : "text-slate-600"}`}>
                                            <Check className="w-3 h-3 flex-shrink-0" />
                                            {plan.limits?.produits === -1 ? "Produits illimités" : `${plan.limits?.produits} produits`}
                                        </li>
                                        <li className={`text-xs flex items-center gap-1.5 ${isCurrent ? "text-slate-300" : "text-slate-600"}`}>
                                            <Check className="w-3 h-3 flex-shrink-0" />
                                            {plan.limits?.employes === -1 ? "Employés illimités" : `${plan.limits?.employes} employé(s)`}
                                        </li>
                                        {features.map((f) => (
                                            <li key={f} className={`text-xs flex items-center gap-1.5 ${isCurrent ? "text-slate-300" : "text-slate-600"}`}>
                                                <Check className="w-3 h-3 flex-shrink-0" />{f}
                                            </li>
                                        ))}
                                    </ul>

                                    {isCurrent ? (
                                        <div className="w-full py-2 text-center text-xs font-bold text-slate-400">
                                            Plan actuel
                                        </div>
                                    ) : pendingRequest ? (
                                        <div className="w-full py-2 text-center text-xs font-bold text-amber-600 bg-amber-50 rounded-xl">
                                            Demande en attente
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedPlan(plan)}
                                            className="w-full py-2 bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
                                        >
                                            Demander ce plan
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {plans.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-8">Chargement des plans...</p>
                    )}
                </Section>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {selectedPlan && (
                    <PlanRequestModal
                        plan={selectedPlan}
                        currentPlan={currentPlan}
                        onClose={() => setSelectedPlan(null)}
                        onConfirm={handleRequestUpgrade}
                        isPending={requestUpgrade.isPending}
                    />
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={!!confirmDeleteBoutique}
                onClose={() => setConfirmDeleteBoutique(null)}
                title="Supprimer cette boutique ?"
                message={`La boutique "${confirmDeleteBoutique?.name}" sera définitivement supprimée.`}
                confirmLabel="Supprimer"
                onConfirm={handleDeleteBoutique}
                isPending={deleteBoutique.isPending}
            />
        </div>
    );
};

export default ComptePage;