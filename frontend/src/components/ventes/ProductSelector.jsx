// components/ventes/ProductSelector.jsx
import React from "react";
import { motion } from "framer-motion";
import { Package, Store } from "lucide-react";

const ProductSelector = ({ product, isSelected, onSelect, showBoutique = false }) => {
  const stockStatus = product.stock === 0
    ? "épuisé"
    : product.stock < 10
    ? "faible"
    : "normal";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Package className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 text-sm mb-1">
            {product.name}
          </h3>
          <div className="flex flex-wrap gap-1">
            {product.category && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {product.category}
              </span>
            )}
            {showBoutique && product.boutique_id?.name && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center gap-1">
                <Store className="w-3 h-3" />
                {product.boutique_id.name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Stock:</span>
          <span className={`font-semibold ${
            stockStatus === "épuisé" ? "text-red-600" :
            stockStatus === "faible" ? "text-amber-600" :
            "text-green-600"
          }`}>
            {product.stock} {product.unit}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Prix:</span>
          <span className="font-semibold text-blue-600">
            {product.basePrice.toLocaleString()} FCFA/{product.unit}
          </span>
        </div>

        {stockStatus === "faible" && (
          <div className="text-xs text-amber-600 mt-1">
            ⚠ Stock faible
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductSelector;