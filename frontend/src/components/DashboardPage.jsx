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

  // Charger l'utilisateur et ses boutiques
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        console.log("👤 Utilisateur chargé:", currentUser);
        
        if (!currentUser) {
          console.warn("❌ Aucun utilisateur connecté");
          setLoading(false);
          return;
        }

        setUser(currentUser);

        if (currentUser.role === "admin") {
          // Admin : charger toutes les boutiques
          const boutiquesData = await getBoutiques();
          console.log("🏪 Boutiques chargées (admin):", boutiquesData);
          
          if (boutiquesData.success) {
            setBoutiques(boutiquesData.data || []);
          }
        } else if (currentUser.role === "employe" && currentUser.boutique) {
          // Employé : utiliser la boutique de l'utilisateur
          const maBoutique = {
            _id: currentUser.boutique.id,
            name: currentUser.boutique.name,
            description: currentUser.boutique.description
          };
          
          console.log("🏪 Ma boutique (employé):", maBoutique);
          
          setBoutiques([maBoutique]);
          setSelectedBoutique(maBoutique);
        }
      } catch (error) {
        console.error("🔥 Erreur loadUser:", error);
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  const fetchData = async () => {
    if (!user) {
      console.warn("⚠️ fetchData appelé sans utilisateur");
      return;
    }

    setLoading(true);
    
    try {
      // Déterminer l'ID de la boutique à filtrer
      let boutiqueId = null;
      
      if (user.role === "employe" && user.boutique) {
        // Employé : toujours filtrer par sa boutique
        boutiqueId = user.boutique.id;
      } else if (user.role === "admin" && selectedBoutique) {
        // Admin : filtrer par la boutique sélectionnée (si sélectionnée)
        boutiqueId = selectedBoutique._id;
      }

      console.log("📊 Chargement des données avec boutiqueId:", boutiqueId);

      // Charger les statistiques du jour
      const statsJourData = await getStatistiquesVentes("jour", boutiqueId);
      console.log("📈 Stats jour:", statsJourData);
      
      // Charger les statistiques du mois
      const statsMoisData = await getStatistiquesVentes("mois", boutiqueId);
      console.log("📈 Stats mois:", statsMoisData);

      if (statsJourData.success && statsMoisData.success) {
        const globalJour = statsJourData.data?.global || {};
        const globalMois = statsMoisData.data?.global || {};
        
        setStats({
          today: { 
            sales: globalJour.montantTotal || 0, 
            transactions: globalJour.totalVentes || 0 
          },
          month: { 
            sales: globalMois.montantTotal || 0, 
            transactions: globalMois.totalVentes || 0 
          }
        });
        
        setTopProduits(statsJourData.data?.topProduits || []);
      }

      // Charger l'historique des ventes
      const ventesData = await getHistoriqueVentes({ limit: 4, boutiqueId });
      console.log("🛒 Ventes récentes:", ventesData);
      
      if (ventesData.success) {
        const ventes = (ventesData.data?.ventes || []).map(v => ({
          id: v._id,
          date: new Date(v.date).toLocaleString('fr-FR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          }),
          items: (v.items || []).reduce((sum, i) => sum + (i.quantitySold || i.quantity || 0), 0),
          total: v.totalAmount || 0
        }));
        setSales(ventes);
      }

      // Charger les alertes stock
      const alertesData = await getAlertesStock(10, boutiqueId);
      console.log("⚠️ Alertes stock:", alertesData);
      
      if (alertesData.success) {
        setAlertes(alertesData.data || []);
      }

    } catch (error) {
      console.error("🔥 Erreur fetchData:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log("🔄 Déclenchement fetchData - user:", user.role, "boutique:", selectedBoutique?.name || "Toutes");
      fetchData();
    }
  }, [user, selectedBoutique]);

  if (loading && !user) {
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

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Tableau de bord</h1>
          {selectedBoutique && (
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <Store className="w-4 h-4" />
              {selectedBoutique.name}
              {user.role === "employe" && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Ma boutique
                </span>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Sélecteur de boutique (ADMIN uniquement) */}
          {user.role === "admin" && boutiques.length > 0 && (
            <div className="relative">
              <select
                value={selectedBoutique?._id || ""}
                onChange={(e) => {
                  const boutique = boutiques.find(b => b._id === e.target.value);
                  setSelectedBoutique(boutique || null);
                }}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-sm"
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
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* CARTES STATISTIQUES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ventes du jour */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm">Ventes du jour</p>
              <h3 className="text-3xl font-bold mt-2">
                {stats.today.sales.toLocaleString()} FCFA
              </h3>
              <p className="text-blue-100 text-sm mt-2">
                {stats.today.transactions} transaction{stats.today.transactions > 1 ? 's' : ''}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        {/* Ventes du mois */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-green-100 text-sm">Ventes du mois</p>
              <h3 className="text-3xl font-bold mt-2">
                {stats.month.sales.toLocaleString()} FCFA
              </h3>
              <p className="text-green-100 text-sm mt-2">
                {stats.month.transactions} transaction{stats.month.transactions > 1 ? 's' : ''}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-200" />
          </div>
        </div>

        {/* Quantité vendue */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-purple-100 text-sm">Quantité vendue</p>
              <h3 className="text-3xl font-bold mt-2">
                {topProduits.reduce((sum, p) => sum + (p.quantiteVendue || 0), 0)}
              </h3>
              <p className="text-purple-100 text-sm mt-2">
                {topProduits.length} produit{topProduits.length > 1 ? 's' : ''}
              </p>
            </div>
            <Package className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* GRILLE VENTES & ALERTES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventes récentes */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Ventes récentes</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {sales.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucune vente récente</p>
              </div>
            ) : (
              sales.map(sale => (
                <div 
                  key={sale.id} 
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="text-sm text-gray-500">
                      {sale.date}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {sale.items} article{sale.items > 1 ? 's' : ''}
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

        {/* Alertes Stock */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Alertes Stock</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {alertes.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucun produit en alerte</p>
              </div>
            ) : (
              alertes.map((a, idx) => (
                <div 
                  key={a.variantId || idx} 
                  className="flex items-center gap-3 p-3 bg-orange-50 border-l-4 border-orange-500 rounded hover:bg-orange-100 transition-colors"
                >
                  <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {a.produitName || a.productName || 'Produit'}
                      {a.variantName && ` - ${a.variantName}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      Stock: <span className="font-medium text-orange-600">{a.stock}</span>
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