import React, { useState } from "react";
import { Search, Filter, Package, ShoppingCart } from "lucide-react";

const SalesPage = ({ products, cart, setCart }) => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">
        Caisse / Point de vente
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des produits */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtrer
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400">
                <Package className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p>Aucun produit disponible</p>
              </div>
            ) : (
              products
                .filter((p) =>
                  p.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((product) => (
                  <div
                    key={product.id}
                    onClick={() => setCart([...cart, { ...product, qty: 1 }])}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-all hover:shadow-md"
                  >
                    <div className="bg-gray-100 w-full h-24 rounded-lg mb-3 flex items-center justify-center">
                      <Package className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-1">
                      {product.name}
                    </h3>
                    <p className="text-blue-600 font-bold">
                      {product.price.toLocaleString()} FCFA
                    </p>
                    <p className="text-xs text-gray-500">
                      Stock: {product.stock}
                    </p>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Panier */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Panier</h2>

          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p>Panier vide</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                {cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">Qté: {item.qty}</p>
                    </div>
                    <p className="font-bold text-sm">
                      {(item.price * item.qty).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">
                    {cart
                      .reduce((sum, item) => sum + item.price * item.qty, 0)
                      .toLocaleString()}{" "}
                    FCFA
                  </span>
                </div>
              </div>

              <button className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                Valider la vente
              </button>
              <button
                onClick={() => setCart([])}
                className="w-full mt-2 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Vider le panier
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesPage;
