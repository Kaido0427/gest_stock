import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Plus, Package } from "lucide-react";
import { addProduit, updateProduit } from "../../services/product";

const ProductModal = ({ isOpen, onClose, product }) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    customCategory: "",
    variants: [], // Remplace units et lots
  });

  const [newVariant, setNewVariant] = useState({
    name: "",
    price: 0,
    stock: 0,
  });

  // Remplit le formulaire en mode édition
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        description: product.description || "",
        category: product.category || "",
        customCategory: "",
        variants: product.variants || [], // Charger les variantes existantes
      });
    } else {
      setForm({
        name: "",
        description: "",
        category: "",
        customCategory: "",
        variants: [], // Variantes vide pour nouveau produit
      });
      setNewVariant({
        name: "",
        price: 0,
        stock: 0,
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const value =
      e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleVariantChange = (e) => {
    const value =
      e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setNewVariant({ ...newVariant, [e.target.name]: value });
  };

  const handleAddVariant = () => {
    if (!newVariant.name || newVariant.price < 0 || newVariant.stock < 0) {
      alert("Veuillez remplir tous les champs de la variante correctement");
      return;
    }

    // Vérifier si une variante avec le même nom existe déjà
    const exists = form.variants.some(v =>
      v.name.toLowerCase() === newVariant.name.toLowerCase()
    );
    if (exists) {
      alert("Une variante avec ce nom existe déjà");
      return;
    }

    setForm({
      ...form,
      variants: [...form.variants, { ...newVariant }],
    });

    // Réinitialiser le formulaire de variante
    setNewVariant({
      name: "",
      price: 0,
      stock: 0,
    });
  };

  const handleRemoveVariant = (index) => {
    const updatedVariants = [...form.variants];
    updatedVariants.splice(index, 1);
    setForm({ ...form, variants: updatedVariants });
  };

  const handleUpdateVariant = (index, field, value) => {
    const updatedVariants = [...form.variants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: field === 'price' || field === 'stock' ? Number(value) : value,
      _id: updatedVariants[index]._id // Garder l'ID pour les mises à jour
    };
    setForm({ ...form, variants: updatedVariants });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name) {
      alert("Le nom du produit est obligatoire");
      return;
    }

    if (form.variants.length === 0) {
      alert("Veuillez ajouter au moins une variante");
      return;
    }

    // Gérer la catégorie personnalisée
    const finalCategory = form.category === "Autre" && form.customCategory
      ? form.customCategory
      : form.category;

    let res;

    const produitData = {
      name: form.name,
      description: form.description,
      category: finalCategory,
      variants: form.variants,
    };

    if (product && product._id) {
      // Pour l'édition, on doit envoyer toutes les variantes avec leurs _id
      const variantsToSend = form.variants.map(v => ({
        _id: v._id, // Garder l'ID pour les variantes existantes
        name: v.name,
        price: v.price,
        stock: v.stock,
      }));

      res = await updateProduit(product._id, {
        ...produitData,
        variants: variantsToSend
      });
    } else {
      // Pour la création, pas besoin d'_id
      res = await addProduit(produitData);
    }

    if (res.error) {
      alert(res.error);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Calculer le stock total
  const stockTotal = form.variants.reduce((sum, variant) => sum + variant.stock, 0);
  // Calculer la valeur totale du stock
  const valeurTotalStock = form.variants.reduce(
    (sum, variant) => sum + (variant.price * variant.stock), 0
  );

  // Catégories d'exemple (peuvent venir d'une API)
  const categories = [
    "Alimentaire",
    "Boissons",
    "Ustensiles",
    "Nettoyage",
    "Cosmétique",
    "Meuble",
    "Électronique",
    "Textile",
    "Autre"
  ];

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
            <h3 className="text-lg font-medium text-gray-700">
              Informations de base
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du produit *
                </label>
                <input
                  name="name"
                  placeholder="Ex: Lit"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-lg"
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
                  className="w-full border px-3 py-2 rounded-lg"
                  required
                >
                  <option value="">Sélectionner</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {form.category === "Autre" && (
                  <input
                    name="customCategory"
                    placeholder="Entrez une nouvelle catégorie"
                    value={form.customCategory || ""}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded-lg mt-2"
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
                  className="w-full border px-3 py-2 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Section Variantes */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-700">
                Variantes du produit
              </h3>
              <div className="text-right">
                <span className="text-sm text-gray-500">
                  {form.variants.length} variante(s)
                </span>
                {stockTotal > 0 && (
                  <div className="text-sm font-medium text-blue-600">
                    Stock total: {stockTotal} pièces
                  </div>
                )}
              </div>
            </div>

            {form.variants.length > 0 && (
              <div className="space-y-3">
                {/* En-tête du tableau */}
                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700 border-b pb-2">
                  <div className="col-span-4">Nom de la variante *</div>
                  <div className="col-span-3">Prix (FCFA) *</div>
                  <div className="col-span-3">Stock *</div>
                  <div className="col-span-2">Actions</div>
                </div>

                {/* Liste des variantes */}
                {form.variants.map((variant, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded-lg">
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => handleUpdateVariant(index, 'name', e.target.value)}
                        placeholder="Ex: Lit une place"
                        className="w-full border px-3 py-2 rounded-lg text-sm"
                      />
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        value={variant.price}
                        onChange={(e) => handleUpdateVariant(index, 'price', e.target.value)}
                        min="0"
                        step="1"
                        className="w-full border px-3 py-2 rounded-lg text-sm"
                      />
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        value={variant.stock}
                        onChange={(e) => handleUpdateVariant(index, 'stock', e.target.value)}
                        min="0"
                        step="1"
                        className="w-full border px-3 py-2 rounded-lg text-sm"
                      />
                    </div>

                    <div className="col-span-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(index)}
                        className="text-red-500 hover:text-red-700 p-2"
                        title="Supprimer cette variante"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Information additionnelle */}
                    <div className="col-span-12 text-xs text-gray-500 mt-1 pl-2">
                      Valeur du stock: {(variant.price * variant.stock).toLocaleString()} FCFA
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Formulaire pour ajouter une nouvelle variante */}
            <div className="p-4 border border-dashed border-blue-300 rounded-lg bg-blue-50/30">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Ajouter une nouvelle variante
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la variante *
                  </label>
                  <input
                    name="name"
                    placeholder="Ex: Lit deux places"
                    value={newVariant.name}
                    onChange={handleVariantChange}
                    className="w-full border px-3 py-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix (FCFA) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    placeholder="Ex: 35000"
                    value={newVariant.price}
                    onChange={handleVariantChange}
                    min="0"
                    step="1"
                    className="w-full border px-3 py-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock initial *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    placeholder="Ex: 4"
                    value={newVariant.stock}
                    onChange={handleVariantChange}
                    min="0"
                    step="1"
                    className="w-full border px-3 py-2 rounded-lg"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddVariant}
                className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full"
              >
                <Plus className="w-4 h-4" />
                Ajouter cette variante
              </button>
            </div>

            {/* Statistiques */}
            {form.variants.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Nombre de variantes:</span>
                    <span className="font-medium">{form.variants.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Stock total:</span>
                    <span className="font-medium text-blue-600">{stockTotal} pièces</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Valeur totale du stock:</span>
                    <span className="font-medium text-green-600">{valeurTotalStock.toLocaleString()} FCFA</span>
                  </div>
                </div>

                <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded border border-blue-100">
                  💡 <strong>Conseil :</strong> Ajoutez toutes les variantes de ce produit.
                  Exemple pour "Lit": "Lit une place", "Lit deux places", "Lit enfant", etc.
                </div>
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={form.variants.length === 0}
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