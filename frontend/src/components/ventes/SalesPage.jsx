// pages/SalesPage.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Search, Package, ShoppingCart,
  Receipt, Plus, Minus, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { vendreProduit } from "../../services/sale";
import { useCurrentUser } from "../../hooks/useAuth";
import ProductSelector from "../../components/ventes/ProductSelector";
import CartItem from "../../components/ventes/CartItem";

// --- Constantes et helpers ---
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

const isMobile = () => {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= 768;
};

// --- Composant principal ---
// ✅ Renommage du paramètre pour éviter le conflit
const SalesPage = ({ products: productsProp = [], onRefreshProducts }) => {
  // ✅ Normalisation : si c'est un objet avec une clé "produits", on prend ce tableau
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

  // Hook utilisateur
  const { data: user, isLoading: userLoading } = useCurrentUser();

  // Debug (à supprimer plus tard)
  console.log("SalesPage - products (normalisé):", products);
  console.log("SalesPage - user:", user);

  // Filtrer les produits selon le rôle de l'utilisateur
  const getFilteredProductsByUser = () => {
    if (!Array.isArray(products)) return [];
    if (!user) return products;

    if (user.role === "employe" && user.boutique) {
      const boutiqueId = user.boutique._id || user.boutique.id;
      return products.filter(p =>
        p.boutique_id?._id === boutiqueId ||
        p.boutique_id === boutiqueId
      );
    }
    return products;
  };

  // Produits filtrés par utilisateur
  const userProducts = getFilteredProductsByUser();

  // Catégories
  const categories = ["Tous", ...new Set(userProducts.map(p => p.category).filter(Boolean))];

  // Produits filtrés par recherche et catégorie
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

    if (liquidUnits.includes(baseUnit)) {
      return liquidUnits;
    } else if (weightUnits.includes(baseUnit)) {
      return weightUnits;
    }
    return [baseUnit];
  };

  // Calculer le prix estimé
  const calculateEstimatedPrice = () => {
    if (!selectedProduct || !quantity || quantity <= 0) return 0;
    if (customPrice && parseFloat(customPrice) > 0) {
      return parseFloat(customPrice);
    }

    const unitToUse = selectedUnit || selectedProduct.unit;
    const qtyInBase = convertUnit(parseFloat(quantity), unitToUse, selectedProduct.unit);
    return (parseFloat(selectedProduct.basePrice) || 0) * qtyInBase;
  };

  // Ajouter au panier
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
  };

  // Mettre à jour la quantité d'un item
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

  // Retirer un item du panier
  const handleRemoveFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Vider le panier
  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (confirm("Voulez-vous vraiment vider le panier ?")) {
      setCart([]);
    }
  };

  // Valider la vente
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

      if (onRefreshProducts) {
        await onRefreshProducts();
      }
    } catch (error) {
      console.error("[Checkout] erreur complète:", error);
      alert(
        "Erreur lors de la validation de la vente — détail: " +
        (error?.message || JSON.stringify(error))
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculer le total
  const subtotal = cart.reduce((sum, item) => sum + item.estimatedTotal, 0);
  const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Affichage pendant le chargement de l'utilisateur
  if (userLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Caisse / Point de vente</h1>
          <p className="text-gray-600 mt-1">
            {itemsCount} article{itemsCount > 1 ? 's' : ''} • Total: {subtotal.toLocaleString()} FCFA
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLONNE GAUCHE : Sélection des produits */}
        <div className="lg:col-span-2 space-y-6">
          {/* FILTRES */}
          <div className="bg-white p-4 rounded-xl shadow">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 whitespace-nowrap rounded-lg transition-colors ${selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PRODUITS */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Produits ({filteredProducts.length})
            </h2>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Package className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p>Aucun produit correspondant</p>
                {products.length === 0 && (
                  <p className="text-sm mt-2 text-gray-500">
                    Aucun produit disponible. Vérifiez que les produits sont chargés.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

                        if (isMobile() && cartRef.current) {
                          requestAnimationFrame(() => {
                            cartRef.current.scrollIntoView({
                              behavior: "smooth",
                              block: "start"
                            });
                            cartRef.current.focus({ preventScroll: true });
                            cartRef.current.classList.add("ring-2", "ring-blue-400");
                            setTimeout(() => {
                              cartRef.current.classList.remove("ring-2", "ring-blue-400");
                            }, 600);
                          });
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

        {/* COLONNE DROITE : Panier */}
        <div className="space-y-6">
          {/* PANIER */}
          <div
            ref={cartRef}
            id="cart-anchor"
            tabIndex={-1}
            className="bg-white p-6 rounded-xl shadow"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Panier ({cart.length})
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Vider
                </button>
              )}
            </div>

            <AnimatePresence>
              {cart.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-gray-400"
                >
                  <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p>Panier vide</p>
                  <p className="text-sm mt-1">Ajoutez des produits pour commencer</p>
                </motion.div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
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

            {/* TOTAL */}
            {cart.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Articles</span>
                    <span className="font-medium">{itemsCount}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total à payer</span>
                    <span className="text-blue-600">{subtotal.toLocaleString()} FCFA</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading || cart.length === 0}
                  className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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

          {/* CONFIGURATION DU PRODUIT SÉLECTIONNÉ */}
          {selectedProduct && (
            <div className="bg-white p-6 rounded-xl shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  {selectedProduct.name}
                </h2>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Info stock */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-gray-600">Stock disponible</div>
                  <div className="text-lg font-bold text-blue-700">
                    {selectedProduct.stock} {selectedProduct.unit}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Prix: {selectedProduct.basePrice.toLocaleString()} FCFA / {selectedProduct.unit}
                  </div>
                  {user?.role === "admin" && selectedProduct.boutique_id?.name && (
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {selectedProduct.boutique_id.name}
                    </div>
                  )}
                </div>

                {/* Sélection de l'unité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unité de vente
                  </label>
                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={!["L", "cL", "mL", "kL", "kg", "g", "mg", "t"].includes(selectedProduct.unit)}
                  >
                    {getAvailableUnits(selectedProduct.unit).map(unit => (
                      <option key={unit} value={unit}>
                        {unit} {unit === selectedProduct.unit && "(base)"}
                      </option>
                    ))}
                  </select>
                  {!["L", "cL", "mL", "kL", "kg", "g", "mg", "t"].includes(selectedProduct.unit) && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠ Ce produit ne peut être vendu que dans son unité de base
                    </p>
                  )}
                </div>

                {/* Quantité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantité
                  </label>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(0.01, Math.round((quantity - 0.01) * 100) / 100))}
                      disabled={quantity <= 0.01}
                      className={`p-2 rounded-lg ${quantity <= 0.01
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
                      className="w-20 text-center text-2xl font-bold text-gray-800 bg-transparent"
                      step="0.01"
                      min="0.01"
                    />

                    <button
                      onClick={() => setQuantity(Math.round((quantity + 0.01) * 100) / 100)}
                      className="p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Prix personnalisé */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix personnalisé (optionnel)
                  </label>
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="Laisser vide pour calcul auto"
                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                    step="1"
                  />
                </div>

                {/* Total estimé */}
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Total estimé</span>
                    <span className="text-xl font-bold text-green-700">
                      {calculateEstimatedPrice().toLocaleString()} FCFA
                    </span>
                  </div>
                  {selectedUnit !== selectedProduct.unit && (
                    <div className="text-xs text-green-600 mt-1">
                      La conversion sera faite automatiquement
                    </div>
                  )}
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!selectedProduct || quantity <= 0}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter au panier
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesPage;