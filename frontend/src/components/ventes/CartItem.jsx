// components/CartItem.jsx
import React from "react";
import { X } from "lucide-react";

const CartItem = ({ item, onRemove, onUpdateQuantity }) => {
  const total = item.price * item.quantity;

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-semibold text-gray-900 text-sm">{item.productName}</div>
          <div className="text-gray-600 text-xs mt-1">{item.variantName}</div>
          
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className={`w-6 h-6 rounded flex items-center justify-center ${
                  item.quantity <= 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                -
              </button>
              <span className="font-medium">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                disabled={item.quantity >= item.maxStock}
                className={`w-6 h-6 rounded flex items-center justify-center ${
                  item.quantity >= item.maxStock 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                +
              </button>
            </div>
            <div className="text-xs text-gray-500">
              {item.maxStock} max
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
              {total.toLocaleString()} FCFA
            </div>
            <div className="text-xs text-gray-500">
              {item.price.toLocaleString()} FCFA × {item.quantity}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;