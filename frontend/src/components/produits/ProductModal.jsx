import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ChevronDown, RefreshCw } from "lucide-react";
import { useAddProduitMultiBoutiques, useUpdateProduit } from "../../hooks/useProducts";
import { useBoutiques } from "../../hooks/useBoutiques";

const CATEGORIES = [
  "Produits chimiques", "Plastique yaourt et jus", "Plastic Pch.",
  "Essences, huile et parfum", "Plastic BC", "Plastic BE",
  "Plastic KT", "Plastic épice", "Take away", "Unité", "Autre",
];

const UNITS = [
  { label: "Liquides", options: ["L", "cL", "mL", "kL"] },
  { label: "Poids", options: ["kg", "g", "mg", "t"] },
  { label: "Comptables", options: ["pièce", "sachet", "bouteille", "carton", "paquet", "boîte"] },
];

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition-all text-slate-800 placeholder-slate-400";

const ProductModal = ({ isOpen, onClose, product }) => {
  const addMulti = useAddProduitMultiBoutiques();
  const update = useUpdateProduit();
  const isLoading = addMulti.isPending || update.isPending;

  const [form, setForm] = useState({ name: "", description: "", category: "", customCategory: "", unit: "", basePrice: 0 });
  const [selectedBoutiques, setSelectedBoutiques] = useState([]);

  const { data: boutiques = [], isLoading: loadingBoutiques } = useBoutiques();

  useEffect(() => {
    if (!isOpen) return;
    if (product) {
      setForm({
        name: product.name || "",
        description: product.description || "",
        category: product.category || "",
        customCategory: "",
        unit: product.unit || "",
        basePrice: product.basePrice || 0,
      });
      setSelectedBoutiques([{
        boutique_id: product.boutique_id?._id || product.boutique_id,
        stock: product.stock || 0,
      }]);
    } else {
      setForm({ name: "", description: "", category: "", customCategory: "", unit: "", basePrice: 0 });
      setSelectedBoutiques([]);
    }
  }, [product, isOpen]);

  const handleChange = (e) => {
    const value = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm(f => ({ ...f, [e.target.name]: value }));
  };

  const toggleBoutique = (id) => {
    setSelectedBoutiques(prev => {
      const exists = prev.find(b => b.boutique_id === id);
      return exists ? prev.filter(b => b.boutique_id !== id) : [...prev, { boutique_id: id, stock: 0 }];
    });
  };

  const updateStock = (id, val) => {
    setSelectedBoutiques(prev => prev.map(b => b.boutique_id === id ? { ...b, stock: Number(val) } : b));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalCategory = form.category === "Autre" && form.customCategory ? form.customCategory : form.category;
    const produitData = {
      name: form.name, description: form.description, category: finalCategory,
      unit: form.unit, basePrice: form.basePrice,
    };

    if (product?._id) {
      await update.mutateAsync({
        id: product._id,
        updates: {
          ...produitData,
          boutique_id: selectedBoutiques[0]?.boutique_id,
          stock: selectedBoutiques[0]?.stock,
        },
      });
    } else {
      await addMulti.mutateAsync({ ...produitData, boutiques: selectedBoutiques });
    }
    onClose();
  };

  const totalStock = selectedBoutiques.reduce((s, b) => s + b.stock, 0);
  const valeurTotal = selectedBoutiques.reduce((s, b) => s + b.stock * form.basePrice, 0);
  const canSubmit = form.name && form.unit && form.basePrice > 0 && selectedBoutiques.length > 0 && !isLoading;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="relative bg-white w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[94vh] flex flex-col overflow-hidden">

            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>

            <div className="flex items-center justify-between px-6 pt-4 pb-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="text-xl font-black text-slate-900">{product ? "Modifier le produit" : "Nouveau produit"}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{product ? "Mettez à jour les informations" : "Remplissez les informations ci-dessous"}</p>
              </div>
              <button onClick={onClose} disabled={isLoading} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-6">

                <section className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Informations générales</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Nom du produit" required>
                      <input name="name" value={form.name} onChange={handleChange} placeholder="Ex: Javel 5L" className={inputCls} required />
                    </Field>
                    <Field label="Catégorie" required>
                      <div className="relative">
                        <select name="category" value={form.category} onChange={handleChange} className={inputCls + " appearance-none pr-8"} required>
                          <option value="">Sélectionner</option>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                      {form.category === "Autre" && (
                        <input name="customCategory" value={form.customCategory} onChange={handleChange} placeholder="Nouvelle catégorie..." className={inputCls + " mt-2"} />
                      )}
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Description">
                        <textarea name="description" value={form.description} onChange={handleChange} rows={2} className={inputCls + " resize-none"} placeholder="Description optionnelle..." />
                      </Field>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Unité & Tarification</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Unité de mesure" required>
                      <div className="relative">
                        <select name="unit" value={form.unit} onChange={handleChange} className={inputCls + " appearance-none pr-8"} required>
                          <option value="">Sélectionner</option>
                          {UNITS.map(g => (
                            <optgroup key={g.label} label={g.label}>
                              {g.options.map(u => <option key={u} value={u}>{u}</option>)}
                            </optgroup>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </Field>
                    <Field label="Prix unitaire (FCFA)" required>
                      <input type="number" name="basePrice" value={form.basePrice} onChange={handleChange} min="0" step="1" placeholder="Ex: 2500" className={inputCls} required />
                      {form.unit && <p className="text-xs text-slate-400 mt-1 pl-1">Prix par {form.unit}</p>}
                    </Field>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Boutiques & Stocks</h3>
                  {!product && (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-xs text-blue-700">
                      Sélectionnez les boutiques et indiquez le stock initial pour chacune.
                    </div>
                  )}
                  {loadingBoutiques ? (
                    <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
                      <RefreshCw className="w-4 h-4 animate-spin" />Chargement...
                    </div>
                  ) : boutiques.length === 0 ? (
                    <p className="text-sm text-red-500 py-2">Aucune boutique disponible.</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {boutiques.map(boutique => {
                        const sel = selectedBoutiques.find(b => b.boutique_id === boutique._id);
                        return (
                          <div key={boutique._id}
                            className={`rounded-2xl border transition-all ${sel ? "bg-slate-900 border-slate-900" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                            <div className="flex items-center gap-3 p-3">
                              <button type="button" onClick={() => toggleBoutique(boutique._id)}
                                className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center ${sel ? "bg-white border-white" : "border-slate-300 hover:border-slate-500"}`}>
                                {sel && <Check className="w-3 h-3 text-slate-900" />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className={`font-semibold text-sm truncate ${sel ? "text-white" : "text-slate-800"}`}>{boutique.name}</p>
                                {boutique.address && <p className={`text-xs truncate ${sel ? "text-slate-300" : "text-slate-400"}`}>{boutique.address}</p>}
                              </div>
                              {sel && (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <input type="number" value={sel.stock}
                                    onChange={e => updateStock(boutique._id, e.target.value)}
                                    min="0" step="0.01"
                                    className="w-20 px-2 py-1 text-sm rounded-lg bg-white/20 border border-white/30 text-white text-center font-bold focus:outline-none"
                                    onClick={e => e.stopPropagation()} />
                                  <span className="text-white/70 text-xs">{form.unit || "u."}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {selectedBoutiques.length > 0 && form.basePrice > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[
                        { label: "Boutiques", value: selectedBoutiques.length },
                        { label: "Stock total", value: `${totalStock} ${form.unit || "u."}` },
                        { label: "Valeur totale", value: `${valeurTotal.toLocaleString()} F` },
                      ].map(s => (
                        <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{s.label}</p>
                          <p className="text-sm font-black text-slate-800 mt-0.5">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-3">
                <button type="button" onClick={onClose} disabled={isLoading}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 disabled:opacity-50">
                  Annuler
                </button>
                <button type="submit" disabled={!canSubmit}
                  className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isLoading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" />Sauvegarde...</>
                  ) : product ? "Mettre à jour" : `Créer dans ${selectedBoutiques.length} boutique(s)`}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProductModal;