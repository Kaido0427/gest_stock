// pages/SalesPage.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Search, Package, ShoppingCart, Receipt, Plus, Minus, X,
  Store, TrendingUp, Filter, ChevronDown, ChevronUp,RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { vendreProduit } from "../../services/sale";
import { useCurrentUser } from "../../hooks/useAuth";
import ProductSelector from "../../components/ventes/ProductSelector";
import CartItem from "../../components/ventes/CartItem";

// --- Helpers de conversion (inchangés) ---
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
  if (liq[f] !== undefined && liq[t] !== undefined) {
    const inLiters = quantity * liq[f];
    return inLiters / liq[t];
  }
  if (w[f] !== undefined && w[t] !== undefined) {
    const inKg = quantity * w[f];
    return inKg / w[t];
  }
  return quantity;
};

const SalesPage = ({ products: productsProp = [], onRefreshProducts }) => {
  // Normalisation des produits
  const products = Array.isArray(productsProp) ? productsProp : (productsProp?.produits ?? []);

  const cartRef = useRef(null);
  // États
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [loading, setLoading] = useState(false);
  // Pour mobile : afficher/cacher la configuration produit
  const [showConfig, setShowConfig] = useState(false);

  const { data: user, isLoading: userLoading } = useCurrentUser();

  // Filtrage par boutique selon rôle
  const getFilteredProductsByUser = () => {
    if (!Array.isArray(products)) return [];
    if (!user) return products;
    if (user.role === "employe" && user.boutique) {
      const boutiqueId = user.boutique._id || user.boutique.id;
      return products.filter(p =>
        p.boutique_id?._id === boutiqueId || p.boutique_id === boutiqueId
      );
    }
    return products;
  };
  const userProducts = getFilteredProductsByUser();

  // Catégories uniques
  const categories = ["Tous", ...new Set(userProducts.map(p => p.category).filter(Boolean))];

  // Produits filtrés (recherche + catégorie + stock > 0)
  const filteredProducts = userProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Tous" || product.category === selectedCategory;
    const hasStock = product.stock > 0;
    return matchesSearch && matchesCategory && hasStock;
  });

  // Unités disponibles
  const getAvailableUnits = (baseUnit) => {
    const liquidUnits = ["L", "cL", "mL", "kL"];
    const weightUnits = ["kg", "g", "mg", "t"];
    if (liquidUnits.includes(baseUnit)) return liquidUnits;
    if (weightUnits.includes(baseUnit)) return weightUnits;
    return [baseUnit];
  };

  // Calcul prix estimé
  const calculateEstimatedPrice = () => {
    if (!selectedProduct || !quantity || quantity <= 0) return 0;
    if (customPrice && parseFloat(customPrice) > 0) return parseFloat(customPrice);
    const unitToUse = selectedUnit || selectedProduct.unit;
    const qtyInBase = convertUnit(parseFloat(quantity), unitToUse, selectedProduct.unit);
    return (parseFloat(selectedProduct.basePrice) || 0) * qtyInBase;
  };

  // Ajout au panier
  const handleAddToCart = () => {
    if (!selectedProduct || quantity <= 0) {
      alert("Veuillez sélectionner un produit et une quantité");
      return;
    }
    const canConvert = ["L", "cL", "mL", "kL", "kg", "g", "mg", "t"].includes(selectedProduct.unit);
    const unitToSell = canConvert ? (selectedUnit || selectedProduct.unit) : selectedProduct.unit;
    if (!canConvert && selectedUnit !== selectedProduct.unit) {
      alert(`Ce produit ne peut être vendu que en ${selectedProduct.unit}`);
      return;
    }
    const estimatedPrice = calculateEstimatedPrice();
    const cartItem = {
      id: `${selectedProduct._id}-${Date.now()}`,
      productId: selectedProduct._id,
      productName: selectedProduct.name,
      quantity: parseFloat(quantity),
      unit: unitToSell,
      baseUnit: selectedProduct.unit,
      basePrice: selectedProduct.basePrice,
      estimatedTotal: estimatedPrice,
      customPrice: customPrice ? parseFloat(customPrice) : undefined,
      maxStock: selectedProduct.stock
    };
    setCart([...cart, cartItem]);
    // Réinitialiser
    setQuantity(1);
    setCustomPrice("");
    setSelectedUnit(selectedProduct.unit);
    // Sur mobile, replier la config après ajout
    if (window.innerWidth < 768) setShowConfig(false);
  };

  // Mise à jour quantité dans panier
  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 0.01) return;
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const unitToUse = item.unit || item.baseUnit;
        const qtyInBase = convertUnit(parseFloat(newQuantity), unitToUse, item.baseUnit);
        const newTotal = item.customPrice !== undefined && item.customPrice !== null
          ? item.customPrice
          : (parseFloat(item.basePrice) || 0) * qtyInBase;
        return {
          ...item,
          quantity: Math.round(newQuantity * 100) / 100,
          estimatedTotal: Math.round(newTotal * 100) / 100
        };
      }
      return item;
    }));
  };

  // Supprimer item
  const handleRemoveFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Vider panier
  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (confirm("Voulez-vous vraiment vider le panier ?")) {
      setCart([]);
    }
  };

  // Validation vente
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Le panier est vide");
      return;
    }
    setLoading(true);
    try {
      for (const item of cart) {
        const result = await vendreProduit(
          item.productId,
          parseFloat(item.quantity),
          item.unit,
          item.customPrice ? parseFloat(item.customPrice) : null
        );
        if (result && result.error) {
          throw new Error(result.error || "Erreur inconnue serveur");
        }
      }
      const totalAmount = cart.reduce((sum, item) => sum + item.estimatedTotal, 0);
      const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
      alert(
        `✅ Vente validée avec succès !\n\n` +
        `Articles vendus: ${itemsCount}\n` +
        `Montant total: ${totalAmount.toLocaleString()} FCFA\n\n` +
        `Les stocks ont été mis à jour.`
      );
      setCart([]);
      if (onRefreshProducts) await onRefreshProducts();
    } catch (error) {
      console.error("[Checkout] erreur:", error);
      alert("Erreur lors de la validation de la vente: " + (error?.message || JSON.stringify(error)));
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.estimatedTotal, 0);
  const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* ── HEADER (comme dans Rapports) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Caisse / Point de vente
            </h1>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              {itemsCount} article{itemsCount > 1 ? 's' : ''} • Total:{' '}
              <span className="font-semibold text-indigo-600">{subtotal.toLocaleString()} FCFA</span>
            </p>
          </div>
          {/* Bouton rafraîchir (si besoin) */}
          <button
            onClick={onRefreshProducts}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 shadow-sm transition-colors self-start sm:self-auto"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* ── ZONE PRINCIPALE (2 colonnes sur desktop, 1 sur mobile) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* COLONNE GAUCHE (produits) */}
          <div className="lg:col-span-2 space-y-5">

            {/* Barre de recherche et catégories */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un produit..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-700 placeholder-slate-400 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Catégories (scroll horizontal sur mobile) */}
                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all ${selectedCategory === category
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grille de produits */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Package className="w-4 h-4 text-indigo-600" />
                </div>
                <h2 className="font-black text-slate-900 text-sm">Produits disponibles ({filteredProducts.length})</h2>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Package className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Aucun produit trouvé</p>
                  <p className="text-xs mt-1">Modifiez vos filtres ou vérifiez les stocks</p>
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
                          setShowConfig(true); // sur mobile, déplier la config
                          // Scroll vers le panier sur mobile
                          if (window.innerWidth < 768 && cartRef.current) {
                            cartRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                          }
                        }}
                        showBoutique={user?.role === "admin"}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* COLONNE DROITE (panier + config) */}
          <div className="space-y-5">
            {/* Panier */}
            <div
              ref={cartRef}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h2 className="font-black text-slate-900 text-sm">Panier ({cart.length})</h2>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1 bg-red-50 px-2 py-1 rounded-full"
                  >
                    <X className="w-3 h-3" />
                    Vider
                  </button>
                )}
              </div>

              <AnimatePresence>
                {cart.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-10 text-slate-400"
                  >
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">Panier vide</p>
                    <p className="text-xs mt-1">Ajoutez des produits depuis la liste</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                      >
                        <CartItem
                          item={item}
                          onRemove={handleRemoveFromCart}
                          onUpdateQuantity={handleUpdateQuantity}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>

              {cart.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Articles</span>
                      <span className="font-medium text-slate-700">{itemsCount}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold">
                      <span className="text-slate-700">Total à payer</span>
                      <span className="text-indigo-600 text-lg">{subtotal.toLocaleString()} FCFA</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={loading || cart.length === 0}
                    className="w-full mt-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <Receipt className="w-5 h-5" />
                        Valider la vente
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Configuration du produit sélectionné (accordéon sur mobile) */}
            {selectedProduct && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                {/* En-tête cliquable sur mobile pour replier/déplier */}
                <div
                  className="flex items-center justify-between cursor-pointer lg:cursor-default"
                  onClick={() => window.innerWidth < 768 && setShowConfig(!showConfig)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <Package className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h2 className="font-black text-slate-900 text-sm">{selectedProduct.name}</h2>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedProduct(null); }}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Contenu de la config (caché sur mobile si showConfig false) */}
                <AnimatePresence initial={false}>
                  {(showConfig || window.innerWidth >= 768) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-5 space-y-4">
                        {/* Stock */}
                        <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                          <div className="text-xs text-indigo-600 font-medium mb-1">Stock disponible</div>
                          <div className="text-xl font-bold text-indigo-700">
                            {selectedProduct.stock} {selectedProduct.unit}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Prix: {selectedProduct.basePrice.toLocaleString()} FCFA / {selectedProduct.unit}
                          </div>
                        </div>

                        {/* Unité */}
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1.5 ml-1">
                            Unité de vente
                          </label>
                          <select
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-700 text-sm"
                            disabled={!["L", "cL", "mL", "kL", "kg", "g", "mg", "t"].includes(selectedProduct.unit)}
                          >
                            {getAvailableUnits(selectedProduct.unit).map(unit => (
                              <option key={unit} value={unit}>
                                {unit} {unit === selectedProduct.unit && "(base)"}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantité */}
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1.5 ml-1">
                            Quantité
                          </label>
                          <div className="flex items-center justify-between p-1 bg-slate-50 border border-slate-200 rounded-xl">
                            <button
                              onClick={() => setQuantity(Math.max(0.01, Math.round((quantity - 0.01) * 100) / 100))}
                              disabled={quantity <= 0.01}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${quantity <= 0.01 ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              value={quantity}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                setQuantity(Math.max(0.01, isNaN(v) ? 0.01 : Math.round(v * 100) / 100));
                              }}
                              className="w-16 text-center text-lg font-bold text-slate-800 bg-transparent focus:outline-none"
                              step="0.01"
                              min="0.01"
                            />
                            <button
                              onClick={() => setQuantity(Math.round((quantity + 0.01) * 100) / 100)}
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-200"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Prix personnalisé */}
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1.5 ml-1">
                            Prix personnalisé (optionnel)
                          </label>
                          <input
                            type="number"
                            value={customPrice}
                            onChange={(e) => setCustomPrice(e.target.value)}
                            placeholder="Auto"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-700 placeholder-slate-400 text-sm"
                            step="1"
                          />
                        </div>

                        {/* Total estimé */}
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-emerald-600 font-medium">Total estimé</span>
                            <span className="text-lg font-bold text-emerald-700">
                              {calculateEstimatedPrice().toLocaleString()} FCFA
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={handleAddToCart}
                          disabled={!selectedProduct || quantity <= 0}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                          <Plus className="w-5 h-5" />
                          Ajouter au panier
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesPage;