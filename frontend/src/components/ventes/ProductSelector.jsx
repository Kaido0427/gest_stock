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
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50/50 shadow-md shadow-indigo-100'
          : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${
          isSelected ? 'bg-indigo-200' : 'bg-indigo-100'
        }`}>
          <Package className={`w-5 h-5 ${isSelected ? 'text-indigo-700' : 'text-indigo-600'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 text-sm truncate">{product.name}</h3>
          <div className="flex flex-wrap gap-1 mt-1">
            {product.category && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-full">
                {product.category}
              </span>
            )}
            {showBoutique && product.boutique_id?.name && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded-full flex items-center gap-0.5">
                <Store className="w-3 h-3" />
                {product.boutique_id.name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Stock:</span>
          <span className={`font-semibold ${
            stockStatus === "épuisé" ? "text-red-600" :
            stockStatus === "faible" ? "text-amber-600" :
            "text-emerald-600"
          }`}>
            {product.stock} {product.unit}
          </span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Prix:</span>
          <span className="font-semibold text-indigo-600">
            {product.basePrice.toLocaleString()} FCFA
          </span>
        </div>

        {stockStatus === "faible" && (
          <div className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded-full inline-block">
            ⚠ Stock faible
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductSelector;