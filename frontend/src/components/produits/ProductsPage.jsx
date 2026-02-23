import React, { useState, useMemo } from "react";
import {
  Plus, Edit3, Trash2, Package, Eye, Store,
  Search, X, ArrowUpDown, Boxes, TrendingDown,
  AlertTriangle, ChevronDown, RefreshCw, SlidersHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import ProductModal from "./ProductModal";
import ApprovisionnementModal from "./ApprovisionnementModal";
import ProductDetailModal from "./ProductDetailModal";
import { useProduits, useDeleteProduit } from "../../hooks/useProducts";
import { getAllBoutiques } from "../../services/boutique";
import { useQuery } from "@tanstack/react-query";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const stockStatus = (stock) => {
  if (stock === 0) return { label: "Épuisé", color: "red" };
  if (stock < 10) return { label: "Faible", color: "amber" };
  return { label: "En stock", color: "emerald" };
};

const colorMap = {
  red: "bg-red-100 text-red-700 ring-red-200",
  amber: "bg-amber-100 text-amber-700 ring-amber-200",
  emerald: "bg-emerald-100 text-emerald-700 ring-emerald-200",
};

const dotMap = {
  red: "bg-red-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, gradient, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 200, damping: 20 }}
      className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${gradient}`}
    >
      <div className="absolute -right-4 -top-4 opacity-20">
        <Icon className="w-20 h-20" strokeWidth={1} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-2">
        {label}
      </p>
      <p className="text-3xl font-black tabular-nums">{value}</p>
    </motion.div>
  );
}

// ─── Product Row (desktop) ────────────────────────────────────────────────────
function ProductRow({ product, onEdit, onDelete, onStock, onView, index }) {
  const { label, color } = stockStatus(product.stock);
  const deleteMutation = useDeleteProduit();

  const handleDelete = () => {
    if (!confirm("Supprimer ce produit ?")) return;
    deleteMutation.mutate(product._id);
  };

  return (
    <motion.tr
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ delay: index * 0.04 }}
      className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors"
    >
      {/* Produit */}
      <td className="px-5 py-4">
        <div className="font-semibold text-slate-800 text-sm leading-tight">
          {product.name}
        </div>
        {product.description && (
          <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">
            {product.description}
          </div>
        )}
      </td>

      {/* Boutique */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Store className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <span className="text-sm text-slate-700 font-medium">
            {product.boutique_id?.name || "—"}
          </span>
        </div>
      </td>

      {/* Catégorie */}
      <td className="px-5 py-4">
        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
          {product.category || "—"}
        </span>
      </td>

      {/* Prix */}
      <td className="px-5 py-4">
        <span className="font-bold text-slate-800">
          {(product.basePrice || 0).toLocaleString("fr-FR")}
        </span>
        <span className="text-xs text-slate-400 ml-1">FCFA</span>
      </td>

      {/* Stock */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ring-1 ${colorMap[color]}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dotMap[color]}`} />
            {product.stock} {product.unit || "u."}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5 pl-0.5">{label}</div>
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionBtn
            onClick={() => onView(product)}
            color="purple"
            icon={Eye}
            title="Détails"
          />
          <ActionBtn
            onClick={() => onEdit(product)}
            color="blue"
            icon={Edit3}
            title="Modifier"
          />
          <ActionBtn
            onClick={() => onStock(product)}
            color="emerald"
            icon={Package}
            title="Stock"
          />
          <ActionBtn
            onClick={handleDelete}
            color="red"
            icon={Trash2}
            title="Supprimer"
            loading={deleteMutation.isPending}
          />
        </div>
      </td>
    </motion.tr>
  );
}

function ActionBtn({ onClick, color, icon: Icon, title, loading }) {
  const styles = {
    purple: "hover:bg-purple-100 hover:text-purple-700 text-slate-400",
    blue: "hover:bg-blue-100 hover:text-blue-700 text-slate-400",
    emerald: "hover:bg-emerald-100 hover:text-emerald-700 text-slate-400",
    red: "hover:bg-red-100 hover:text-red-600 text-slate-400",
  };
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={loading}
      className={`p-2 rounded-lg transition-colors ${styles[color]} disabled:opacity-50`}
    >
      {loading ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
    </button>
  );
}

