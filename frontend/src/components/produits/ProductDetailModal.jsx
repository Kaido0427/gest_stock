import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Package, DollarSign, Info, Store, MapPin,
  Phone, Calendar, TrendingUp, AlertTriangle,
} from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => (n || 0).toLocaleString("fr-FR");

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "N/A";

// ─── Small info row ───────────────────────────────────────────────────────────
function InfoRow({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-semibold ${accent || "text-slate-800"}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Mini stat card ───────────────────────────────────────────────────────────
function MiniStat({ label, value, sub, icon: Icon, color }) {
  const colors = {
    emerald: "from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700",
    blue: "from-blue-50 to-blue-100 border-blue-200 text-blue-700",
    purple: "from-purple-50 to-purple-100 border-purple-200 text-purple-700",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-4`}>
      <div className="flex items-center gap-2 mb-2 opacity-70">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-black leading-tight">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Stock badge ──────────────────────────────────────────────────────────────
function StockBadge({ stock }) {
  if (stock === 0)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full ring-1 ring-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Épuisé
      </span>
    );
  if (stock < 10)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full ring-1 ring-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Stock faible
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full ring-1 ring-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      En stock
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
const ProductDetailModal = ({ isOpen, onClose, product }) => {
  if (!product) return null;

  const valeurStock = (product.stock || 0) * (product.basePrice || 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="relative bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
          >
            {/* Drag handle (mobile) */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-4 pb-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-xl font-black text-slate-900 leading-tight">
                    {product.name}
                  </h2>
                  <StockBadge stock={product.stock} />
                </div>
                {product.description && (
                  <p className="text-sm text-slate-500 line-clamp-2 mt-0.5">
                    {product.description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-6">

                {/* Boutique info */}
                {product.boutique_id && (
                  <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Store className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-indigo-900 text-sm">
                        {product.boutique_id.name}
                      </p>
                      {product.boutique_id.address && (
                        <div className="flex items-center gap-1 text-xs text-indigo-700 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {product.boutique_id.address}
                        </div>
                      )}
                      {product.boutique_id.phone && (
                        <div className="flex items-center gap-1 text-xs text-indigo-700 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {product.boutique_id.phone}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Alert banners */}
                {product.stock === 0 && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-red-700">Produit épuisé</p>
                      <p className="text-xs text-red-600">Veuillez réapprovisionner ce produit.</p>
                    </div>
                  </div>
                )}
                {product.stock > 0 && product.stock < 10 && (
                  <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-amber-700">Stock faible</p>
                      <p className="text-xs text-amber-600">
                        Il ne reste que <strong>{product.stock} {product.unit}</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <MiniStat
                    label="Stock"
                    value={fmt(product.stock)}
                    sub={product.unit || "unité"}
                    icon={Package}
                    color="emerald"
                  />
                  <MiniStat
                    label="Prix unit."
                    value={fmt(product.basePrice)}
                    sub={`FCFA/${product.unit || "u."}`}
                    icon={DollarSign}
                    color="blue"
                  />
                  <MiniStat
                    label="Valeur"
                    value={fmt(valeurStock)}
                    sub="FCFA"
                    icon={TrendingUp}
                    color="purple"
                  />
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Stock & Prix */}
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" />
                      Stock & Prix
                    </h4>
                    <InfoRow label="Quantité actuelle" value={`${product.stock || 0} ${product.unit || "u."}`} accent="text-emerald-700" />
                    <InfoRow label="Unité de mesure" value={product.unit || "—"} />
                    <InfoRow label="Prix de base" value={`${fmt(product.basePrice)} FCFA`} accent="text-blue-700" />
                    <InfoRow label="Valeur totale du stock" value={`${fmt(valeurStock)} FCFA`} accent="text-purple-700" />
                  </div>

                  {/* Infos générales */}
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      Informations
                    </h4>
                    <InfoRow label="Catégorie" value={product.category || "—"} />
                    <InfoRow
                      label="Créé le"
                      value={fmtDate(product.createdAt)}
                    />
                    <InfoRow
                      label="Modifié le"
                      value={fmtDate(product.updatedAt)}
                    />
                    {product.description && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-xs text-slate-400 mb-1">Description</p>
                        <p className="text-sm text-slate-700">{product.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tip box */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-bold text-blue-800">Conseil vente</p>
                  </div>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Stock enregistré en <strong>{product.unit || "unité"}</strong>.
                    Lors de la vente, vous pouvez choisir l'unité de vente : le système
                    convertira automatiquement et déduira la bonne quantité du stock.
                  </p>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0">
              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-900 hover:bg-slate-700 text-white rounded-xl font-semibold text-sm transition-colors active:scale-[0.98]"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProductDetailModal;