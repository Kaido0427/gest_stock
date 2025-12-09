import React from "react";
import {
  RefreshCw,
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
} from "lucide-react";

const DashboardPage = ({ products, sales, stats }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Tableau de bord</h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm">Ventes du jour</p>
              <h3 className="text-3xl font-bold mt-2">
                {stats.today.sales.toLocaleString()} FCFA
              </h3>
              <p className="text-blue-100 text-sm mt-2">
                {stats.today.transactions} transactions
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-green-100 text-sm">Ventes du mois</p>
              <h3 className="text-3xl font-bold mt-2">
                {stats.month.sales.toLocaleString()} FCFA
              </h3>
              <p className="text-green-100 text-sm mt-2">
                {stats.month.transactions} transactions
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-purple-100 text-sm">Produits en stock</p>
              <h3 className="text-3xl font-bold mt-2">
                {products.reduce((sum, p) => sum + p.stock, 0)}
              </h3>
              <p className="text-purple-100 text-sm mt-2">
                {products.length} produits
              </p>
            </div>
            <Package className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Ventes récentes et Alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Ventes récentes
          </h2>
          <div className="space-y-3">
            {sales.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>Aucune vente récente</p>
              </div>
            ) : (
              sales.slice(0, 4).map((sale) => (
                <div
                  key={sale.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {sale.customer}
                    </p>
                    <p className="text-sm text-gray-500">
                      {sale.date} • {sale.items} articles
                    </p>
                  </div>
                  <p className="font-bold text-green-600">
                    {sale.total.toLocaleString()} FCFA
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Alertes Stock
          </h2>
          <div className="space-y-3">
            {products.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>Aucun produit en stock</p>
              </div>
            ) : (
              products
                .filter((p) => p.stock < p.minStock)
                .map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 bg-orange-50 border-l-4 border-orange-500 rounded"
                  >
                    <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Stock: {product.stock} (Min: {product.minStock})
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
