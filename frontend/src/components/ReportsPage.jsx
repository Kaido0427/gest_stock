import React from "react";
import { Download, Calendar } from "lucide-react";

const ReportsPage = ({ stats, products }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Rapports</h1>
        <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
          <Download className="w-4 h-4" />
          Exporter PDF
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-blue-500 bg-blue-50 rounded-lg transition-colors">
            <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="font-semibold text-gray-800">Aujourd'hui</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {stats.today.sales.toLocaleString()} FCFA
            </p>
          </button>
          <button className="p-4 border-2 border-gray-200 hover:border-blue-500 rounded-lg transition-colors">
            <Calendar className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <p className="font-semibold text-gray-800">Ce mois</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {stats.month.sales.toLocaleString()} FCFA
            </p>
          </button>
          <button className="p-4 border-2 border-gray-200 hover:border-blue-500 rounded-lg transition-colors">
            <Calendar className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <p className="font-semibold text-gray-800">Cette année</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {stats.year.sales.toLocaleString()} FCFA
            </p>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Ventes par jour
          </h2>
          <div className="h-64 bg-gradient-to-t from-blue-50 to-transparent rounded-lg flex items-center justify-center">
            <p className="text-gray-400">Graphique des ventes</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Top produits</h2>
          <div className="space-y-3">
            {products.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>Aucune donnée disponible</p>
              </div>
            ) : (
              products.slice(0, 5).map((product, i) => (
                <div key={product.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {product.name}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `0%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="font-bold text-gray-600">0 ventes</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
