import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Package, Plus, ArrowRight, Store } from "lucide-react";
import { approvisionnerProduit, transfertStockBoutiques } from "../../services/product";
import { getAllBoutiques } from "../../services/boutique";

const ApprovisionnementModal = ({ isOpen, onClose, product }) => {
  const [modeAppro, setModeAppro] = useState("direct"); // "direct" ou "transfert"
  const [form, setForm] = useState({
    quantity: 0,
    unit: "",
    boutiqueSrcId: "", // Pour le transfert
  });

  const [boutiques, setBoutiques] = useState([]);
  const [loadingBoutiques, setLoadingBoutiques] = useState(false);
  const [loading, setLoading] = useState(false);

  // Charger les boutiques
  useEffect(() => {
    const fetchBoutiques = async () => {
      setLoadingBoutiques(true);
      const res = await getAllBoutiques();
      if (!res.error) {
        setBoutiques(res);
      }
      setLoadingBoutiques(false);
    };

    if (isOpen && modeAppro === "transfert") {
      fetchBoutiques();
    }
  }, [isOpen, modeAppro]);

  useEffect(() => {
    if (product) {
      setForm({
        quantity: 0,
        unit: product.unit || "",
        boutiqueSrcId: "",
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

    setLoading(true);

    let res;

    if (modeAppro === "direct") {
      // ✅ Approvisionnement direct
      console.log("📦 Approvisionnement direct:", {
        productId: product._id,
        quantity: form.quantity,
        unit: form.unit,
      });

      res = await approvisionnerProduit(product._id, {
        quantity: form.quantity,
        unit: form.unit,
      });
    } else {
      // ✅ Transfert entre boutiques
      if (!form.boutiqueSrcId) {
        alert("Veuillez sélectionner la boutique source");
        setLoading(false);
        return;
      }

      // ⚠️ CORRECTION : On doit trouver le produit dans la boutique SOURCE
      // Le backend cherche le produit par son nom dans la boutique source
      const transferData = {
        produitId: product._id, // ID du produit (pour identifier quel produit)
        boutiqueSrcId: form.boutiqueSrcId, // Boutique d'où on retire le stock
        boutiqueDestId: product.boutique_id._id || product.boutique_id, // Boutique où on ajoute le stock
        quantity: form.quantity,
        unit: form.unit,
      };

      console.log("🔄 Transfert entre boutiques:", transferData);

      res = await transfertStockBoutiques(transferData);
    }

    setLoading(false);

    if (res.error) {
      alert(`Erreur: ${res.error}`);
    } else {
      alert(
        modeAppro === "direct"
          ? "Approvisionnement réussi !"
          : "Transfert de stock réussi !"
      );
      onClose();
    }
  };

  if (!isOpen || !product) return null;

  // Calculer les nouveaux stocks
  const stockActuel = product.stock || 0;
  const nouveauStock = stockActuel + (form.quantity || 0);
  const valeurAjoutee = (product.basePrice || 0) * (form.quantity || 0);
  const nouvelleValeur = (product.basePrice || 0) * nouveauStock;

  // Unités disponibles
  const units = [
    { label: "Liquides", options: ["L", "cL", "mL", "kL"] },
    { label: "Poids", options: ["kg", "g", "mg", "t"] },
    {
      label: "Comptables",
      options: ["pièce", "sachet", "bouteille", "carton", "paquet", "boîte"],
    },
  ];

  // Filtrer les autres boutiques pour le transfert
  const autresBoutiques = boutiques.filter(
    (b) => b._id !== (product.boutique_id._id || product.boutique_id)
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Package className="w-6 h-6 text-green-600" />
              Approvisionner le stock
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

        {/* Sélection du mode d'approvisionnement */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mode d'approvisionnement
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setModeAppro("direct")}
              className={`p-4 rounded-lg border-2 transition-all ${
                modeAppro === "direct"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Package className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <div className="font-medium text-gray-800">
                Approvisionnement direct
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Ajouter du stock manuellement
              </div>
            </button>

            <button
              type="button"
              onClick={() => setModeAppro("transfert")}
              className={`p-4 rounded-lg border-2 transition-all ${
                modeAppro === "transfert"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <ArrowRight className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <div className="font-medium text-gray-800">
                Transfert entre boutiques
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Transférer depuis une autre boutique
              </div>
            </button>
          </div>
        </div>

        {/* Informations du produit */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Produit</div>
              <div className="font-medium text-gray-800">{product.name}</div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Boutique destination</div>
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-indigo-500" />
                <span className="font-medium text-gray-800">
                  {product.boutique_id?.name || "Non définie"}
                </span>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Stock actuel</div>
              <div className="font-bold text-blue-600">
                {stockActuel} {product.unit}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Prix unitaire</div>
              <div className="font-medium text-green-600">
                {(product.basePrice || 0).toLocaleString()} FCFA / {product.unit}
              </div>
            </div>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Boutique source (uniquement pour transfert) */}
          {modeAppro === "transfert" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Boutique source *
              </label>
              <select
                name="boutiqueSrcId"
                value={form.boutiqueSrcId}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={loading || loadingBoutiques}
                required
              >
                <option value="">
                  {loadingBoutiques
                    ? "Chargement..."
                    : "Sélectionner la boutique source"}
                </option>
                {autresBoutiques.map((boutique) => (
                  <option key={boutique._id} value={boutique._id}>
                    {boutique.name}
                    {boutique.address && ` - ${boutique.address}`}
                  </option>
                ))}
              </select>
              {autresBoutiques.length === 0 && !loadingBoutiques && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Aucune autre boutique disponible pour le transfert
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="Ex: 100"
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unité
              </label>
              <select
                name="unit"
                value={form.unit}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500"
                disabled={loading}
              >
                <option value={product.unit}>
                  {product.unit} (unité de base)
                </option>
                {units.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options
                      .filter((u) => u !== product.unit)
                      .map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {form.unit !== product.unit
                  ? `Sera converti en ${product.unit}`
                  : "Unité de base du produit"}
              </p>
            </div>
          </div>

          {/* Aperçu */}
          {form.quantity > 0 && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
              <h4 className="font-medium text-gray-700 mb-3">
                📊 Aperçu après approvisionnement
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Nouveau stock</div>
                  <div className="text-2xl font-bold text-green-700">
                    {form.unit !== product.unit
                      ? `${nouveauStock} ${product.unit}`
                      : `${nouveauStock} ${form.unit}`}
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    +{form.quantity} {form.unit}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600">Nouvelle valeur</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {nouvelleValeur.toLocaleString()} FCFA
                  </div>
                  <div className="text-sm text-purple-600 mt-1">
                    +{valeurAjoutee.toLocaleString()} FCFA
                  </div>
                </div>
              </div>

              {form.unit !== product.unit && (
                <div className="mt-3 pt-3 border-t border-green-200 text-sm text-green-700">
                  💡 La quantité sera automatiquement convertie de {form.unit} en{" "}
                  {product.unit}
                </div>
              )}
            </div>
          )}

          {/* Boutons */}
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
              className={`px-5 py-2 rounded-lg text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                modeAppro === "direct"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={
                loading ||
                form.quantity <= 0 ||
                (modeAppro === "transfert" && !form.boutiqueSrcId)
              }
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Traitement...
                </>
              ) : (
                <>
                  {modeAppro === "direct" ? (
                    <Plus className="w-4 h-4" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  {modeAppro === "direct"
                    ? "Valider l'approvisionnement"
                    : "Valider le transfert"}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ApprovisionnementModal;