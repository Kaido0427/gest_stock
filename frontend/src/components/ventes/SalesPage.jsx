import React, { useState, useRef } from "react";
import {
  Search, Package, ShoppingCart, Receipt, Plus, Minus, X, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMe } from "../../hooks/useAuth";
import { useProduits } from "../../hooks/useProducts";
import { useValiderVente } from "../../hooks/useSales";
import ProductSelector from "./ProductSelector";
import CartItem from "./CartItem";

// ─── Helpers conversion ───────────────────────────────────────────────────────
const UNIT_MAPS = {
  liquids: { kl: 1000, l: 1, cl: 0.01, ml: 0.001 },
  weights: { t: 1000, kg: 1, g: 0.001, mg: 0.000001 },
};
const normalize = (u) => (typeof u === "string" ? u.trim().toLowerCase() : u);

const convertUnit = (quantity, fromUnit, toUnit) => {
  if (!fromUnit || !toUnit) return quantity;
  const f = normalize(fromUnit);
  const t = normalize(toUnit);
  if (f === t) return quantity;
  const liq = UNIT_MAPS.liquids;
  const w = UNIT_MAPS.weights;
  if (liq[f] !== undefined && liq[t] !== undefined) return (quantity * liq[f]) / liq[t];
  if (w[f] !== undefined && w[t] !== undefined) return (quantity * w[f]) / w[t];
  return quantity;
};

const CONVERTIBLE_UNITS = ["L", "cL", "mL", "kL", "kg", "g", "mg", "t"];

const getAvailableUnits = (baseUnit) => {
  if (["L", "cL", "mL", "kL"].includes(baseUnit)) return ["L", "cL", "mL", "kL"];
  if (["kg", "g", "mg", "t"].includes(baseUnit)) return ["kg", "g", "mg", "t"];
  return [baseUnit];
};

