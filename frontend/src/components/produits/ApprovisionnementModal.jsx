import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, ArrowRight, Store, RefreshCw, ChevronDown } from "lucide-react";
import { useApprovisionner, useTransfertStock } from "../../hooks/useProducts";
import { getAllBoutiques } from "../../services/boutique";
import { useQuery } from "@tanstack/react-query";

const UNITS = [
  { label: "Liquides", options: ["L", "cL", "mL", "kL"] },
  { label: "Poids", options: ["kg", "g", "mg", "t"] },
  { label: "Comptables", options: ["pièce", "sachet", "bouteille", "carton", "paquet", "boîte"] },
];

const inputCls = "w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition-all text-slate-800";

function Field({ label, required, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 pl-1">{hint}</p>}
    </div>
  );
}

const ApprovisionnementModal = ({ isOpen, onClose, product }) => {
  const appro = useApprovisionner();
  const transfert = useTransfertStock();

  const isLoading = appro.isPending || transfert.isPending;

  const [mode, setMode] = useState("direct");
  const [form, setForm] = useState({ quantity: "", unit: "", boutiqueSrcId: "" });

  const boutiqueDestId = product?.boutique_id?._id || product?.boutique_id;

  const { data: boutiques = [], isLoading: loadingBoutiques } = useQuery({
    queryKey: ["boutiques"],
    queryFn: async () => {
      const res = await getAllBoutiques();
      if (res.error) throw new Error(res.error);
      return Array.isArray(res) ? res : res.boutiques ?? [];
    },
    enabled: isOpen && mode === "transfert",
    staleTime: 60_000,
  });

  useEffect(() => {
    if (product && isOpen) {
      setForm({ quantity: "", unit: product.unit || "", boutiqueSrcId: "" });
      setMode("direct");
    }
  }, [product, isOpen]);

  const handleChange = (e) => {
    const value = e.target.type === "number" ? e.target.value : e.target.value;
    setForm(f => ({ ...f, [e.target.name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qty = Number(form.quantity);

    if (mode === "direct") {
      await appro.mutateAsync({ productId: product._id, data: { quantity: qty, unit: form.unit } });
    } else {
      await transfert.mutateAsync({
        produitId: product._id,
        boutiqueSrcId: form.boutiqueSrcId,
        boutiqueDestId,
        quantity: qty,
        unit: form.unit,
      });
    }
    onClose();
  };

  if (!product) return null;

  const qty = Number(form.quantity) || 0;
  const stockActuel = product.stock || 0;
  const nouveauStock = stockActuel + qty;
  const valeurAjoutee = (product.basePrice || 0) * qty;
  const nouvelleValeur = (product.basePrice || 0) * nouveauStock;

  const autresBoutiques = boutiques.filter(b => b._id !== boutiqueDestId);
  const canSubmit = qty > 0 && form.unit && !isLoading && (mode === "direct" || form.boutiqueSrcId);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="relative bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[94vh] flex flex-col overflow-hidden"
          >
            {/* Drag handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-4 pb-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="text-xl font-black text-slate-900">Approvisionner</h2>
                <p className="text-sm text-slate-500 mt-0.5 font-medium">{product.name}</p>
              </div>
              <button onClick={onClose} disabled={isLoading}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-5">

                {/* Mode selector */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "direct", icon: Package, label: "Approvisionnement", sub: "Ajouter du stock" },
                    { key: "transfert", icon: ArrowRight, label: "Transfert", sub: "Depuis une boutique" },
                  ].map(({ key, icon: Icon, label, sub }) => (
                    <button key={key} type="button" onClick={() => setMode(key)}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all ${mode === key ? "border-slate-900 bg-slate-900" : "border-slate-200 hover:border-slate-300 bg-white"}`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${mode === key ? "text-white" : "text-slate-500"}`} />
                      <p className={`text-sm font-bold ${mode === key ? "text-white" : "text-slate-800"}`}>{label}</p>
                      <p className={`text-xs mt-0.5 ${mode === key ? "text-slate-300" : "text-slate-400"}`}>{sub}</p>
                    </button>
                  ))}
                </div>

                {/* Produit info */}
                <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">Boutique dest.</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Store className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-sm font-semibold text-slate-800">
                        {product.boutique_id?.name || "—"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">Stock actuel</p>
                    <p className="text-sm font-black text-slate-800 mt-1">
                      {stockActuel} <span className="font-medium text-slate-500">{product.unit}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">Prix unit.</p>
                    <p className="text-sm font-black text-emerald-700 mt-1">
                      {(product.basePrice || 0).toLocaleString("fr-FR")} FCFA
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">Valeur stock</p>
                    <p className="text-sm font-black text-purple-700 mt-1">
                      {((product.basePrice || 0) * stockActuel).toLocaleString("fr-FR")} F
                    </p>
                  </div>
                </div>

                {/* Boutique source (transfert) */}
                {mode === "transfert" && (
                  <Field label="Boutique source" required>
                    {loadingBoutiques ? (
                      <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                        <RefreshCw className="w-4 h-4 animate-spin" /> Chargement...
                      </div>
                    ) : (
                      <div className="relative">
                        <select name="boutiqueSrcId" value={form.boutiqueSrcId} onChange={handleChange}
                          className={inputCls + " appearance-none pr-8"} required>
                          <option value="">Sélectionner la boutique source</option>
                          {autresBoutiques.map(b => (
                            <option key={b._id} value={b._id}>{b.name}{b.address ? ` — ${b.address}` : ""}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        {autresBoutiques.length === 0 && (
                          <p className="text-xs text-amber-600 mt-1 pl-1">Aucune autre boutique disponible</p>
                        )}
                      </div>
                    )}
                  </Field>
                )}

                {/* Quantité + Unité */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Quantité" required>
                    <input type="number" name="quantity" value={form.quantity} onChange={handleChange}
                      min="0.01" step="0.01" placeholder="Ex: 100"
                      className={inputCls} required disabled={isLoading} />
                  </Field>

                  <Field label="Unité"
                    hint={form.unit !== product.unit ? `Sera converti en ${product.unit}` : "Unité de base"}>
                    <div className="relative">
                      <select name="unit" value={form.unit} onChange={handleChange}
                        className={inputCls + " appearance-none pr-8"} disabled={isLoading}>
                        <option value={product.unit}>{product.unit} (base)</option>
                        {UNITS.map(g => (
                          <optgroup key={g.label} label={g.label}>
                            {g.options.filter(u => u !== product.unit).map(u => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </Field>
                </div>

                {/* Aperçu */}
                {qty > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4"
                  >
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-3">
                      Aperçu après opération
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-emerald-600 font-bold">Nouveau stock</p>
                        <p className="text-2xl font-black text-emerald-800 mt-0.5">
                          {nouveauStock}
                          <span className="text-sm font-medium text-emerald-600 ml-1">{product.unit}</span>
                        </p>
                        <p className="text-xs text-emerald-600 mt-0.5">+{qty} {form.unit}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-emerald-600 font-bold">Nouvelle valeur</p>
                        <p className="text-2xl font-black text-emerald-800 mt-0.5">
                          {nouvelleValeur.toLocaleString("fr-FR")}
                          <span className="text-xs font-medium text-emerald-600 ml-1">F</span>
                        </p>
                        <p className="text-xs text-emerald-600 mt-0.5">+{valeurAjoutee.toLocaleString("fr-FR")} F</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-3">
                <button type="button" onClick={onClose} disabled={isLoading}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50">
                  Annuler
                </button>
                <button type="submit" disabled={!canSubmit}
                  className={`flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${mode === "direct" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                  {isLoading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Traitement...</>
                  ) : mode === "direct" ? (
                    <><Package className="w-4 h-4" /> Valider l'approvisionnement</>
                  ) : (
                    <><ArrowRight className="w-4 h-4" /> Valider le transfert</>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ApprovisionnementModal;