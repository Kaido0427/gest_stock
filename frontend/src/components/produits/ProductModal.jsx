import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { addProduit, updateProduit } from "../../services/product";

const ProductModal = ({ isOpen, onClose, product }) => {
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: 0,
    supplier: "",
  });

  // Remplit le formulaire en mode édition
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        category: product.category || "",
        price: product.price || 0,
        supplier: product.supplier || "",
      });
    } else {
      setForm({ name: "", category: "", price: 0, supplier: "" });
    }
  }, [product]);

  const handleChange = (e) => {
    let value = e.target.value;

    // Convertir les inputs numériques
    if (e.target.type === "number") {
      value = Number(value);
    }

    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let res;

    if (product && product.id) {
      res = await updateProduit(product.id, form);
    } else {
      res = await addProduit(form);
    }

    if (res.error) alert(res.error);
    else onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
      >
        <h2 className="text-xl font-semibold mb-4">
          {product ? "Modifier le produit" : "Nouveau produit"}
        </h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="Nom du produit"
            value={form.name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-lg"
            required
          />

          <input
            name="category"
            placeholder="Catégorie"
            value={form.category}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-lg"
          />

          <input
            type="number"
            name="price"
            placeholder="Prix"
            value={form.price}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-lg"
            required
          />

          <input
            name="supplier"
            placeholder="Fournisseur"
            value={form.supplier}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-lg"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              {product ? "Mettre à jour" : "Créer"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProductModal;
