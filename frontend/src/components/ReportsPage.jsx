import React, { useEffect, useState } from "react";
import { Download, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { getHistoriqueVentes, getStatistiquesVentes } from "../services/sale";

const StatCard = ({ title, value, icon, color }) => (
  <button
    className={`p-4 border-2 rounded-lg transition-colors ${color.border} ${color.bg} hover:border-blue-500`}
  >
    {React.cloneElement(icon, { className: `w-6 h-6 ${color.icon} mx-auto mb-2` })}
    <p className="font-semibold text-gray-800 text-center">{title}</p>
    <p className={`text-2xl font-bold mt-2 text-center ${color.text}`}>
      {value.toLocaleString()} FCFA
    </p>
  </button>
);

const VenteList = ({ ventes, page, pages, onPageChange }) => {
  if (!ventes || ventes.length === 0)
    return <div className="text-center py-8 text-gray-400">Aucune vente disponible</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Historique des ventes</h2>
      <div className="overflow-x-auto">
        <table className="w-full table-auto border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Produit</th>
              <th className="px-4 py-2">Variante</th>
              <th className="px-4 py-2">Qté</th>
              <th className="px-4 py-2">Prix unitaire</th>
              <th className="px-4 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {ventes.map((vente) =>
              vente.items.map((item, idx) => (
                <tr key={`${item.variantId}-${idx}`} className="border-t border-gray-200">
                  <td className="px-4 py-2">{new Date(vente.date).toLocaleString()}</td>
                  <td className="px-4 py-2">{item.productName}</td>
                  <td className="px-4 py-2">{item.variantName}</td>
                  <td className="px-4 py-2">{item.quantity}</td>
                  <td className="px-4 py-2">{item.price.toLocaleString()}</td>
                  <td className="px-4 py-2">{item.total.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="p-2 border rounded disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span>
          Page {page} / {pages}
        </span>
        <button
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="p-2 border rounded disabled:opacity-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const ReportsPage = () => {
  const [stats, setStats] = useState({ today: 0, month: 0, year: 0 });
  const [topProducts, setTopProducts] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchStats = async () => {
    const data = await getStatistiquesVentes("jour");
    if (data.success) {
      const global = data.data.global || {};
      setStats({
        today: global.montantTotal || 0,
        month: global.montantTotal || 0,
        year: global.montantTotal || 0,
      });
      setTopProducts(data.data.topProduits || []);
    }
  };

  const fetchVentes = async (p = 1) => {
    const data = await getHistoriqueVentes({ limit: 10, page: p });
    if (data.success) {
      setVentes(data.data.ventes);
      setPage(data.data.pagination.page);
      setPages(data.data.pagination.pages);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchVentes(page);
  }, [page]);

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
          <StatCard
            title="Aujourd'hui"
            value={stats.today}
            icon={<Calendar />}
            color={{ border: "border-blue-500", bg: "bg-blue-50", text: "text-blue-600", icon: "text-blue-600" }}
          />
          <StatCard
            title="Ce mois"
            value={stats.month}
            icon={<Calendar />}
            color={{ border: "border-gray-200", bg: "bg-gray-50", text: "text-gray-800", icon: "text-gray-600" }}
          />
          <StatCard
            title="Cette année"
            value={stats.year}
            icon={<Calendar />}
            color={{ border: "border-gray-200", bg: "bg-gray-50", text: "text-gray-800", icon: "text-gray-600" }}
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Top produits</h2>
        <div className="space-y-3">
          {topProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>Aucune donnée disponible</p>
            </div>
          ) : (
            topProducts.map((product, i) => (
              <div key={product._id || i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{product.productName}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, product.quantiteVendue)}%` }}
                    ></div>
                  </div>
                </div>
                <p className="font-bold text-gray-600">{product.quantiteVendue} Qté vendu</p>
              </div>
            ))
          )}
        </div>
      </div>

      <VenteList ventes={ventes} page={page} pages={pages} onPageChange={fetchVentes} />
    </div>
  );
};

export default ReportsPage;