// ─── Product Card (mobile) ────────────────────────────────────────────────────
function ProductCard({ product, onEdit, onDelete, onStock, onView, index }) {
  const { label, color } = stockStatus(product.stock);
  const deleteMutation = useDeleteProduit();

  const handleDelete = () => {
    if (!confirm("Supprimer ce produit ?")) return;
    deleteMutation.mutate(product._id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 200, damping: 22 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden"
    >
      {/* Color accent bar */}
      <div
        className={`h-1 w-full ${
          color === "red"
            ? "bg-red-400"
            : color === "amber"
            ? "bg-amber-400"
            : "bg-emerald-400"
        }`}
      />

      <div className="p-4 space-y-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-base leading-tight truncate">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                {product.description}
              </p>
            )}
          </div>
          <span
            className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ring-1 ${colorMap[color]}`}
          >
            {label}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-medium">
            <Store className="w-3 h-3" />
            {product.boutique_id?.name || "Boutique inconnue"}
          </div>
          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-medium">
            {product.category || "Non catégorisé"}
          </span>
        </div>

        {/* Price & Stock */}
        <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">
              Prix unitaire
            </p>
            <p className="font-black text-slate-900 text-lg leading-tight">
              {(product.basePrice || 0).toLocaleString("fr-FR")}
              <span className="text-xs font-medium text-slate-500 ml-1">FCFA</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">
              Stock
            </p>
            <p className="font-black text-slate-900 text-lg leading-tight">
              {product.stock}
              <span className="text-xs font-medium text-slate-500 ml-1">
                {product.unit || "u."}
              </span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          <MobileBtn
            onClick={() => onView(product)}
            icon={Eye}
            label="Voir"
            color="purple"
          />
          <MobileBtn
            onClick={() => onEdit(product)}
            icon={Edit3}
            label="Éditer"
            color="blue"
          />
          <MobileBtn
            onClick={() => onStock(product)}
            icon={Package}
            label="Stock"
            color="emerald"
          />
          <MobileBtn
            onClick={handleDelete}
            icon={Trash2}
            label="Suppr."
            color="red"
            loading={deleteMutation.isPending}
          />
        </div>
      </div>
    </motion.div>
  );
}

function MobileBtn({ onClick, icon: Icon, label, color, loading }) {
  const styles = {
    purple: "bg-purple-50 text-purple-700 active:bg-purple-100",
    blue: "bg-blue-50 text-blue-700 active:bg-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 active:bg-emerald-100",
    red: "bg-red-50 text-red-600 active:bg-red-100",
  };
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-semibold transition-colors ${styles[color]} disabled:opacity-50`}
    >
      {loading ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
      {label}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const ProductsPage = () => {
  const { data: products = [], isLoading, isError, refetch } = useProduits();

  const { data: boutiques = [] } = useQuery({
    queryKey: ["boutiques"],
    queryFn: async () => {
      const res = await getAllBoutiques();
      if (res.error) throw new Error(res.error);
      return Array.isArray(res) ? res : res.boutiques ?? [];
    },
    staleTime: 60_000,
  });

  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [isApproModalOpen, setApproModalOpen] = useState(false);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBoutique, setSelectedBoutique] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name | stock | price
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const handleEdit = (p) => { setActiveProduct(p); setProductModalOpen(true); };
  const handleAdd = () => { setActiveProduct(null); setProductModalOpen(true); };
  const handleStock = (p) => { setActiveProduct(p); setApproModalOpen(true); };
  const handleView = (p) => { setActiveProduct(p); setDetailModalOpen(true); };

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q);
      const matchBoutique =
        !selectedBoutique || p.boutique_id?._id === selectedBoutique;
      return matchSearch && matchBoutique;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "stock") return (a.stock || 0) - (b.stock || 0);
      if (sortBy === "price") return (a.basePrice || 0) - (b.basePrice || 0);
      return a.name.localeCompare(b.name, "fr");
    });

    return list;
  }, [products, searchTerm, selectedBoutique, sortBy]);

  const stats = useMemo(() => ({
    total: filteredProducts.length,
    stockTotal: filteredProducts.reduce((s, p) => s + (p.stock || 0), 0),
    lowStock: filteredProducts.filter((p) => p.stock > 0 && p.stock < 10).length,
    outOfStock: filteredProducts.filter((p) => p.stock === 0).length,
  }), [filteredProducts]);

  const hasFilters = searchTerm || selectedBoutique;
  const clearFilters = () => { setSearchTerm(""); setSelectedBoutique(""); };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "12px",
            fontFamily: "inherit",
            fontSize: "14px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          },
          success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />

      <div className="min-h-screen bg-[#f5f6fa] p-3 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-5">

          {/* ── HEADER ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Produits
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {isLoading
                  ? "Chargement…"
                  : `${stats.total} produit${stats.total > 1 ? "s" : ""}${hasFilters ? " trouvé" + (stats.total > 1 ? "s" : "") : ""}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                className="p-3 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors shadow-sm"
                title="Actualiser"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={handleAdd}
                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl hover:bg-slate-700 active:scale-95 transition-all shadow-sm font-semibold text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau produit</span>
              </button>
            </div>
          </div>

          {/* ── STATS ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Total produits"
              value={stats.total}
              icon={Boxes}
              gradient="bg-gradient-to-br from-slate-800 to-slate-600"
              delay={0.05}
            />
            <StatCard
              label="Stock total"
              value={stats.stockTotal.toLocaleString("fr-FR")}
              icon={Package}
              gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
              delay={0.1}
            />
            <StatCard
              label="Stock faible"
              value={stats.lowStock}
              icon={TrendingDown}
              gradient="bg-gradient-to-br from-amber-400 to-orange-500"
              delay={0.15}
            />
            <StatCard
              label="Épuisés"
              value={stats.outOfStock}
              icon={AlertTriangle}
              gradient="bg-gradient-to-br from-red-500 to-rose-600"
              delay={0.2}
            />
          </div>

          {/* ── SEARCH + FILTER BAR ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 p-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Rechercher…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition-all placeholder-slate-400 text-slate-700"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter toggle (mobile) */}
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  showFilterPanel || selectedBoutique
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filtres</span>
                {selectedBoutique && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 sm:hidden" />
                )}
              </button>

              {/* Sort */}
              <div className="relative hidden sm:block">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/20 cursor-pointer"
                >
                  <option value="name">A → Z</option>
                  <option value="stock">Stock ↑</option>
                  <option value="price">Prix ↑</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors whitespace-nowrap"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Réinitialiser</span>
                </button>
              )}
            </div>

            {/* Filter panel (expandable) */}
            <AnimatePresence>
              {showFilterPanel && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-slate-100"
                >
                  <div className="p-3 flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select
                        value={selectedBoutique}
                        onChange={(e) => setSelectedBoutique(e.target.value)}
                        className="appearance-none w-full pl-10 pr-8 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20 text-slate-700 cursor-pointer"
                      >
                        <option value="">Toutes les boutiques</option>
                        {boutiques.map((b) => (
                          <option key={b._id} value={b._id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Sort (mobile) */}
                    <div className="sm:hidden relative flex-1">
                      <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none w-full pl-10 pr-8 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20 text-slate-700 cursor-pointer"
                      >
                        <option value="name">Trier : A → Z</option>
                        <option value="stock">Trier : Stock ↑</option>
                        <option value="price">Trier : Prix ↑</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── LOADING / ERROR ── */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
              <p className="text-slate-500 text-sm">Chargement des produits…</p>
            </div>
          )}

          {isError && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-red-700 font-semibold">Erreur lors du chargement</p>
              <button
                onClick={() => refetch()}
                className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* ── EMPTY STATE ── */}
          {!isLoading && !isError && filteredProducts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center"
            >
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                {hasFilters ? "Aucun résultat" : "Aucun produit"}
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                {hasFilters
                  ? "Essayez de modifier vos filtres de recherche."
                  : "Commencez par créer votre premier produit."}
              </p>
              {hasFilters ? (
                <button
                  onClick={clearFilters}
                  className="text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              ) : (
                <button
                  onClick={handleAdd}
                  className="text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 px-4 py-2.5 rounded-xl transition-colors"
                >
                  Créer un produit
                </button>
              )}
            </motion.div>
          )}

          {/* ── PRODUCT LIST ── */}
          {!isLoading && !isError && filteredProducts.length > 0 && (
            <>
              {/* Mobile cards */}
              <div className="lg:hidden space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product, index) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      index={index}
                      onEdit={handleEdit}
                      onDelete={() => {}}
                      onStock={handleStock}
                      onView={handleView}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* Desktop table */}
              <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                      {["Produit", "Boutique", "Catégorie", "Prix", "Stock", "Actions"].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {filteredProducts.map((product, index) => (
                        <ProductRow
                          key={product._id}
                          product={product}
                          index={index}
                          onEdit={handleEdit}
                          onDelete={() => {}}
                          onStock={handleStock}
                          onView={handleView}
                        />
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* ── MODALS ── */}
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => { setProductModalOpen(false); setActiveProduct(null); }}
          product={activeProduct}
        />
        <ApprovisionnementModal
          isOpen={isApproModalOpen}
          onClose={() => { setApproModalOpen(false); setActiveProduct(null); }}
          product={activeProduct}
        />
        <ProductDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => { setDetailModalOpen(false); setActiveProduct(null); }}
          product={activeProduct}
        />
      </div>
    </>
  );
};

export default ProductsPage;