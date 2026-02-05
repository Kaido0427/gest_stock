// pages/SalesPage.jsx
import React, { useState } from "react";
import {
  Search, Package, ShoppingCart,
  Receipt, Plus, Minus, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { vendreProduit } from "../../services/sale";
import ProductSelector from "../../components/ventes/ProductSelector";
import CartItem from "../../components/ventes/CartItem";

const SalesPage = ({ products, onRefreshProducts }) => {
  // États
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [loading, setLoading] = useState(false);

  // Catégories uniques
  const categories = ["Tous", ...new Set(products.map(p => p.category).filter(Boolean))];

  // Produits filtrés
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Tous" || product.category === selectedCategory;
    const hasStock = product.stock > 0;
    return matchesSearch && matchesCategory && hasStock;
  });

  // Unités disponibles selon le produit
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

    // Conversion simplifiée pour estimation (le backend fera la conversion exacte)
    const unitToUse = selectedUnit || selectedProduct.unit;
    return selectedProduct.basePrice * quantity;
  };

  // Ajouter au panier
  const handleAddToCart = () => {
    if (!selectedProduct || quantity <= 0) {
      alert("Veuillez sélectionner un produit et une quantité");
      return;
    }

    const estimatedPrice = calculateEstimatedPrice();
    const unitToSell = selectedUnit || selectedProduct.unit;

    const cartItem = {
      id: `${selectedProduct._id}-${Date.now()}`,
      productId: selectedProduct._id,
      productName: selectedProduct.name,
      quantity: quantity,
      unit: unitToSell,
      baseUnit: selectedProduct.unit,
      basePrice: selectedProduct.basePrice,
      estimatedTotal: estimatedPrice,
      customPrice: customPrice ? parseFloat(customPrice) : null,
      maxStock: selectedProduct.stock
    };

    setCart([...cart, cartItem]);

    // Réinitialiser
    setQuantity(1);
    setCustomPrice("");
    setSelectedUnit("");
  };

  // Mettre à jour la quantité d'un item
  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    setCart(cart.map(item => {
      if (item.id === itemId) {
        const newTotal = item.customPrice
          ? item.customPrice
          : item.basePrice * newQuantity;
        return { ...item, quantity: newQuantity, estimatedTotal: newTotal };
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
      // Envoyer chaque vente
      for (const item of cart) {
        console.log("[Checkout] vendreProduit ->", {
          productId: item.productId,
          quantity: item.quantity,
          unit: item.unit,
          customPrice: item.customPrice
        });

        const result = await vendreProduit(
          item.productId,
          item.quantity,
          item.unit,
          item.customPrice
        );

        console.log("[Checkout] result vendreProduit:", result);

        if (result && result.error) {
          throw new Error(result.error || "Erreur inconnue serveur");
        }
      }

      // Récapitulatif
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
                      }}
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
          <div className="bg-white p-6 rounded-xl shadow">
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

                {/* BOUTON VALIDER */}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantité
                  </label>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className={`p-2 rounded-lg ${quantity <= 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="w-20 text-center text-2xl font-bold text-gray-800 bg-transparent"
                      step="0.01"
                    />

                    <button
                      onClick={() => setQuantity(quantity + 1)}
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