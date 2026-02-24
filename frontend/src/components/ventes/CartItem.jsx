// components/ventes/CartItem.jsx
import React from "react";
import { X, Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";

const CartItem = ({ item, onRemove, onUpdateQuantity }) => {
  return (
    <motion.div
      layout
      className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow transition-shadow"
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-800 text-sm truncate">{item.productName}</div>
          <div className="text-xs text-slate-500 mt-1">
            {item.quantity} {item.unit}
            {item.unit !== item.baseUnit && ` (converti de ${item.baseUnit})`}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity - 0.5)}
              disabled={item.quantity <= 0.5}
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                item.quantity <= 0.5
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 0.5)}
              className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 flex items-center justify-center"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="text-right flex flex-col items-end">
          <button
            onClick={() => onRemove(item.id)}
            className="text-slate-400 hover:text-red-600 p-1 -mt-1 -mr-1"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="mt-2">
            <div className="text-sm font-bold text-emerald-700">
              {item.estimatedTotal.toLocaleString()} FCFA
            </div>
            {item.customPrice ? (
              <div className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full mt-1">
                Prix perso
              </div>
            ) : (
              <div className="text-[10px] text-slate-400">
                {item.basePrice.toLocaleString()} × {item.quantity}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CartItem;