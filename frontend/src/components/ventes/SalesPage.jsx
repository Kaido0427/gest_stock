// pages/SalesPage.jsx
import React, { useState } from "react";
import {
  Search, Package, ShoppingCart,
  Receipt, Plus, Minus, X, Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { vendreProduit } from "../../services/sale";
import VariantSelector from "../../components/ventes/VariantSelector";
import CartItem from "../../components/ventes/CartItem";

const SalesPage = ({ products,onRefreshProducts }) => {
  // États
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  // Catégories uniques
  const categories = ["Tous", ...new Set(products.map(p => p.category).filter(Boolean))];

  // Produits filtrés
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Tous" || product.category === selectedCategory;
    const hasVariants = product.variants && product.variants.length > 0;
    return matchesSearch && matchesCategory && hasVariants;
  });

  // Ajouter au panier
  const handleAddToCart = () => {
    if (!selectedVariant || quantity <= 0) {
      alert("Veuillez sélectionner une variante et une quantité");
      return;
    }

    const cartItem = {
      id: `${selectedProduct._id}-${selectedVariant._id}`,
      productId: selectedProduct._id,
      variantId: selectedVariant._id,
      productName: selectedProduct.name,
      variantName: selectedVariant.name,
      price: selectedVariant.price,
      quantity: quantity,
      maxStock: selectedVariant.stock
    };

    // Vérifier si l'item existe déjà dans le panier
    const existingIndex = cart.findIndex(item => item.id === cartItem.id);

    if (existingIndex >= 0) {
      // Mettre à jour la quantité
      const newCart = [...cart];
      const newQuantity = newCart[existingIndex].quantity + quantity;

      if (newQuantity > selectedVariant.stock) {
        alert(`Quantité maximale dépassée. Stock disponible: ${selectedVariant.stock}`);
        return;
      }

      newCart[existingIndex].quantity = newQuantity;
      setCart(newCart);
    } else {
      // Ajouter un nouvel item
      setCart([...cart, cartItem]);
    }

    // Réinitialiser
    setSelectedVariant(null);
    setQuantity(1);
  };

  // Mettre à jour la quantité d'un item
  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    const item = cart.find(item => item.id === itemId);
    if (newQuantity > item.maxStock) {
      alert(`Quantité maximale: ${item.maxStock}`);
      return;
    }

    setCart(cart.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
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
    // 1) vérification stocks locale
    for (const item of cart) {
      const product = products.find(p => p._id === item.productId);
      const variant = product?.variants?.find(v => v._id && v._id.toString() === item.variantId);
      if (!variant) {
        alert(`Variante "${item.variantName}" introuvable`);
        setLoading(false);
        return;
      }
      if (variant.stock < item.quantity) {
        alert(`Stock insuffisant pour "${item.variantName}". Stock disponible: ${variant.stock}`);
        setLoading(false);
        return;
      }
    }

    // 2) envoi des ventes (log detailed)
    for (const item of cart) {
      console.log("[Checkout] vendreProduit ->", {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity
      });

      const result = await vendreProduit(item.productId, item.variantId, item.quantity);
      console.log("[Checkout] result vendreProduit:", result);

      // si venderProduit renvoie { error: '...' } -> on lance une exception pour aller au catch central
      if (result && result.error) {
        throw new Error(result.error || "Erreur inconnue serveur");
      }
    }

    // 3) récap et nettoyage
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    alert(`✅ Vente validée avec succès !\n\nArticles vendus: ${itemsCount}\nMontant total: ${totalAmount.toLocaleString()} FCFA\n\nLes stocks ont été mis à jour.`);
    setCart([]);
     if (onRefreshProducts) {
      await onRefreshProducts();
    }
  } catch (error) {
    // affichage plus utile — montre le message précis
    console.error("[Checkout] erreur complète:", error);
    alert("Erreur lors de la validation de la vente — détail: " + (error?.message || JSON.stringify(error)));
  } finally {
    setLoading(false);
  }
};


  // Calculer le total
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
                <button
                  onClick={() => setSelectedCategory("Tous")}
                  className={`px-4 py-2 whitespace-nowrap rounded-lg transition-colors ${selectedCategory === "Tous"
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Tous
                </button>
                {categories
                  .filter(cat => cat !== "Tous")
                  .map(category => (
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
                  ))
                }
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
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedProduct?._id === product._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                      onClick={() => {
                        setSelectedProduct(product);
                        setSelectedVariant(null);
                        setQuantity(1);
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-sm mb-1">
                            {product.name}
                          </h3>
                          {product.category && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                              {product.category}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">
                          {product.variants?.length || 0} variante{product.variants?.length > 1 ? 's' : ''}
                        </div>
                        {product.variants && product.variants.some(v => v.stock < 5) && (
                          <div className="text-xs text-amber-600">
                            ⚠ Certaines variantes ont un stock faible
                          </div>
                        )}
                      </div>
                    </motion.div>
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
                  onClick={() => {
                    setSelectedProduct(null);
                    setSelectedVariant(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Sélection de la variante */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sélectionner la variante
                  </label>
                  <VariantSelector
                    product={selectedProduct}
                    onSelectVariant={setSelectedVariant}
                    selectedVariant={selectedVariant}
                  />
                </div>

                {/* Sélection de la quantité */}
                {selectedVariant && (
                  <>
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

                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-800">{quantity}</div>
                          <div className="text-xs text-gray-500">
                            sur {selectedVariant.stock} disponibles
                          </div>
                        </div>

                        <button
                          onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}
                          disabled={quantity >= selectedVariant.stock}
                          className={`p-2 rounded-lg ${quantity >= selectedVariant.stock
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Total et bouton ajouter */}
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Total</span>
                        <span className="text-xl font-bold text-green-700">
                          {(selectedVariant.price * quantity).toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter au panier
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesPage;