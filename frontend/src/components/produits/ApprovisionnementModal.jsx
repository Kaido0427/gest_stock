import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { approvisionnerProduit } from "../../services/product";

const ApprovisionnementModal = ({ isOpen, onClose, product }) => {
  const [form, setForm] = useState({
    quantity: 0,
    name: "",
    expirationDate: ""
  });

  useEffect(() => {
    if (product) {
      // Générer un nom de lot par défaut
      const defaultLotName = `LOT-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      setForm({
        quantity: 0,
        name: defaultLotName,
        expirationDate: ""
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const value = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!product || !product._id) {
      alert("Produit non sélectionné");
      return;
    }

    if (form.quantity <= 0) {
      alert("La quantité doit être supérieure à 0");
      return;
    }

    const res = await approvisionnerProduit(product._id, {
      quantity: form.quantity,
      name: form.name || undefined,
      expirationDate: form.expirationDate || undefined
    });

    if (res.error) {
      alert(res.error);
    } else {
      alert("Approvisionnement réussi !");
      onClose();
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Approvisionner le produit</h2>
            <p className="text-gray-600 mt-1">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between">
            <span className="text-gray-700">Stock actuel :</span>
            <span className="font-semibold">{product.stockBase} {product.baseUnit}</span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Le nouveau stock sera de : <span className="font-semibold">{product.stockBase + form.quantity} {product.baseUnit}</span>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantité à ajouter *
            </label>
            <input
              type="number"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              placeholder={`Quantité en ${product.baseUnit}`}
              className="w-full border px-3 py-2 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du lot (optionnel)
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ex: Lot-2024-01, Fournisseur XYZ"
              className="w-full border px-3 py-2 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date d'expiration (optionnel)
            </label>
            <input
              type="date"
              name="expirationDate"
              value={form.expirationDate}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-lg"
            />
          </div>

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
              className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
            >
              Valider l'approvisionnement
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ApprovisionnementModal;