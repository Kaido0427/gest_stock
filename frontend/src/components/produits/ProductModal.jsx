import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Store } from "lucide-react";
import { addProduit, updateProduit } from "../../services/product";
import { getAllBoutiques } from "../../services/boutique";

const ProductModal = ({ isOpen, onClose, product }) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    customCategory: "",
    boutique_id: "",
    stock: 0,
    unit: "",
    basePrice: 0,
  });

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
      setForm({
        name: product.name || "",
        description: product.description || "",
        category: product.category || "",
        customCategory: "",
        boutique_id: product.boutique_id?._id || product.boutique_id || "",
        stock: product.stock || 0,
        unit: product.unit || "",
        basePrice: product.basePrice || 0,
      });
    } else {
      setForm({
        name: "",
        description: "",
        category: "",
        customCategory: "",
        boutique_id: "",
        stock: 0,
        unit: "",
        basePrice: 0,
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const value =
      e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name) {
      alert("Le nom du produit est obligatoire");
      return;
    }

    if (!form.boutique_id) {
      alert("Veuillez sélectionner une boutique");
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

    if (form.stock < 0) {
      alert("Le stock ne peut pas être négatif");
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
      boutique_id: form.boutique_id,
      stock: form.stock,
      unit: form.unit,
      basePrice: form.basePrice,
    };

    let res;
    if (product && product._id) {
      res = await updateProduit(product._id, produitData);
    } else {
      res = await addProduit(produitData);
    }

    if (res.error) {
      alert(res.error);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Catégories d'exemple
  const categories = [
    "Alimentaire",
    "Boissons",
    "Liquides",
    "Céréales",
    "Condiments",
    "Ustensiles",
    "Nettoyage",
    "Cosmétique",
    "Meuble",
    "Électronique",
    "Textile",
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

  // Calculer la valeur totale du stock
  const valeurTotalStock = form.stock * form.basePrice;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
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
                  placeholder="Ex: Huile végétale, Riz, Savon"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Boutique */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  Boutique *
                </label>
                <select
                  name="boutique_id"
                  value={form.boutique_id}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loadingBoutiques}
                >
                  <option value="">
                    {loadingBoutiques
                      ? "Chargement..."
                      : "Sélectionner une boutique"}
                  </option>
                  {boutiques.map((boutique) => (
                    <option key={boutique._id} value={boutique._id}>
                      {boutique.name}{" "}
                      {boutique.address && `- ${boutique.address}`}
                    </option>
                  ))}
                </select>
                {boutiques.length === 0 && !loadingBoutiques && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ Aucune boutique disponible. Créez-en une d'abord.
                  </p>
                )}
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
                  placeholder="Description du produit"
                  value={form.description}
                  onChange={handleChange}
                  rows="2"
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section Stock et Prix */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700 border-b pb-2">
              📦 Stock et tarification
            </h3>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 <strong>Important :</strong> Enregistrez la quantité
                physique réelle que vous avez en stock. Lors de la vente, vous
                pourrez vendre dans n'importe quelle unité (ex: stock en
                litres, vente en mL).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité en stock *
                </label>
                <input
                  type="number"
                  name="stock"
                  placeholder="Ex: 50"
                  value={form.stock}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

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
                  placeholder="Ex: 1500"
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

            {/* Aperçu */}
            {form.stock > 0 && form.unit && form.basePrice > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quantité en stock:</span>
                    <span className="font-medium text-blue-600">
                      {form.stock} {form.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Prix unitaire:</span>
                    <span className="font-medium text-green-600">
                      {form.basePrice.toLocaleString()} FCFA / {form.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                    <span className="text-gray-700">Valeur totale:</span>
                    <span className="text-green-700">
                      {valeurTotalStock.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-600 p-3 bg-green-50 rounded border border-green-100">
                  ✅ <strong>Exemple de vente :</strong> Si votre stock est en{" "}
                  {form.unit}, vous pourrez vendre en différentes unités lors de
                  la vente (le système convertira automatiquement).
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
              disabled={!form.boutique_id || !form.unit || form.basePrice <= 0}
            >
              {product ? "Mettre à jour" : "Créer le produit"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProductModal;