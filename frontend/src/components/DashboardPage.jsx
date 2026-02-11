import React, { useEffect, useState } from "react";
import { RefreshCw, DollarSign, TrendingUp, Package, AlertTriangle, Store, ChevronDown, ShoppingCart } from "lucide-react";
import { getStatistiquesVentes, getHistoriqueVentes, getAlertesStock, getBoutiques } from "../services/sale";
import { getCurrentUser } from "../services/auth";

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [boutiques, setBoutiques] = useState([]);
  const [selectedBoutique, setSelectedBoutique] = useState(null);
  const [stats, setStats] = useState({
    today: { sales: 0, transactions: 0 },
    month: { sales: 0, transactions: 0 }
  });
  const [sales, setSales] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [topProduits, setTopProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Chargement des boutiques + user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        console.log("👤 User loaded:", currentUser);

        if (!currentUser) {
          setLoading(false);
          return;
        }

        setUser(currentUser);

        // Charger les boutiques
        console.log("🏪 Loading boutiques...");
        const boutiquesData = await getBoutiques();
        console.log("🏪 Boutiques response:", boutiquesData);

        let boutiquesArray = [];
        if (Array.isArray(boutiquesData)) {
          boutiquesArray = boutiquesData;
        } else if (boutiquesData?.success && boutiquesData?.data) {
          boutiquesArray = boutiquesData.data;
        } else if (boutiquesData?.data && Array.isArray(boutiquesData.data)) {
          boutiquesArray = boutiquesData.data;
        }

        console.log(`✅ ${boutiquesArray.length} boutique(s) loaded`);

        if (boutiquesArray.length > 0) {
          if (currentUser.role === "admin") {
            setBoutiques(boutiquesArray);
          } else if (currentUser.role === "employe" && currentUser.boutique) {
            const maBoutique = boutiquesArray.find(b => b._id === currentUser.boutique.id);
            if (maBoutique) {
              setBoutiques([maBoutique]);
              setSelectedBoutique(maBoutique);
            } else {
              console.warn("⚠️ Employee's boutique not found in list");
            }
          }
        } else {
          console.warn("⚠️ No boutiques found");
        }

        setLoading(false);
      } catch (error) {
        console.error("🔥 Error loadUser:", error);
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Helper : build boutiqueId only if present
  const determineBoutiqueIdForQuery = () => {
    if (!user) return null;
    if (user.role === "employe" && user.boutique) {
      return user.boutique.id || null;
    }
    if (user.role === "admin" && selectedBoutique) {
      return selectedBoutique._id || null;
    }
    return null; // admin + no selectedBoutique => all boutiques
  };

  const fetchData = async () => {
    if (!user) {
      console.warn("⚠️ fetchData called without user");
      return;
    }

    setLoadingData(true);

    try {
      const boutiqueId = determineBoutiqueIdForQuery();
      console.log("📊 Fetching data with boutiqueId:", boutiqueId);

      // ⚠️ IMPORTANT: n'envoyer boutiqueId aux services QUE s'il existe
      const statsJourData = boutiqueId
        ? await getStatistiquesVentes("jour", boutiqueId)
        : await getStatistiquesVentes("jour");

      const statsMoisData = boutiqueId
        ? await getStatistiquesVentes("mois", boutiqueId)
        : await getStatistiquesVentes("mois");

      console.log("📈 Stats jour:", statsJourData);
      console.log("📈 Stats mois:", statsMoisData);

      if (statsJourData?.success && statsMoisData?.success) {
        const globalJour = statsJourData.data?.global || {};
        const globalMois = statsMoisData.data?.global || {};

        const newStats = {
          today: {
            sales: Number(globalJour.montantTotal || 0),
            transactions: Number(globalJour.totalVentes || 0)
          },
          month: {
            sales: Number(globalMois.montantTotal || 0),
            transactions: Number(globalMois.totalVentes || 0)
          }
        };

        console.log("📊 Setting stats:", newStats);
        setStats(newStats);
        setTopProduits(Array.isArray(statsJourData.data?.topProduits) ? statsJourData.data.topProduits : []);
      } else {
        // fallback pour éviter affichage undefined
        setStats({
          today: { sales: 0, transactions: 0 },
          month: { sales: 0, transactions: 0 }
        });
        setTopProduits([]);
      }

      // Historique ventes (ne passer boutiqueId que si défini)
      const ventesData = boutiqueId
        ? await getHistoriqueVentes({ limit: 4, boutiqueId })
        : await getHistoriqueVentes({ limit: 4 });
      console.log("🛒 Ventes récentes:", ventesData);

      if (ventesData?.success) {
        const ventes = (ventesData.data?.ventes || []).map(v => ({
          id: v._id,
          date: new Date(v.date).toLocaleString('fr-FR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          }),
          items: (v.items || []).reduce((sum, i) => sum + (i.quantitySold || i.quantity || 0), 0),
          total: Number(v.totalAmount || v.total || 0)
        }));
        console.log("✅ Ventes processed:", ventes);
        setSales(ventes);
      } else {
        setSales([]);
      }

      // Alertes stock (ne passer boutiqueId que si défini)
      const alertesData = boutiqueId
        ? await getAlertesStock(10, boutiqueId)
        : await getAlertesStock(10);
      console.log("⚠️ Alertes stock:", alertesData);

      if (alertesData?.success) {
        setAlertes(alertesData.data || []);
      } else {
        setAlertes([]);
      }

    } catch (error) {
      console.error("🔥 Error fetchData:", error);
    } finally {
      setLoadingData(false);
    }
  };

  // Re-fetch quand user / selectedBoutique / loading changent
  useEffect(() => {
    if (user && !loading) {
      console.log("🔄 Trigger fetchData - user:", user.role, "boutique:", selectedBoutique?.name || "All");
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedBoutique, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Utilisateur non connecté</p>
      </div>
    );
  }

  // calculs d'affichage sûrs
  const todaySalesDisplay = Number(stats.today.sales || 0);
  const todayTransDisplay = Number(stats.today.transactions || 0);
  const monthSalesDisplay = Number(stats.month.sales || 0);
  const monthTransDisplay = Number(stats.month.transactions || 0);
  const quantiteVendueTotal = topProduits.reduce((sum, p) => sum + Number(p.quantiteVendue || 0), 0);
  const produitsCount = topProduits.length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <Store className="w-4 h-4" />
            {selectedBoutique ? (
              <>
                {selectedBoutique.name}
                {user.role === "employe" && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Ma boutique
                  </span>
                )}
              </>
            ) : (
              user.role === "admin" && "Toutes les boutiques"
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sélecteur de boutique (ADMIN uniquement) */}
          {user.role === "admin" && (
            <div className="relative min-w-[200px]">
              <select
                value={selectedBoutique?._id || ""}
                onChange={(e) => {
                  console.log("🔄 Boutique selection changed:", e.target.value);
                  const boutique = e.target.value
                    ? boutiques.find(b => b._id === e.target.value)
                    : null;
                  setSelectedBoutique(boutique);
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

          {/* Bouton actualiser */}
          <button
            onClick={fetchData}
            disabled={loadingData}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* CARTES STATISTIQUES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ventes du jour */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-blue-100 text-sm font-medium">Ventes du jour</p>
              <h3 className="text-3xl font-bold mt-2">
                {todaySalesDisplay.toLocaleString()} <span className="text-xl">FCFA</span>
              </h3>
              <p className="text-blue-100 text-sm mt-2">
                {todayTransDisplay} transaction{todayTransDisplay !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <DollarSign className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Ventes du mois */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-green-100 text-sm font-medium">Ventes du mois</p>
              <h3 className="text-3xl font-bold mt-2">
                {monthSalesDisplay.toLocaleString()} <span className="text-xl">FCFA</span>
              </h3>
              <p className="text-green-100 text-sm mt-2">
                {monthTransDisplay} transaction{monthTransDisplay !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Quantité vendue */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-purple-100 text-sm font-medium">Quantité vendue</p>
              <h3 className="text-3xl font-bold mt-2">
                {quantiteVendueTotal.toLocaleString()}
              </h3>
              <p className="text-purple-100 text-sm mt-2">
                {produitsCount} produit{produitsCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <Package className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* GRILLE VENTES & ALERTES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventes récentes */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            Ventes récentes
          </h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {sales.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Aucune vente récente</p>
                <p className="text-sm mt-1">Les ventes apparaîtront ici</p>
              </div>
            ) : (
              sales.map(sale => (
                <div
                  key={sale.id}
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg hover:shadow-md transition-all"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {sale.date}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {sale.items} article{sale.items !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="font-bold text-lg text-green-600">
                    {sale.total.toLocaleString()} <span className="text-sm">FCFA</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alertes Stock */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Alertes Stock
          </h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {alertes.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Package className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Aucune alerte stock</p>
                <p className="text-sm mt-1">Tous les produits sont bien approvisionnés</p>
              </div>
            ) : (
              alertes.map((a, idx) => (
                <div
                  key={a.produitId || idx}
                  className="flex items-center gap-3 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {a.produitName || a.productName || 'Produit'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Stock: <span className="font-bold text-orange-600">{a.stock} {a.unit}</span>
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
