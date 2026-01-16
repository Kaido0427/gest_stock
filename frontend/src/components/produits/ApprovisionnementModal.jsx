import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Package, Plus } from "lucide-react";
import { approvisionnerVariant } from "../../services/product";

const ApprovisionnementModal = ({ isOpen, onClose, product }) => {
  const [form, setForm] = useState({
    variantId: "",
    quantity: 0,
    selectedVariant: null
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      // Sélectionner la première variante par défaut
      setForm({
        variantId: product.variants[0]._id || "",
        quantity: 0,
        selectedVariant: product.variants[0]
      });
    } else {
      setForm({
        variantId: "",
        quantity: 0,
        selectedVariant: null
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const value = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    
    if (e.target.name === "variantId") {
      // Trouver la variante sélectionnée
      const selectedVariant = product.variants.find(v => 
        v._id && v._id.toString() === e.target.value
      );
      
      setForm({ 
        ...form, 
        variantId: value,
        selectedVariant: selectedVariant || null
      });
    } else {
      setForm({ ...form, [e.target.name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!product || !product._id) {
      alert("Produit non sélectionné");
      return;
    }

    if (!form.variantId) {
      alert("Veuillez sélectionner une variante");
      return;
    }

    if (form.quantity <= 0) {
      alert("La quantité doit être supérieure à 0");
      return;
    }

    setLoading(true);

    const res = await approvisionnerVariant(
      product._id,
      form.variantId,
      form.quantity
    );

    setLoading(false);

    if (res.error) {
      alert(res.error);
    } else {
      alert("Approvisionnement réussi !");
      onClose();
    }
  };

  if (!isOpen || !product) return null;

  // Calculer les nouveaux stocks
  const stockActuel = form.selectedVariant ? form.selectedVariant.stock || 0 : 0;
  const nouveauStock = stockActuel + (form.quantity || 0);

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
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Package className="w-6 h-6 text-green-600" />
              Approvisionner une variante
            </h2>
            <p className="text-gray-600 mt-1">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informations du produit */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Produit</div>
              <div className="font-medium text-gray-800">{product.name}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-600">Catégorie</div>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                {product.category || "Non catégorisé"}
              </span>
            </div>
          </div>
        </div>

        {/* Sélection de la variante */}
        {product.variants && product.variants.length > 0 ? (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionnez la variante à approvisionner *
              </label>
              <select
                name="variantId"
                value={form.variantId}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={loading}
              >
                {product.variants.map((variant, index) => (
                  <option key={index} value={variant._id}>
                    {variant.name} - Stock: {variant.stock} - Prix: {variant.price.toLocaleString()} FCFA
                  </option>
                ))}
              </select>
            </div>

            {/* Informations de la variante sélectionnée */}
            {form.selectedVariant && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-600">Variante sélectionnée</div>
                      <div className="font-medium text-gray-800">{form.selectedVariant.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-700">
                        {form.selectedVariant.price.toLocaleString()} FCFA
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Stock actuel</div>
                      <div className="text-2xl font-bold text-blue-700">
                        {stockActuel} pièce(s)
                      </div>
                    </div>
                    
                    {form.quantity > 0 && (
                      <div>
                        <div className="text-sm text-gray-600">Nouveau stock</div>
                        <div className="text-2xl font-bold text-green-700">
                          {nouveauStock} pièce(s)
                        </div>
                        <div className="text-sm text-green-600">
                          +{form.quantity} pièce(s)
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Valeur du stock */}
                  <div className="pt-3 border-t border-green-200">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Valeur actuelle du stock</span>
                      <span className="font-medium">
                        {(form.selectedVariant.price * stockActuel).toLocaleString()} FCFA
                      </span>
                    </div>
                    {form.quantity > 0 && (
                      <div className="flex justify-between mt-1">
                        <span className="text-sm text-gray-600">Nouvelle valeur</span>
                        <span className="font-bold text-green-700">
                          {(form.selectedVariant.price * nouveauStock).toLocaleString()} FCFA
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

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
                  min="1"
                  step="1"
                  placeholder="Nombre de pièces"
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Entrez le nombre de pièces à ajouter au stock
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || !form.variantId || form.quantity <= 0}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Traitement...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Valider l'approvisionnement
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center p-8">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 mb-2">Ce produit n'a pas de variantes</p>
            <p className="text-sm text-gray-500 mb-4">
              Vous devez d'abord créer des variantes pour pouvoir les approvisionner.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ApprovisionnementModal;