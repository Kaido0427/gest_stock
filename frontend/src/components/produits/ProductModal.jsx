import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Store, Check } from "lucide-react";
import { addProduitMultiBoutiques, updateProduit } from "../../services/product";
import { getAllBoutiques } from "../../services/boutique";

const ProductModal = ({ isOpen, onClose, product }) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    customCategory: "",
    unit: "",
    basePrice: 0,
  });

  // ✅ Gestion des boutiques sélectionnées avec leurs stocks
  const [selectedBoutiques, setSelectedBoutiques] = useState([]);
  // Format: [{ boutique_id: "123", stock: 50 }, ...]

  const [boutiques, setBoutiques] = useState([]);
  const [loadingBoutiques, setLoadingBoutiques] = useState(false);

  // ✅ Charger les boutiques au montage
  useEffect(() => {
    const fetchBoutiques = async () => {
      setLoadingBoutiques(true);
      const res = await getAllBoutiques();
      if (res.error) {
        console.error("Erreur chargement boutiques:", res.error);
      } else {
        setBoutiques(res);
      }
      setLoadingBoutiques(false);
    };

    if (isOpen) {
      fetchBoutiques();
    }
  }, [isOpen]);

  // Remplit le formulaire en mode édition
  useEffect(() => {
    if (product) {
      // Mode édition : une seule boutique
      setForm({
        name: product.name || "",
        description: product.description || "",
        category: product.category || "",
        customCategory: "",
        unit: product.unit || "",
        basePrice: product.basePrice || 0,
      });

      // Pré-sélectionner la boutique actuelle
      setSelectedBoutiques([
        {
          boutique_id: product.boutique_id?._id || product.boutique_id,
          stock: product.stock || 0,
        },
      ]);
    } else {
      // Mode création
      setForm({
        name: "",
        description: "",
        category: "",
        customCategory: "",
        unit: "",
        basePrice: 0,
      });
      setSelectedBoutiques([]);
    }
  }, [product]);

  const handleChange = (e) => {
    const value =
      e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  // ✅ Gestion du toggle de boutique
  const toggleBoutique = (boutiqueId) => {
    setSelectedBoutiques((prev) => {
      const exists = prev.find((b) => b.boutique_id === boutiqueId);
      if (exists) {
        // Décocher : retirer la boutique
        return prev.filter((b) => b.boutique_id !== boutiqueId);
      } else {
        // Cocher : ajouter avec stock 0 par défaut
        return [...prev, { boutique_id: boutiqueId, stock: 0 }];
      }
    });
  };

  // ✅ Mise à jour du stock d'une boutique
  const updateBoutiqueStock = (boutiqueId, newStock) => {
    setSelectedBoutiques((prev) =>
      prev.map((b) =>
        b.boutique_id === boutiqueId ? { ...b, stock: Number(newStock) } : b
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name) {
      alert("Le nom du produit est obligatoire");
      return;
    }

    if (selectedBoutiques.length === 0) {
      alert("Veuillez sélectionner au moins une boutique");
      return;
    }

    if (!form.unit) {
      alert("Veuillez sélectionner une unité de mesure");
      return;
    }

    if (form.basePrice <= 0) {
      alert("Le prix unitaire doit être supérieur à 0");
      return;
    }

    // Vérifier que tous les stocks sont >= 0
    const invalidStock = selectedBoutiques.find((b) => b.stock < 0);
    if (invalidStock) {
      alert("Les stocks ne peuvent pas être négatifs");
      return;
    }

    // Gérer la catégorie personnalisée
    const finalCategory =
      form.category === "Autre" && form.customCategory
        ? form.customCategory
        : form.category;

    const produitData = {
      name: form.name,
      description: form.description,
      category: finalCategory,
      unit: form.unit,
      basePrice: form.basePrice,
      boutiques: selectedBoutiques, // ✅ Tableau des boutiques avec leurs stocks
    };

    let res;
    if (product && product._id) {
      // Mode édition : utiliser l'ancienne méthode (1 boutique)
      res = await updateProduit(product._id, {
        ...produitData,
        boutique_id: selectedBoutiques[0].boutique_id,
        stock: selectedBoutiques[0].stock,
      });
    } else {
      // Mode création : nouvelle méthode multi-boutiques
      res = await addProduitMultiBoutiques(produitData);
    }

    if (res.error) {
      alert(res.error);
    } else {
      alert(
        res.message ||
        `Produit créé dans ${selectedBoutiques.length} boutique(s) !`
      );
      onClose();
    }
  };

  if (!isOpen) return null;

  // Catégories d'exemple
  const categories = [
    "Produits chimiques",
    "Plastique yaourt et jus",
    "Plastic Pch.",
    "Essences, huile et parfum",
    "Plastic BC",
    "Plastic BE",
    "Plastic KT",
    "Plastic épice",
    "Take away",
    "Autre",
  ];

  // Unités disponibles
  const units = [
    { label: "Liquides", options: ["L", "cL", "mL", "kL"] },
    { label: "Poids", options: ["kg", "g", "mg", "t"] },
    {
      label: "Comptables",
      options: ["pièce", "sachet", "bouteille", "carton", "paquet", "boîte"],
    },
  ];

  // Calculer la valeur totale du stock (tous les boutiques)
  const valeurTotalStock = selectedBoutiques.reduce(
    (total, b) => total + b.stock * form.basePrice,
    0
  );

  const totalStock = selectedBoutiques.reduce((sum, b) => sum + b.stock, 0);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {product ? "Modifier le produit" : "Nouveau produit"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Section Informations de base */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700 border-b pb-2">
              📋 Informations générales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du produit *
                </label>
                <input
                  name="name"
                  placeholder="Ex: Javel 5L, Flacon spray 500mL"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie *
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {form.category === "Autre" && (
                  <input
                    name="customCategory"
                    placeholder="Entrez une nouvelle catégorie"
                    value={form.customCategory || ""}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded-lg mt-2 focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optionnel)
                </label>
                <textarea
                  name="description"
                  placeholder="Ex: Eau de javel concentrée 12°"
                  value={form.description}
                  onChange={handleChange}
                  rows="2"
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section Unité et Prix */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700 border-b pb-2">
              💰 Unité et tarification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unité de mesure *
                </label>
                <select
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner une unité</option>
                  {units.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix unitaire (FCFA) *
                </label>
                <input
                  type="number"
                  name="basePrice"
                  placeholder="Ex: 2500"
                  value={form.basePrice}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                {form.unit && (
                  <p className="text-xs text-gray-500 mt-1">
                    Prix par {form.unit}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section Boutiques et Stocks */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700 border-b pb-2 flex items-center gap-2">
              <Store className="w-5 h-5" />
              Boutiques et stocks initiaux
            </h3>

            {!product && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  💡 <strong>Mode multi-boutiques :</strong> Cochez les
                  boutiques où ce produit sera disponible et indiquez le stock
                  initial pour chacune.
                </p>
              </div>
            )}

            {loadingBoutiques ? (
              <p className="text-sm text-gray-500">Chargement des boutiques...</p>
            ) : boutiques.length === 0 ? (
              <p className="text-sm text-red-600">
                ⚠️ Aucune boutique disponible. Créez-en une d'abord.
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {boutiques.map((boutique) => {
                  const isSelected = selectedBoutiques.find(
                    (b) => b.boutique_id === boutique._id
                  );

                  return (
                    <div
                      key={boutique._id}
                      className={`p-4 border rounded-lg transition-all ${isSelected
                          ? "bg-blue-50 border-blue-500"
                          : "bg-white border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => toggleBoutique(boutique._id)}
                          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-300 hover:border-blue-400"
                            }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </button>

                        {/* Infos boutique */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {boutique.name}
                              </p>
                              {boutique.address && (
                                <p className="text-sm text-gray-600">
                                  {boutique.address}
                                </p>
                              )}
                            </div>

                            {/* Input stock */}
                            {isSelected && (
                              <div className="ml-4">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Stock initial
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={isSelected.stock}
                                    onChange={(e) =>
                                      updateBoutiqueStock(
                                        boutique._id,
                                        e.target.value
                                      )
                                    }
                                    min="0"
                                    step="0.01"
                                    className="w-24 border px-2 py-1 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                    placeholder="0"
                                  />
                                  <span className="text-sm text-gray-600">
                                    {form.unit || "unité"}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Résumé */}
            {selectedBoutiques.length > 0 && form.basePrice > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Boutiques sélectionnées:
                  </span>
                  <span className="font-medium text-blue-600">
                    {selectedBoutiques.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Stock total:</span>
                  <span className="font-medium text-blue-600">
                    {totalStock} {form.unit}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                  <span className="text-gray-700">Valeur totale:</span>
                  <span className="text-green-700">
                    {valeurTotalStock.toLocaleString()} FCFA
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={
                selectedBoutiques.length === 0 ||
                !form.unit ||
                form.basePrice <= 0
              }
            >
              {product
                ? "Mettre à jour"
                : `Créer dans ${selectedBoutiques.length} boutique(s)`}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProductModal;