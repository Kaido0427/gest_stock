import React, { useEffect, useState } from "react";
import { Download, Calendar, ChevronLeft, ChevronRight, Store, ChevronDown, TrendingUp, Package, DollarSign } from "lucide-react";
import { getHistoriqueVentes, getStatistiquesVentes, getBoutiques } from "../services/sale";
import { getCurrentUser } from "../services/auth";

const StatCard = ({ title, value, subtitle, icon, color }) => (
  <div className={`p-6 rounded-xl shadow-lg ${color.bg} border-2 ${color.border}`}>
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <p className={`text-sm font-medium ${color.textLight}`}>{title}</p>
        <h3 className={`text-3xl font-bold mt-2 ${color.text}`}>
          {value.toLocaleString()} <span className="text-xl">FCFA</span>
        </h3>
        {subtitle && (
          <p className={`text-sm mt-2 ${color.textLight}`}>{subtitle}</p>
        )}
      </div>
      <div className={`p-3 ${color.iconBg} rounded-lg`}>
        {React.cloneElement(icon, { className: `w-8 h-8 ${color.icon}` })}
      </div>
    </div>
  </div>
);

const VenteList = ({ ventes, page, pages, onPageChange }) => {
  if (!ventes || ventes.length === 0)
    return (
      <div className="text-center py-12 text-gray-400">
        <Package className="w-16 h-16 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Aucune vente disponible</p>
        <p className="text-sm mt-1">Les ventes apparaîtront ici</p>
      </div>
    );

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Historique des ventes</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Produit</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Qté vendue</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Unité</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Prix unitaire</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ventes.map((vente) =>
              vente.items.map((item, idx) => (
                <tr key={`${vente._id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(vente.date).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.productName}</div>
                    {item.unitSold !== item.unitBase && (
                      <div className="text-xs text-gray-500 mt-1">
                        Converti: {item.quantityDeducted} {item.unitBase}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {item.quantitySold}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {item.unitSold}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-green-700 font-medium">
                    {item.unitPrice.toLocaleString()} FCFA
                  </td>
                  <td className="px-4 py-3 font-bold text-green-700">
                    {item.total.toLocaleString()} FCFA
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="p-2 border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className="text-sm font-medium text-gray-700">
          Page <span className="font-bold">{page}</span> sur <span className="font-bold">{pages}</span>
        </span>
        <button
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="p-2 border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
};

const ReportsPage = () => {
  const [user, setUser] = useState(null);
  const [boutiques, setBoutiques] = useState([]);
  const [selectedBoutique, setSelectedBoutique] = useState(null);
  const [stats, setStats] = useState({
    today: { montant: 0, transactions: 0 },
    month: { montant: 0, transactions: 0 },
    year: { montant: 0, transactions: 0 }
  });
  const [topProducts, setTopProducts] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Charger l'utilisateur et les boutiques
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          setLoading(false);
          return;
        }

        setUser(currentUser);

        // Charger les boutiques
        const boutiquesData = await getBoutiques();

        let boutiquesArray = [];
        if (Array.isArray(boutiquesData)) {
          boutiquesArray = boutiquesData;
        } else if (boutiquesData?.success && boutiquesData?.data) {
          boutiquesArray = boutiquesData.data;
        } else if (boutiquesData?.data && Array.isArray(boutiquesData.data)) {
          boutiquesArray = boutiquesData.data;
        }

        if (boutiquesArray.length > 0) {
          if (currentUser.role === "admin") {
            setBoutiques(boutiquesArray);
          } else if (currentUser.role === "employe" && currentUser.boutique) {
            const maBoutique = boutiquesArray.find(b => b._id === currentUser.boutique.id);
            if (maBoutique) {
              setBoutiques([maBoutique]);
              setSelectedBoutique(maBoutique);
            }
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loadUser:", error);
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const fetchStats = async () => {
    setLoadingData(true);

    try {
      // Déterminer l'ID de la boutique à filtrer
      let boutiqueId = null;
      if (user?.role === "employe" && user.boutique) {
        boutiqueId = user.boutique.id;
      } else if (user?.role === "admin" && selectedBoutique) {
        boutiqueId = selectedBoutique._id;
      }

      // Stats du jour
      const statsJourData = await getStatistiquesVentes("jour", boutiqueId);
      // Stats du mois
      const statsMoisData = await getStatistiquesVentes("mois", boutiqueId);
      // Stats de l'année
      const statsAnneeData = await getStatistiquesVentes("annee", boutiqueId);

      if (statsJourData?.success) {
        const globalJour = statsJourData.data?.global || {};
        const globalMois = statsMoisData?.data?.global || {};
        const globalAnnee = statsAnneeData?.data?.global || {};

        setStats({
          today: {
            montant: globalJour.montantTotal || 0,
            transactions: globalJour.totalVentes || 0
          },
          month: {
            montant: globalMois.montantTotal || 0,
            transactions: globalMois.totalVentes || 0
          },
          year: {
            montant: globalAnnee.montantTotal || 0,
            transactions: globalAnnee.totalVentes || 0
          }
        });

        setTopProducts(statsJourData.data?.topProduits || []);
      }
    } catch (error) {
      console.error("Error fetchStats:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchVentes = async (p = 1) => {
    setLoadingData(true);

    try {
      let boutiqueId = null;
      if (user?.role === "employe" && user.boutique) {
        boutiqueId = user.boutique.id;
      } else if (user?.role === "admin" && selectedBoutique) {
        boutiqueId = selectedBoutique._id;
      }

      const data = await getHistoriqueVentes({ limit: 10, page: p, boutiqueId });

      if (data?.success) {
        setVentes(data.data.ventes || []);
        setPage(data.data.pagination?.page || 1);
        setPages(data.data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error("Error fetchVentes:", error);
    } finally {
      setLoadingData(false);
    }
  };

  // Charger les données quand user ou selectedBoutique change
  useEffect(() => {
    if (user && !loading) {
      fetchStats();
      fetchVentes(1);
    }
  }, [user, selectedBoutique, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleExportPDF = () => {
    alert("Fonctionnalité d'export PDF à venir");
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Rapports de ventes</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <Store className="w-4 h-4" />
            {selectedBoutique ? selectedBoutique.name : user?.role === "admin" && "Toutes les boutiques"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sélecteur de boutique (ADMIN uniquement) */}
          {user?.role === "admin" && (
            <div className="relative min-w-[200px]">
              <select
                value={selectedBoutique?._id || ""}
                onChange={(e) => {
                  const boutique = e.target.value
                    ? boutiques.find(b => b._id === e.target.value)
                    : null;
                  setSelectedBoutique(boutique);
                  setPage(1);
                }}
                className="appearance-none w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer text-sm font-medium transition-all hover:border-gray-400"
              >
                <option value="">📊 Toutes les boutiques</option>
                {boutiques.map(b => (
                  <option key={b._id} value={b._id}>
                    🏪 {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Exporter PDF
          </button>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Ventes du jour"
          value={stats.today.montant}
          subtitle={`${stats.today.transactions} transaction${stats.today.transactions !== 1 ? 's' : ''}`}
          icon={<Calendar />}
          color={{
            bg: "bg-gradient-to-br from-blue-500 to-blue-600",
            border: "border-blue-600",
            text: "text-white",
            textLight: "text-blue-100",
            icon: "text-white",
            iconBg: "bg-white/20"
          }}
        />
        <StatCard
          title="Ventes du mois"
          value={stats.month.montant}
          subtitle={`${stats.month.transactions} transaction${stats.month.transactions !== 1 ? 's' : ''}`}
          icon={<TrendingUp />}
          color={{
            bg: "bg-gradient-to-br from-green-500 to-green-600",
            border: "border-green-600",
            text: "text-white",
            textLight: "text-green-100",
            icon: "text-white",
            iconBg: "bg-white/20"
          }}
        />
        <StatCard
          title="Ventes de l'année"
          value={stats.year.montant}
          subtitle={`${stats.year.transactions} transaction${stats.year.transactions !== 1 ? 's' : ''}`}
          icon={<DollarSign />}
          color={{
            bg: "bg-gradient-to-br from-purple-500 to-purple-600",
            border: "border-purple-600",
            text: "text-white",
            textLight: "text-purple-100",
            icon: "text-white",
            iconBg: "bg-white/20"
          }}
        />
      </div>

      {/* TOP PRODUITS */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          Top produits vendus
        </h2>
        <div className="space-y-4">
          {topProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aucune donnée disponible</p>
              <p className="text-sm mt-1">Les produits les plus vendus apparaîtront ici</p>
            </div>
          ) : (
            topProducts.map((product, i) => (
              <div key={product._id || i} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-lg">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{product.productName}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (product.quantiteVendue / Math.max(...topProducts.map(p => p.quantiteVendue))) * 100)}%`
                        }}
                      ></div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">
                        {product.quantiteVendue} {product.uniteBase || ''}
                      </div>
                      <div className="text-xs text-gray-500">vendus</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Valeur: <span className="font-semibold text-green-600">
                      {product.montantTotal?.toLocaleString() || 0} FCFA
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* HISTORIQUE DES VENTES */}
      {loadingData ? (
        <div className="bg-white p-12 rounded-xl shadow text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Chargement des données...</p>
        </div>
      ) : (
        <VenteList ventes={ventes} page={page} pages={pages} onPageChange={fetchVentes} />
      )}
    </div>
  );
};

export default ReportsPage;