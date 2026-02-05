import React from "react";
import { motion } from "framer-motion";
import { X, Package, DollarSign, Info, Store, MapPin, Phone, Calendar, TrendingUp } from "lucide-react";

const ProductDetailModal = ({ isOpen, onClose, product }) => {
  if (!isOpen || !product) return null;

  // Calculer la valeur totale du stock
  const valeurTotalStock = (product.stock || 0) * (product.basePrice || 0);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        {/* HEADER */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800">{product.name}</h2>
            {product.description && (
              <p className="text-gray-600 mt-1">{product.description}</p>
            )}

            {/* INFORMATIONS BOUTIQUE */}
            {product.boutique_id && (
              <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Store className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold text-indigo-900">
                      {product.boutique_id.name}
                    </div>
                    {product.boutique_id.address && (
                      <div className="flex items-center gap-1 text-sm text-indigo-700 mt-1">
                        <MapPin className="w-3 h-3" />
                        {product.boutique_id.address}
                      </div>
                    )}
                    {product.boutique_id.phone && (
                      <div className="flex items-center gap-1 text-sm text-indigo-700 mt-1">
                        <Phone className="w-3 h-3" />
                        {product.boutique_id.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                {product.category || "Non catégorisé"}
              </span>
              {product.unit && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                  Unité : {product.unit}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ALERTE STOCK FAIBLE */}
        {product.stock !== undefined && product.stock < 10 && product.stock > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700 font-medium">
              <Package className="w-5 h-5" />
              Attention : Stock faible
            </div>
            <div className="text-sm text-amber-600 mt-1">
              Il ne reste que <strong>{product.stock} {product.unit}</strong> en stock. Pensez à réapprovisionner.
            </div>
          </div>
        )}

        {product.stock === 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 font-medium">
              <Package className="w-5 h-5" />
              Produit épuisé
            </div>
            <div className="text-sm text-red-600 mt-1">
              Ce produit n'est plus en stock. Veuillez réapprovisionner.
            </div>
          </div>
        )}

        {/* STATISTIQUES RAPIDES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-green-700" />
              <span className="text-gray-700 font-medium">Stock disponible</span>
            </div>
            <div className="text-2xl font-bold text-green-700">
              {product.stock || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">{product.unit || 'unité'}</div>
          </div>

          <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-blue-700" />
              <span className="text-gray-700 font-medium">Prix unitaire</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {(product.basePrice || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">FCFA / {product.unit || 'unité'}</div>
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-700" />
              <span className="text-gray-700 font-medium">Valeur totale</span>
            </div>
            <div className="text-2xl font-bold text-purple-700">
              {valeurTotalStock.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">FCFA</div>
          </div>
        </div>

        {/* DÉTAILS DU PRODUIT */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
            <Info className="w-5 h-5 text-blue-600" />
            Informations détaillées
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colonne 1 : Informations produit */}
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Informations stock
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantité actuelle :</span>
                    <span className="font-semibold text-gray-900">
                      {product.stock || 0} {product.unit || 'unité'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unité de mesure :</span>
                    <span className="font-semibold text-gray-900">
                      {product.unit || 'Non définie'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Statut :</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.stock === 0
                          ? 'bg-red-100 text-red-800'
                          : product.stock < 10
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {product.stock === 0
                        ? 'Épuisé'
                        : product.stock < 10
                        ? 'Stock faible'
                        : 'En stock'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Tarification
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prix de base :</span>
                    <span className="font-semibold text-green-700">
                      {(product.basePrice || 0).toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Par :</span>
                    <span className="font-semibold text-gray-900">
                      {product.unit || 'unité'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600">Valeur du stock :</span>
                    <span className="font-semibold text-purple-700">
                      {valeurTotalStock.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne 2 : Métadonnées */}
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Informations générales
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Catégorie :</span>
                    <span className="font-semibold text-gray-900">
                      {product.category || 'Non définie'}
                    </span>
                  </div>
                  {product.description && (
                    <div className="pt-2 border-t">
                      <span className="text-gray-600 block mb-1">Description :</span>
                      <p className="text-gray-900 text-sm">
                        {product.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Dates
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Créé le :</span>
                    <span className="font-medium text-gray-900">
                      {product.createdAt
                        ? new Date(product.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Modifié le :</span>
                    <span className="font-medium text-gray-900">
                      {product.updatedAt
                        ? new Date(product.updatedAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AIDE VENTE */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              💡 Comment vendre ce produit ?
            </h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                • Stock enregistré : <strong>{product.stock} {product.unit}</strong>
              </p>
              <p>
                • Lors de la vente, vous pourrez choisir l'unité de vente (ex: vendre en {product.unit === 'L' ? 'mL, cL' : product.unit === 'kg' ? 'g' : 'autres unités'})
              </p>
              <p>
                • Le système convertira automatiquement et déduira du stock
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-6 pt-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProductDetailModal;