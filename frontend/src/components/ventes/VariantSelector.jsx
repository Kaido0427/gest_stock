// components/VariantSelector.jsx
import React, { useState } from "react";
import { Package, DollarSign, ChevronDown } from "lucide-react";

const VariantSelector = ({ product, onSelectVariant, selectedVariant }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!product.variants || product.variants.length === 0) {
        return (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                <Package className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Aucune variante disponible</p>
            </div>
        );
    }

    const handleSelect = (variant) => {
        onSelectVariant(variant);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            {/* Bouton de sélection */}
            {selectedVariant ? (
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-3 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="font-medium text-gray-900">{selectedVariant.name}</div>
                            <div className="text-sm text-gray-600 mt-1">
                                Stock: {selectedVariant.stock} • Prix: {selectedVariant.price.toLocaleString()} FCFA
                            </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full p-3 bg-blue-50 border border-blue-300 rounded-lg text-blue-700 font-medium hover:bg-blue-100 flex justify-between items-center"
                >
                    <span>Sélectionner une variante</span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            )}

            {/* Dropdown des variantes */}
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {product.variants.map((variant, index) => (
                        <div
                            key={index}
                            onClick={() => handleSelect(variant)}
                            className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${selectedVariant?._id === variant._id ? 'bg-blue-50' : ''
                                } ${variant.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">{variant.name}</div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        {variant.stock} pièces disponibles
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-green-700">
                                        {variant.price.toLocaleString()} FCFA
                                    </div>
                                    {variant.stock < 5 && variant.stock > 0 && (
                                        <div className="text-xs text-amber-600 mt-1">Stock faible</div>
                                    )}
                                    {variant.stock === 0 && (
                                        <div className="text-xs text-red-600 mt-1">Épuisé</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VariantSelector;