// components/ventes/CartItem.jsx
import React from "react";
import { X } from "lucide-react";

const CartItem = ({ item, onRemove, onUpdateQuantity }) => {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-semibold text-gray-900 text-sm">{item.productName}</div>
          <div className="text-gray-600 text-xs mt-1">
            {item.quantity} {item.unit}
            {item.unit !== item.baseUnit && ` (converti de ${item.baseUnit})`}
          </div>
          
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity - 0.5)}
                disabled={item.quantity <= 0.5}
                className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
                  item.quantity <= 0.5
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                -
              </button>
              <span className="font-medium">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity + 0.5)}
                className="w-6 h-6 rounded flex items-center justify-center text-xs bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                +
              </button>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <button
            onClick={() => onRemove(item.id)}
            className="text-gray-400 hover:text-red-600 p-1 mb-2"
          >
            <X className="w-4 h-4" />
          </button>
          <div>
            <div className="text-sm font-bold text-green-700">
              {item.estimatedTotal.toLocaleString()} FCFA
            </div>
            {item.customPrice ? (
              <div className="text-xs text-purple-600">Prix personnalisé</div>
            ) : (
              <div className="text-xs text-gray-500">
                {item.basePrice.toLocaleString()} × {item.quantity}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;