// ─── SalesPage ────────────────────────────────────────────────────────────────
const SalesPage = () => {
  const cartRef = useRef(null);
  const { data: user, isLoading: userLoading } = useMe();

  const boutiqueId =
    user?.role === "employe" && user?.boutique
      ? user.boutique._id || user.boutique.id
      : undefined;

  const {
    data: prodData,
    isLoading: productsLoading,
    refetch: refetchProducts,
  } = useProduits(boutiqueId ? { boutique_id: boutiqueId, limit: 9999 } : { limit: 9999 });

  const allProducts = prodData?.produits ?? [];

  const { mutateAsync: valider, isPending: loading } = useValiderVente();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [showConfig, setShowConfig] = useState(false);

  const categories = ["Tous", ...new Set(allProducts.map((p) => p.category).filter(Boolean))];

  const filteredProducts = allProducts.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === "Tous" || p.category === selectedCategory;
    return matchSearch && matchCategory && p.stock > 0;
  });

  const subtotal = cart.reduce((s, i) => s + i.estimatedTotal, 0);
  const itemsCount = cart.reduce((s, i) => s + i.quantity, 0);

  const calculateEstimatedPrice = () => {
    if (!selectedProduct || !quantity || quantity <= 0) return 0;
    if (customPrice && parseFloat(customPrice) > 0) return parseFloat(customPrice);
    const unitToUse = selectedUnit || selectedProduct.unit;
    const qtyInBase = convertUnit(parseFloat(quantity), unitToUse, selectedProduct.unit);
    return (parseFloat(selectedProduct.basePrice) || 0) * qtyInBase;
  };

  const handleAddToCart = () => {
    if (!selectedProduct || quantity <= 0) return;
    const canConvert = CONVERTIBLE_UNITS.includes(selectedProduct.unit);
    const unitToSell = canConvert ? (selectedUnit || selectedProduct.unit) : selectedProduct.unit;
    const cartItem = {
      id: `${selectedProduct._id}-${Date.now()}`,
      productId: selectedProduct._id,
      productName: selectedProduct.name,
      quantity: parseFloat(quantity),
      unit: unitToSell,
      baseUnit: selectedProduct.unit,
      basePrice: selectedProduct.basePrice,
      estimatedTotal: calculateEstimatedPrice(),
      customPrice: customPrice ? parseFloat(customPrice) : undefined,
      maxStock: selectedProduct.stock,
    };
    setCart((prev) => [...prev, cartItem]);
    setQuantity(1);
    setCustomPrice("");
    setSelectedUnit(selectedProduct.unit);
    if (window.innerWidth < 768) setShowConfig(false);
  };

  const handleUpdateQuantity = (itemId, newQty) => {
    if (newQty < 0.01) return;
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const qtyInBase = convertUnit(parseFloat(newQty), item.unit || item.baseUnit, item.baseUnit);
        const newTotal =
          item.customPrice !== undefined && item.customPrice !== null
            ? item.customPrice
            : (parseFloat(item.basePrice) || 0) * qtyInBase;
        return { ...item, quantity: Math.round(newQty * 100) / 100, estimatedTotal: Math.round(newTotal * 100) / 100 };
      })
    );
  };

  const handleRemoveFromCart = (itemId) => setCart((prev) => prev.filter((i) => i.id !== itemId));

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (confirm("Vider le panier ?")) setCart([]);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      await valider({
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          customPrice: item.customPrice,
        })),
      });
      setCart([]);
    } catch {
      // erreur gérée par onError du hook
    }
  };

  if (userLoading || productsLoading) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Caisse / Point de vente</h1>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              {itemsCount} article{itemsCount > 1 ? "s" : ""} •{" "}
              <span className="font-semibold text-indigo-600">{subtotal.toLocaleString()} FCFA</span>
            </p>
          </div>
          <button onClick={() => refetchProducts()}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 shadow-sm transition-colors self-start sm:self-auto">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* GAUCHE : liste produits */}
          <div className="lg:col-span-2 space-y-5">

            {/* Recherche + catégories */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" placeholder="Rechercher un produit..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-700 placeholder-slate-400 text-sm"
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                  {categories.map((cat) => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all ${selectedCategory === cat ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grille produits */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Package className="w-4 h-4 text-indigo-600" />
                </div>
                <h2 className="font-black text-slate-900 text-sm">
                  Produits disponibles ({filteredProducts.length})
                </h2>
              </div>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Package className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Aucun produit trouvé</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {filteredProducts.map((product) => (
                      <ProductSelector
                        key={product._id}
                        product={product}
                        isSelected={selectedProduct?._id === product._id}
                        onSelect={() => {
                          setSelectedProduct(product);
                          setQuantity(1);
                          setSelectedUnit(product.unit);
                          setCustomPrice("");
                          setShowConfig(true);
                        }}
                        showBoutique={user?.role === "owner" || user?.role === "manager"}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* DROITE : panier + config */}
          <div className="space-y-5">

            {/* Panier */}
            <div ref={cartRef} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h2 className="font-black text-slate-900 text-sm">Panier ({cart.length})</h2>
                </div>
                {cart.length > 0 && (
                  <button onClick={handleClearCart}
                    className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1 bg-red-50 px-2 py-1 rounded-full">
                    <X className="w-3 h-3" /> Vider
                  </button>
                )}
              </div>

              <AnimatePresence>
                {cart.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-center py-10 text-slate-400">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">Panier vide</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <motion.div key={item.id} initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                        <CartItem item={item} onRemove={handleRemoveFromCart} onUpdateQuantity={handleUpdateQuantity} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>

              {cart.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-base font-bold mb-4">
                    <span className="text-slate-700">Total à payer</span>
                    <span className="text-indigo-600 text-lg">{subtotal.toLocaleString()} FCFA</span>
                  </div>
                  <button onClick={handleCheckout} disabled={loading || cart.length === 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                    {loading ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Traitement...</>
                    ) : (
                      <><Receipt className="w-5 h-5" />Valider la vente</>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Config produit sélectionné */}
            {selectedProduct && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <Package className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h2 className="font-black text-slate-900 text-sm truncate">{selectedProduct.name}</h2>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-slate-600 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="text-xs text-indigo-600 font-medium mb-1">Stock disponible</div>
                    <div className="text-xl font-bold text-indigo-700">{selectedProduct.stock} {selectedProduct.unit}</div>
                    <div className="text-xs text-slate-500 mt-1">Prix : {selectedProduct.basePrice?.toLocaleString()} FCFA / {selectedProduct.unit}</div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 ml-1">Unité de vente</label>
                    <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}
                      disabled={!CONVERTIBLE_UNITS.includes(selectedProduct.unit)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700 text-sm">
                      {getAvailableUnits(selectedProduct.unit).map((u) => (
                        <option key={u} value={u}>{u} {u === selectedProduct.unit && "(base)"}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 ml-1">Quantité</label>
                    <div className="flex items-center justify-between p-1 bg-slate-50 border border-slate-200 rounded-xl">
                      <button onClick={() => setQuantity(Math.max(0.01, Math.round((quantity - 0.01) * 100) / 100))}
                        disabled={quantity <= 0.01}
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:text-slate-300">
                        <Minus className="w-4 h-4" />
                      </button>
                      <input type="number" value={quantity}
                        onChange={(e) => setQuantity(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                        className="w-16 text-center text-lg font-bold text-slate-800 bg-transparent focus:outline-none"
                        step="0.01" min="0.01" />
                      <button onClick={() => setQuantity(Math.round((quantity + 0.01) * 100) / 100)}
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-200">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 ml-1">Prix personnalisé (optionnel)</label>
                    <input type="number" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)}
                      placeholder="Auto"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700 text-sm" />
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-emerald-600 font-medium">Total estimé</span>
                      <span className="text-lg font-bold text-emerald-700">{calculateEstimatedPrice().toLocaleString()} FCFA</span>
                    </div>
                  </div>

                  <button onClick={handleAddToCart} disabled={!selectedProduct || quantity <= 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                    <Plus className="w-5 h-5" />Ajouter au panier
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesPage;