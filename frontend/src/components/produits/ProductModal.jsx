import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Plus } from "lucide-react";
import { addProduit, updateProduit } from "../../services/product";

const ProductModal = ({ isOpen, onClose, product }) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    baseUnit: "",
    units: [],
  });

  const [newUnit, setNewUnit] = useState({
    name: "",
    quantityPerUnit: 1,
    price: 0,
  });

  // Remplit le formulaire en mode édition
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        description: product.description || "",
        category: product.category || "",
        baseUnit: product.baseUnit || "",
        units: product.units || [],
      });
    } else {
      setForm({
        name: "",
        description: "",
        category: "",
        baseUnit: "",
        units: [],
      });
      setNewUnit({
        name: "",
        quantityPerUnit: 1,
        price: 0,
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const value =
      e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleUnitChange = (e) => {
    const value =
      e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setNewUnit({ ...newUnit, [e.target.name]: value });
  };

  const handleAddUnit = () => {
    if (!newUnit.name || newUnit.quantityPerUnit <= 0 || newUnit.price < 0) {
      alert("Veuillez remplir tous les champs de l'unité correctement");
      return;
    }

    // Vérifier si l'unité existe déjà
    const exists = form.units.some((unit) => unit.name === newUnit.name);
    if (exists) {
      alert("Une unité avec ce nom existe déjà");
      return;
    }

    setForm({
      ...form,
      units: [...form.units, { ...newUnit }],
    });

    setNewUnit({
      name: "",
      quantityPerUnit: 1,
      price: 0,
    });
  };

  const handleRemoveUnit = (index) => {
    const updatedUnits = [...form.units];
    updatedUnits.splice(index, 1);
    setForm({ ...form, units: updatedUnits });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.baseUnit) {
      alert("Le nom et l'unité de base sont obligatoires");
      return;
    }

    let res;

    if (product && product._id) {
      res = await updateProduit(product._id, form);
    } else {
      // Pour la création, on initialise stockBase à 0
      const produitACreer = {
        ...form,
        stockBase: 0,
        lots: [],
      };
      res = await addProduit(produitACreer);
    }

    if (res.error) {
      alert(res.error);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
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
                  placeholder="Ex: Huile végétale"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-lg"
                  required
                />
              </div>

              <div>   
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unité de base *
                </label>
                <select
                  name="baseUnit"
                  value={form.baseUnit}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-lg"
                  required
                >
                  <option value="">Sélectionner</option>
                  <option value="L">Litre (L)</option>
                  <option value="kg">Kilogramme (kg)</option>
                  <option value="g">Gramme (g)</option>
                  <option value="ml">Millilitre (ml)</option>
                  <option value="pièce">Pièce</option>
                  <option value="carton">Carton</option>
                  <option value="paquet">Paquet</option>
                  <option value="bidon">Bidon</option>
                </select>
              </div>

              <div className="md:col-span-2">
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
    <option value="Alimentaire">Alimentaire</option>
    <option value="Nettoyage">Nettoyage</option>
    <option value="Boissons">Boissons</option>
    <option value="Papeterie">Papeterie</option>
    <option value="Autre">Autre</option>
  </select>

  {/* Si l'utilisateur choisit "Autre", on affiche un input pour entrer la nouvelle catégorie */}
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
                  Description
                </label>
                <textarea
                  name="description"
                  placeholder="Description du produit"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full border px-3 py-2 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Section Unités de vente */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-700">
                Unités de vente
              </h3>
              <span className="text-sm text-gray-500">
                {form.units.length} unité(s) définie(s)
              </span>
            </div>

            {/* Liste des unités existantes */}
            {form.units.length > 0 && (
              <div className="space-y-2">
                {form.units.map((unit, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{unit.name}</div>
                      <div className="text-sm text-gray-600">
                        {unit.quantityPerUnit} {form.baseUnit} •{" "}
                        {unit.price.toLocaleString()} FCFA
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveUnit(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulaire d'ajout d'une nouvelle unité */}
            <div className="p-4 border border-dashed border-gray-300 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-3">
                Ajouter une unité
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'unité
                  </label>
                  <input
                    name="name"
                    placeholder="Ex: Bouteille 500ml"
                    value={newUnit.name}
                    onChange={handleUnitChange}
                    className="w-full border px-3 py-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité en unité de base
                  </label>
                  <input
                    type="number"
                    name="quantityPerUnit"
                    placeholder="Ex: 0.5"
                    value={newUnit.quantityPerUnit}
                    onChange={handleUnitChange}
                    min="0.01"
                    step="0.01"
                    className="w-full border px-3 py-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix (FCFA)
                  </label>
                  <input
                    type="number"
                    name="price"
                    placeholder="Ex: 1500"
                    value={newUnit.price}
                    onChange={handleUnitChange}
                    min="0"
                    className="w-full border px-3 py-2 rounded-lg"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddUnit}
                className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <Plus className="w-4 h-4" />
                Ajouter cette unité
              </button>
            </div>
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
              className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
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
