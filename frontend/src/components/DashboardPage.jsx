import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import {
  TrendingUp, ShoppingCart, Package, AlertTriangle,
  RefreshCw, ChevronDown, Store, Clock,
  ArrowUpRight, ArrowDownRight, BarChart2, Receipt, Search,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { getStatistiquesVentes, getHistoriqueVentes, getAlertesStock, getBoutiques } from "../services/sale";
import { getCurrentUser } from "../services/auth";

// ─── Helpers (copiés depuis RapportsPage) ─────────────────────────────────────
const fmt = (n) =>
  typeof n === "number"
    ? n.toLocaleString("fr-FR", { maximumFractionDigits: 0 })
    : "0";

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── Custom Tooltip (identique) ───────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl">
      <p className="font-bold mb-1 text-slate-300">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name} : <span className="font-bold">{fmt(p.value)} FCFA</span>
        </p>
      ))}
    </div>
  );
};

// ─── KPI Card (identique) ─────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, trend, delay, accent }) {
  const accents = {
    emerald: { bg: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
    blue:    { bg: "bg-blue-500",    light: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-100" },
    amber:   { bg: "bg-amber-500",   light: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-100" },
    red:     { bg: "bg-red-500",     light: "bg-red-50",     text: "text-red-700",     border: "border-red-100" },
  };
  const c = accents[accent] ?? accents.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 200, damping: 22 }}
      className={`bg-white rounded-2xl border ${c.border} p-5 shadow-sm`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${c.light} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            trend >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}>
            {trend >= 0
              ? <ArrowUpRight className="w-3 h-3" />
              : <ArrowDownRight className="w-3 h-3" />
            }
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-slate-900 leading-none mb-1">{value}</p>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

// ─── Vente Row (identique) ────────────────────────────────────────────────────
function VenteRow({ vente, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Receipt className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-800">
              {fmt(vente.totalAmount)} FCFA
            </p>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              {fmtDate(vente.date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">
            {vente.items?.length ?? 0} article{(vente.items?.length ?? 0) > 1 ? "s" : ""}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-2">
              {vente.items?.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span className="text-slate-700 font-medium">{item.productName}</span>
                    <span className="text-slate-400 text-xs">
                      {item.quantitySold} {item.unitSold}
                    </span>
                  </div>
                  <span className="font-bold text-slate-800">{fmt(item.total)} FCFA</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Top Produits (identique) ─────────────────────────────────────────────────
function TopProduits({ data = [] }) {
  if (!data.length) return (
    <div className="text-center py-8 text-slate-400 text-sm">
      Aucune donnée disponible
    </div>
  );

  const max = Math.max(...data.map((d) => d.quantiteVendue));

  return (
    <div className="space-y-3">
      {data.slice(0, 8).map((p, i) => (
        <motion.div
          key={p._id}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
          className="flex items-center gap-3"
        >
          <span className="w-6 text-xs font-black text-slate-400 text-right flex-shrink-0">
            #{i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-slate-700 truncate">
                {p.productName}
              </span>
              <span className="text-xs font-bold text-slate-500 ml-2 flex-shrink-0">
                {fmt(p.quantiteVendue)}
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(p.quantiteVendue / max) * 100}%` }}
                transition={{ delay: i * 0.06 + 0.2, duration: 0.5 }}
                className={`h-full rounded-full ${
                  i === 0 ? "bg-indigo-500" :
                  i === 1 ? "bg-blue-400" :
                  i === 2 ? "bg-cyan-400" :
                  "bg-slate-300"
                }`}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Alerte Row (identique) ───────────────────────────────────────────────────
function AlerteRow({ produit, index }) {
  const pct = Math.min((produit.stock / 10) * 100, 100);
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-amber-100"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
        produit.stock === 0 ? "bg-red-100" : "bg-amber-100"
      }`}>
        <Package className={`w-4 h-4 ${produit.stock === 0 ? "text-red-600" : "text-amber-600"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate">{produit.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${produit.stock === 0 ? "bg-red-400" : "bg-amber-400"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`text-xs font-bold flex-shrink-0 ${
            produit.stock === 0 ? "text-red-600" : "text-amber-600"
          }`}>
            {produit.stock} {produit.unit}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton loader (identique) ──────────────────────────────────────────────
function Skeleton({ className }) {
  return <div className={`bg-slate-200 animate-pulse rounded-xl ${className}`} />;
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [boutiques, setBoutiques] = useState([]);
  const [selectedBoutique, setSelectedBoutique] = useState(null);
  const [stats, setStats] = useState({
    today: { sales: 0, transactions: 0, avgBasket: 0 },
    month: { sales: 0, transactions: 0, avgBasket: 0 }
  });
  const [topProduits, setTopProduits] = useState([]);
  const [ventes, setVentes] = useState([]);          // toutes les ventes récentes (pour graphique et historique)
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [searchVente, setSearchVente] = useState("");

  // Chargement initial (user + boutiques)
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          setLoading(false);
          return;
        }
        setUser(currentUser);

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
        console.error("Erreur chargement utilisateur:", error);
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // Détermine l'ID boutique à envoyer aux services (null = toutes)
  const determineBoutiqueIdForQuery = () => {
    if (!user) return null;
    if (user.role === "employe" && user.boutique) {
      return user.boutique.id || null;
    }
    if (user.role === "admin" && selectedBoutique) {
      return selectedBoutique._id || null;
    }
    return null;
  };

  // Fonction de rafraîchissement des données
  const fetchData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const boutiqueId = determineBoutiqueIdForQuery();

      // Stats du jour
      const statsJour = boutiqueId
        ? await getStatistiquesVentes("jour", boutiqueId)
        : await getStatistiquesVentes("jour");
      // Stats du mois
      const statsMois = boutiqueId
        ? await getStatistiquesVentes("mois", boutiqueId)
        : await getStatistiquesVentes("mois");

      if (statsJour?.success && statsMois?.success) {
        const globalJour = statsJour.data?.global || {};
        const globalMois = statsMois.data?.global || {};

        setStats({
          today: {
            sales: Number(globalJour.montantTotal || 0),
            transactions: Number(globalJour.totalVentes || 0),
            avgBasket: Number(globalJour.moyennePanier || 0)
          },
          month: {
            sales: Number(globalMois.montantTotal || 0),
            transactions: Number(globalMois.totalVentes || 0),
            avgBasket: Number(globalMois.moyennePanier || 0)
          }
        });
        setTopProduits(statsJour.data?.topProduits || []);
      }

      // Historique des ventes (pour le graphique et la liste)
      const historique = boutiqueId
        ? await getHistoriqueVentes({ limit: 50, boutiqueId })
        : await getHistoriqueVentes({ limit: 50 });
      if (historique?.success) {
        // On garde la structure brute pour VenteRow (qui attend items, date, totalAmount)
        setVentes(historique.data?.ventes || []);
      }

      // Alertes stock
      const alertesData = boutiqueId
        ? await getAlertesStock(10, boutiqueId)
        : await getAlertesStock(10);
      if (alertesData?.success) {
        setAlertes(alertesData.data || []);
      }

    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoadingData(false);
    }
  };

  // Recharger quand l'utilisateur ou la boutique change
  useEffect(() => {
    if (user && !loading) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedBoutique, loading]);

  // Données pour le graphique d'évolution (par jour)
  const chartData = useMemo(() => {
    const map = {};
    ventes.forEach((v) => {
      const d = new Date(v.date);
      const key = `${d.getDate()}/${d.getMonth() + 1}`;
      map[key] = (map[key] || 0) + v.totalAmount;
    });
    return Object.entries(map)
      .map(([label, montant]) => ({ label, montant }))
      .slice(-7); // 7 derniers jours
  }, [ventes]);

  // Filtrer les ventes pour la recherche
  const filteredVentes = useMemo(() => {
    if (!searchVente) return ventes;
    return ventes.filter((v) =>
      v.items?.some((i) =>
        i.productName?.toLowerCase().includes(searchVente.toLowerCase())
      )
    );
  }, [ventes, searchVente]);

  // Affichage du chargement initial
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] p-6 flex items-center justify-center">
        <p className="text-slate-500">Utilisateur non connecté</p>
      </div>
    );
  }

  const lastUpdate = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-[#f5f6fa] p-3 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-5">

          {/* ── HEADER ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Tableau de bord
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Mis à jour à {lastUpdate}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Sélecteur boutique (admin uniquement) */}
              {user.role === "admin" && (
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={selectedBoutique?._id || ""}
                    onChange={(e) => {
                      const boutique = e.target.value
                        ? boutiques.find(b => b._id === e.target.value)
                        : null;
                      setSelectedBoutique(boutique);
                    }}
                    className="appearance-none pl-9 pr-8 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20 text-slate-700 font-medium shadow-sm"
                  >
                    <option value="">Toutes les boutiques</option>
                    {boutiques.map((b) => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              )}

              {/* Bouton actualiser */}
              <button
                onClick={fetchData}
                disabled={loadingData}
                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 shadow-sm transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* ── KPI CARDS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {loadingData ? (
              Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28" />)
            ) : (
              <>
                <KpiCard
                  label="Ventes du jour"
                  value={`${fmt(stats.today.sales)} FCFA`}
                  sub={`${stats.today.transactions} transaction${stats.today.transactions > 1 ? 's' : ''}`}
                  icon={TrendingUp}
                  accent="emerald"
                  delay={0.05}
                />
                <KpiCard
                  label="Ventes du mois"
                  value={`${fmt(stats.month.sales)} FCFA`}
                  sub={`${stats.month.transactions} transaction${stats.month.transactions > 1 ? 's' : ''}`}
                  icon={ShoppingCart}
                  accent="blue"
                  delay={0.1}
                />
                <KpiCard
                  label="Panier moyen (jour)"
                  value={`${fmt(stats.today.avgBasket)} FCFA`}
                  icon={BarChart2}
                  accent="amber"
                  delay={0.15}
                />
                <KpiCard
                  label="Alertes stock"
                  value={alertes.length}
                  sub="produits à réappro."
                  icon={AlertTriangle}
                  accent={alertes.length > 0 ? "red" : "emerald"}
                  delay={0.2}
                />
              </>
            )}
          </div>

          {/* ── GRAPHIQUE ÉVOLUTION (7 derniers jours) ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-black text-slate-900">Évolution des ventes</h2>
                <p className="text-xs text-slate-400 mt-0.5">7 derniers jours</p>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
                Aucune donnée pour cette période
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMontant" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    width={36}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="montant"
                    name="Montant"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#colorMontant)"
                    dot={false}
                    activeDot={{ r: 5, fill: "#6366f1" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── 2 COLONNES : Top produits + Alertes stock ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Top produits */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <BarChart2 className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-sm">Top produits vendus</h2>
                  <p className="text-xs text-slate-400">Aujourd'hui</p>
                </div>
              </div>
              {loadingData ? (
                <div className="space-y-3">
                  {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-8" />)}
                </div>
              ) : (
                <TopProduits data={topProduits} />
              )}
            </div>

            {/* Alertes stock */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 text-sm">Alertes stock</h2>
                    <p className="text-xs text-slate-400">Seuil &lt; 10 unités</p>
                  </div>
                </div>
                {alertes.length > 0 && (
                  <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full">
                    {alertes.length} produit{alertes.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {loadingData ? (
                <div className="space-y-2">
                  {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14" />)}
                </div>
              ) : alertes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Package className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Stocks OK</p>
                  <p className="text-xs text-slate-400">Tous les produits sont bien approvisionnés</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {alertes.map((p, i) => (
                    <AlerteRow key={p._id} produit={p} index={i} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── HISTORIQUE DES VENTES ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-sm">Historique des ventes</h2>
                  <p className="text-xs text-slate-400">
                    {filteredVentes.length} transaction{filteredVentes.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Rechercher un produit…"
                  value={searchVente}
                  onChange={(e) => setSearchVente(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20 w-full sm:w-52 placeholder-slate-400 text-slate-700"
                />
              </div>
            </div>

            {loadingData ? (
              <div className="space-y-2">
                {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : filteredVentes.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-600">Aucune vente</p>
                <p className="text-xs text-slate-400">
                  {searchVente ? "Aucun résultat pour cette recherche" : "Aucune vente enregistrée"}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                <AnimatePresence>
                  {filteredVentes.map((vente, i) => (
                    <VenteRow key={vente._id} vente={vente} index={i} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default DashboardPage;