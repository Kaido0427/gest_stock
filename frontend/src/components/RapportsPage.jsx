import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    TrendingUp, ShoppingCart, Package, AlertTriangle,
    RefreshCw, ChevronDown, Store, Calendar,
    ArrowUpRight, ArrowDownRight, BarChart2,
    Clock, Receipt, Search,
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useBoutiques } from "../hooks/useBoutiques";
import { useStatistiquesVentes, useHistoriqueVentes } from "../hooks/useSales";
import { useAlertesStock } from "../hooks/useProducts";
import { Toast, useToast } from "../components/ui/Toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => (typeof n === "number" ? n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) : "0");
const fmtDate = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const PERIODS = [
    { key: "jour", label: "Aujourd'hui" },
    { key: "mois", label: "Ce mois" },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl">
            <p className="font-bold mb-1 text-slate-300">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }}>{p.name} : <span className="font-bold">{fmt(p.value)} FCFA</span></p>
            ))}
        </div>
    );
};

function KpiCard({ label, value, sub, icon: Icon, trend, delay, accent }) {
    const accents = {
        emerald: { light: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
        blue: { light: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
        amber: { light: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
        red: { light: "bg-red-50", text: "text-red-700", border: "border-red-100" },
    };
    const c = accents[accent] ?? accents.blue;
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: "spring", stiffness: 200, damping: 22 }}
            className={`bg-white rounded-2xl border ${c.border} p-5 shadow-sm`}>
            <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${c.light} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${c.text}`} />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                        {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
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

function VenteRow({ vente, index }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Receipt className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-bold text-slate-800">{fmt(vente.totalAmount)} FCFA</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />{fmtDate(vente.date)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">
                        {vente.items?.length ?? 0} article{(vente.items?.length ?? 0) > 1 ? "s" : ""}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </div>
            </button>
            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-2">
                            {vente.items?.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                        <span className="text-slate-700 font-medium">{item.productName}</span>
                                        <span className="text-slate-400 text-xs">{item.quantitySold} {item.unitSold}</span>
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

function TopProduits({ data = [] }) {
    if (!data.length) return <div className="text-center py-8 text-slate-400 text-sm">Aucune donnée disponible</div>;
    const max = Math.max(...data.map((d) => d.quantiteVendue));
    return (
        <div className="space-y-3">
            {data.slice(0, 8).map((p, i) => (
                <motion.div key={p._id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }} className="flex items-center gap-3">
                    <span className="w-6 text-xs font-black text-slate-400 text-right flex-shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-slate-700 truncate">{p.productName}</span>
                            <span className="text-xs font-bold text-slate-500 ml-2 flex-shrink-0">{fmt(p.quantiteVendue)}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(p.quantiteVendue / max) * 100}%` }}
                                transition={{ delay: i * 0.06 + 0.2, duration: 0.5 }}
                                className={`h-full rounded-full ${i === 0 ? "bg-indigo-500" : i === 1 ? "bg-blue-400" : i === 2 ? "bg-cyan-400" : "bg-slate-300"}`} />
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

