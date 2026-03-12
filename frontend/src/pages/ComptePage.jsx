import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Store, Users, CreditCard, Plus, Trash2,
    ToggleLeft, ToggleRight, RefreshCw, Check, X,
} from "lucide-react";
import { useAccount, useCreateBoutiqueAnnexe, useDeleteBoutiqueAnnexe, useInviterEmploye, useToggleEmploye, useChangerPlan } from "../hooks/useAccount";

const PLANS = [
    { id: "starter", label: "Starter", price: "2 000 XOF/mois", boutiques: 1, produits: 100, employes: 2, features: ["1 boutique", "100 produits", "2 employés", "Historique 30j"] },
    { id: "business", label: "Business", price: "8 000 XOF/mois", boutiques: 3, produits: 1000, employes: 10, features: ["3 boutiques", "1 000 produits", "10 employés", "Stats avancées", "Export", "Transfert stock"] },
    { id: "enterprise", label: "Enterprise", price: "20 000 XOF/mois", boutiques: "∞", produits: "∞", employes: "∞", features: ["Boutiques illimitées", "Produits illimités", "Employés illimités", "Support dédié"] },
];

const inputCls = "w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20 text-slate-800 placeholder-slate-400";

function Section({ title, icon: Icon, children }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
                <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Icon className="w-4 h-4 text-slate-600" />
                </div>
                <h2 className="font-black text-slate-900">{title}</h2>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

const ComptePage = () => {
    const { data: account, isLoading } = useAccount();
    const createBoutique = useCreateBoutiqueAnnexe();
    const deleteBoutique = useDeleteBoutiqueAnnexe();
    const inviterEmploye = useInviterEmploye();
    const toggleEmploye = useToggleEmploye();
    const changerPlan = useChangerPlan();

    const [newBoutique, setNewBoutique] = useState({ name: "", address: "", phone: "" });
    const [showBoutiqueForm, setShowBoutiqueForm] = useState(false);
    const [newEmploye, setNewEmploye] = useState({ email: "", name: "", password: "", role: "employe", boutique_id: "" });
    const [showEmployeForm, setShowEmployeForm] = useState(false);

    if (isLoading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
        </div>
    );

    const { tenant, boutiques = [], employes = [], limits, subscription } = account || {};
    const currentPlan = tenant?.plan || "starter";

    return (
        <div className="min-h-screen bg-[#f5f6fa] p-3 sm:p-6">
            <div className="max-w-4xl mx-auto space-y-5">

                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Mon compte</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Gérez votre boutique, vos employés et votre abonnement</p>
                </div>

                {/* Boutiques */}
                <Section title="Boutiques" icon={Store}>
                    <div className="space-y-3 mb-4">
                        {boutiques.map((b) => (
                            <div key={b._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-slate-800 text-sm">{b.name}</p>
                                        {b.isMain && <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-bold">Principale</span>}
                                    </div>
                                    {b.address && <p className="text-xs text-slate-400 mt-0.5">{b.address}</p>}
                                </div>
                                {!b.isMain && (
                                    <button onClick={() => deleteBoutique.mutate(b._id)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {boutiques.length < (limits?.boutiques === -1 ? Infinity : limits?.boutiques || 1) && (
                        <>
                            {!showBoutiqueForm ? (
                                <button onClick={() => setShowBoutiqueForm(true)}
                                    className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors">
                                    <Plus className="w-4 h-4" />Ajouter une boutique annexe
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
                                        <button onClick={() => { createBoutique.mutate(newBoutique, { onSuccess: () => { setShowBoutiqueForm(false); setNewBoutique({ name: "", address: "", phone: "" }); } }); }}
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
                            )}
                        </>
                    )}

                    {limits?.boutiques !== -1 && boutiques.length >= limits?.boutiques && (
                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-2">
                            Limite de boutiques atteinte ({limits.boutiques}). Passez au plan supérieur.
                        </p>
                    )}
                </Section>

                {/* Employés */}
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
                                <button onClick={() => toggleEmploye.mutate(e._id)}
                                    className={`p-1.5 rounded-lg transition-colors ${e.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100"}`}>
                                    {e.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                </button>
                            </div>
                        ))}
                        {employes.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Aucun employé</p>}
                    </div>

                    {!showEmployeForm ? (
                        <button onClick={() => setShowEmployeForm(true)}
                            className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors">
                            <Plus className="w-4 h-4" />Inviter un employé
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
                                <button onClick={() => inviterEmploye.mutate(newEmploye, { onSuccess: () => { setShowEmployeForm(false); setNewEmploye({ email: "", name: "", password: "", role: "employe", boutique_id: "" }); } })}
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

                {/* Abonnement */}
                <Section title="Abonnement" icon={CreditCard}>
                    {subscription && (
                        <div className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Abonnement actif</p>
                            <p className="font-black text-slate-900">{subscription.plan} — {subscription.amount?.toLocaleString()} XOF</p>
                            <p className="text-xs text-slate-400 mt-1">
                                Expire le {new Date(subscription.expiresAt).toLocaleDateString("fr-FR")}
                            </p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {PLANS.map((plan) => (
                            <div key={plan.id}
                                className={`rounded-2xl border-2 p-4 transition-all ${currentPlan === plan.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                                <p className={`font-black text-lg ${currentPlan === plan.id ? "text-white" : "text-slate-900"}`}>{plan.label}</p>
                                <p className={`text-sm font-bold mt-0.5 mb-3 ${currentPlan === plan.id ? "text-slate-300" : "text-indigo-600"}`}>{plan.price}</p>
                                <ul className="space-y-1 mb-4">
                                    {plan.features.map((f) => (
                                        <li key={f} className={`text-xs flex items-center gap-1.5 ${currentPlan === plan.id ? "text-slate-300" : "text-slate-600"}`}>
                                            <Check className="w-3 h-3 flex-shrink-0" />{f}
                                        </li>
                                    ))}
                                </ul>
                                {currentPlan !== plan.id && (
                                    <button onClick={() => changerPlan.mutate({ plan: plan.id })}
                                        disabled={changerPlan.isPending}
                                        className="w-full py-2 bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
                                        {changerPlan.isPending ? "..." : "Choisir ce plan"}
                                    </button>
                                )}
                                {currentPlan === plan.id && (
                                    <div className="w-full py-2 text-center text-xs font-bold text-slate-400">Plan actuel</div>
                                )}
                            </div>
                        ))}
                    </div>
                </Section>

            </div>
        </div>
    );
};

export default ComptePage;