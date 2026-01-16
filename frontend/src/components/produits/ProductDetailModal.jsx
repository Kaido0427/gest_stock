import React from "react";
import { motion } from "framer-motion";
import { X, Package, Tag, DollarSign, Info } from "lucide-react";

const ProductDetailModal = ({ isOpen, onClose, product }) => {
  if (!isOpen || !product) return null;

  // Calculer le stock total et la valeur totale
  const stockTotal = product.variants?.reduce((sum, variant) => sum + variant.stock, 0) || 0;
  const valeurTotalStock = product.variants?.reduce(
    (sum, variant) => sum + (variant.price * variant.stock), 0
  ) || 0;
  
  // Trouver le prix minimum et maximum
  const prixMin = product.variants?.length > 0 
    ? Math.min(...product.variants.map(v => v.price))
    : 0;
  const prixMax = product.variants?.length > 0 
    ? Math.max(...product.variants.map(v => v.price))
    : 0;

  // Trier les variantes par stock (du plus bas au plus haut)
  const variantsSortedByStock = [...(product.variants || [])].sort((a, b) => a.stock - b.stock);
  
  // Trier par prix (du plus bas au plus haut)
  const variantsSortedByPrice = [...(product.variants || [])].sort((a, b) => a.price - b.price);

  // Variantes avec stock faible (moins de 5)
  const variantsStockFaible = product.variants?.filter(v => v.stock < 5) || [];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* HEADER */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{product.name}</h2>
            {product.description && (
              <p className="text-gray-600 mt-1">{product.description}</p>
            )}
            <div className="flex gap-2 mt-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                {product.category || "Non catégorisé"}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                {product.variants?.length || 0} variante(s)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STATISTIQUES RAPIDES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-green-700" />
              <span className="text-gray-700 font-medium">Stock total</span>
            </div>
            <div className="text-2xl font-bold text-green-700">{stockTotal}</div>
            <div className="text-sm text-gray-600 mt-1">pièces</div>
          </div>

          <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-blue-700" />
              <span className="text-gray-700 font-medium">Valeur totale</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {valeurTotalStock.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">FCFA</div>
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-5 h-5 text-purple-700" />
              <span className="text-gray-700 font-medium">Variantes</span>
            </div>
            <div className="text-2xl font-bold text-purple-700">
              {product.variants?.length || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">versions</div>
          </div>

          <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-amber-700" />
              <span className="text-gray-700 font-medium">Gamme de prix</span>
            </div>
            <div className="text-xl font-bold text-amber-700">
              {prixMin.toLocaleString()} - {prixMax.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">FCFA</div>
          </div>
        </div>

        {/* VARIANTES */}
        <div className="space-y-6">
          {/* ALERTE STOCK FAIBLE */}
          {variantsStockFaible.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                <Package className="w-5 h-5" />
                Attention : Stock faible sur {variantsStockFaible.length} variante(s)
              </div>
              <div className="text-sm text-red-600">
                Les variantes suivantes ont un stock inférieur à 5 pièces :
                <ul className="mt-1 ml-5 list-disc">
                  {variantsStockFaible.map((v, index) => (
                    <li key={index}>
                      <span className="font-medium">{v.name}</span> : {v.stock} pièce(s) restante(s)
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Toutes les variantes
          </h3>

          {product.variants && product.variants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Variante
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Prix unitaire
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Valeur du stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {product.variants.map((variant, index) => (
                    <tr 
                      key={index} 
                      className={`hover:bg-gray-50 ${variant.stock < 5 ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{variant.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-2 text-gray-400" />
                          <span className={`font-semibold ${variant.stock < 5 ? 'text-red-600' : 'text-gray-900'}`}>
                            {variant.stock}
                          </span>
                          <span className="text-gray-500 ml-1">pièce(s)</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center text-green-700 font-semibold">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {variant.price.toLocaleString()} FCFA
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-blue-700">
                          {(variant.price * variant.stock).toLocaleString()} FCFA
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          variant.stock === 0 
                            ? 'bg-red-100 text-red-800' 
                            : variant.stock < 5 
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {variant.stock === 0 ? 'Épuisé' : 
                           variant.stock < 5 ? 'Stock faible' : 
                           'En stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* STATISTIQUES DÉTAILLÉES */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Variantes par stock</h4>
                  <div className="space-y-1">
                    {variantsSortedByStock.slice(0, 3).map((variant, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600 truncate">{variant.name}</span>
                        <span className="font-medium">{variant.stock} pcs</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Variantes par prix</h4>
                  <div className="space-y-1">
                    {variantsSortedByPrice.slice(0, 3).map((variant, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600 truncate">{variant.name}</span>
                        <span className="font-medium text-green-600">
                          {variant.price.toLocaleString()} FCFA
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Informations</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Créé le:</span>
                      <span>
                        {product.createdAt 
                          ? new Date(product.createdAt).toLocaleDateString("fr-FR")
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dernière modif:</span>
                      <span>
                        {product.updatedAt 
                          ? new Date(product.updatedAt).toLocaleDateString("fr-FR")
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-500">Aucune variante définie</p>
              <p className="text-sm text-gray-400 mt-1">
                Ajoutez des variantes dans la page de modification
              </p>
            </div>
          )}
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