function AlerteRow({ produit, index }) {
    const pct = Math.min((produit.stock / 10) * 100, 100);
    return (
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-amber-100">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${produit.stock === 0 ? "bg-red-100" : "bg-amber-100"}`}>
                <Package className={`w-4 h-4 ${produit.stock === 0 ? "text-red-600" : "text-amber-600"}`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{produit.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${produit.stock === 0 ? "bg-red-400" : "bg-amber-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={`text-xs font-bold flex-shrink-0 ${produit.stock === 0 ? "text-red-600" : "text-amber-600"}`}>
                        {produit.stock} {produit.unit}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

const Skeleton = ({ className }) => <div className={`bg-slate-200 animate-pulse rounded-xl ${className}`} />;

// ─── Main ──────────────────────────────────────────────────────────────────────
const RapportsPage = () => {
    const toast = useToast();
    const [periode, setPeriode] = useState("jour");
    const [selectedBoutique, setSelectedBoutique] = useState("");
    const [searchVente, setSearchVente] = useState("");

    const { data: boutiquesData } = useBoutiques();
    const boutiques = boutiquesData?.boutiques ?? boutiquesData ?? [];

    const {
        data: stats,
        isLoading: loadingStats,
        refetch: refetchStats,
        dataUpdatedAt,
    } = useStatistiquesVentes({
        periode,
        boutique_id: selectedBoutique || undefined,
    });

    const {
        data: historiqueData,
        isLoading: loadingHistorique,
        refetch: refetchHistorique,
    } = useHistoriqueVentes({
        limit: 50,
        boutique_id: selectedBoutique || undefined,
    });

    const {
        data: alertesData,
        isLoading: loadingAlertes,
        refetch: refetchAlertes,
    } = useAlertesStock({
        seuil: 10,
        boutique_id: selectedBoutique || undefined,
    });

    const refetchAll = () => { refetchStats(); refetchHistorique(); refetchAlertes(); };

    // ─── Extraction des données (le backend wrappe dans .data) ───────────────
    const statsGlobal = stats?.data?.global ?? {};
    const topProduits = stats?.data?.topProduits ?? [];
    const ventes = historiqueData?.data?.ventes ?? [];
    const alertes = Array.isArray(alertesData?.data) ? alertesData.data : (alertesData?.data?.produits ?? []);

    const filteredVentes = useMemo(() => {
        if (!searchVente) return ventes;
        return ventes.filter((v) =>
            v.items?.some((i) => i.productName?.toLowerCase().includes(searchVente.toLowerCase()))
        );
    }, [ventes, searchVente]);

    const chartData = useMemo(() => {
        const map = {};
        ventes.forEach((v) => {
            const d = new Date(v.date);
            const key = periode === "jour"
                ? `${d.getHours()}h`
                : `${d.getDate()}/${d.getMonth() + 1}`;
            map[key] = (map[key] || 0) + v.totalAmount;
        });
        return Object.entries(map).map(([label, montant]) => ({ label, montant })).slice(-12);
    }, [ventes, periode]);

    const lastUpdate = dataUpdatedAt
        ? new Date(dataUpdatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        : null;

    return (
        <div className="min-h-screen bg-[#f5f6fa] p-3 sm:p-6">
            <Toast toasts={toast.toasts} onRemove={toast.remove} />
            <div className="max-w-7xl mx-auto space-y-5">

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Rapports</h1>
                        {lastUpdate && (
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Mis à jour à {lastUpdate}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Filtre boutique */}
                        <div className="relative">
                            <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <select value={selectedBoutique} onChange={(e) => setSelectedBoutique(e.target.value)}
                                className="appearance-none pl-9 pr-8 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20 text-slate-700 font-medium shadow-sm">
                                <option value="">Toutes les boutiques</option>
                                {boutiques.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Sélecteur période */}
                        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            {PERIODS.map((p) => (
                                <button key={p.key} onClick={() => setPeriode(p.key)}
                                    className={`px-3 py-2.5 text-sm font-semibold transition-colors ${periode === p.key ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700"
                                        }`}>
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        <button onClick={refetchAll}
                            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 shadow-sm transition-colors">
                            <RefreshCw className={`w-4 h-4 ${loadingStats ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {loadingStats ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28" />) : (
                        <>
                            <KpiCard label="Chiffre d'affaires" value={`${fmt(statsGlobal.montantTotal)} FCFA`}
                                sub={`Moy. ${fmt(statsGlobal.moyennePanier)} FCFA/vente`} icon={TrendingUp} accent="emerald" delay={0.05} />
                            <KpiCard label="Ventes" value={fmt(statsGlobal.totalVentes)} sub="transactions"
                                icon={ShoppingCart} accent="blue" delay={0.1} />
                            <KpiCard label="Panier moyen" value={`${fmt(statsGlobal.moyennePanier)} FCFA`}
                                icon={BarChart2} accent="amber" delay={0.15} />
                            <KpiCard label="Alertes stock" value={alertes.length} sub="produits à réappro."
                                icon={AlertTriangle} accent={alertes.length > 0 ? "red" : "emerald"} delay={0.2} />
                        </>
                    )}
                </div>

                {/* Graphique */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="mb-5">
                        <h2 className="font-black text-slate-900">Évolution des ventes</h2>
                        <p className="text-xs text-slate-400 mt-0.5">{periode === "jour" ? "Par heure" : "Par jour"}</p>
                    </div>
                    {chartData.length === 0 ? (
                        <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Aucune donnée pour cette période</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMontantR" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={36} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="montant" name="Montant" stroke="#6366f1"
                                    strokeWidth={2.5} fill="url(#colorMontantR)" dot={false} activeDot={{ r: 5, fill: "#6366f1" }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Top produits + Alertes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                                <BarChart2 className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="font-black text-slate-900 text-sm">Top produits vendus</h2>
                                <p className="text-xs text-slate-400">Par quantité</p>
                            </div>
                        </div>
                        {loadingStats
                            ? <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
                            : <TopProduits data={topProduits} />
                        }
                    </div>

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
                        {loadingAlertes ? (
                            <div className="space-y-2">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
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
                                {alertes.map((p, i) => <AlerteRow key={p._id} produit={p} index={i} />)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Historique ventes */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
                                <Receipt className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                                <h2 className="font-black text-slate-900 text-sm">Historique des ventes</h2>
                                <p className="text-xs text-slate-400">{filteredVentes.length} transaction{filteredVentes.length > 1 ? "s" : ""}</p>
                            </div>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <input type="text" placeholder="Rechercher un produit…" value={searchVente}
                                onChange={(e) => setSearchVente(e.target.value)}
                                className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20 w-full sm:w-52 placeholder-slate-400 text-slate-700" />
                        </div>
                    </div>
                    {loadingHistorique ? (
                        <div className="space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
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
                                {filteredVentes.map((vente, i) => <VenteRow key={vente._id} vente={vente} index={i} />)}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default RapportsPage;