import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Package, Eye, Store, Search, Filter, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductModal from "./ProductModal";
import ApprovisionnementModal from "./ApprovisionnementModal";
import ProductDetailModal from "./ProductDetailModal";
import { deleteProduit } from "../../services/product";
import { getAllBoutiques } from "../../services/boutique";

const ProductsPage = ({ products, onRefresh }) => {
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [isApprovisionnementModalOpen, setApprovisionnementModalOpen] = useState(false);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);

  // États pour la recherche et les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBoutique, setSelectedBoutique] = useState("");
  const [boutiques, setBoutiques] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Charger les boutiques au montage
  useEffect(() => {
    loadBoutiques();
  }, []);

  const loadBoutiques = async () => {
    const res = await getAllBoutiques();
    if (res.error) {
      console.error("Erreur chargement boutiques:", res.error);
    } else {
      setBoutiques(Array.isArray(res) ? res : res.boutiques || []);
    }
  };

  const handleEdit = (product) => {
    setActiveProduct(product);
    setProductModalOpen(true);
  };

  const handleAdd = () => {
    setActiveProduct(null);
    setProductModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer ce produit ?")) return;

    const res = await deleteProduit(id);

    if (res.error) {
      alert(res.error);
    } else {
      alert("Produit supprimé avec succès");
      onRefresh?.();
    }
  };

  const handleApprovisionner = (product) => {
    setActiveProduct(product);
    setApprovisionnementModalOpen(true);
  };

  const handleViewDetails = (product) => {
    setActiveProduct(product);
    setDetailModalOpen(true);
  };

  // Fonctions de statistiques
  const getStockTotal = (products) => {
    return products.reduce((total, product) => total + (product.stock || 0), 0);
  };

  const getLowStockCount = (products) => {
    return products.filter(p => p.stock < 10).length;
  };

  const getOutOfStockCount = (products) => {
    return products.filter(p => p.stock === 0).length;
  };

  // ✅ Filtrage des produits
  const filteredProducts = products.filter(product => {
    const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchBoutique = !selectedBoutique || product.boutique_id?._id === selectedBoutique;

    return matchSearch && matchBoutique;
  });

  // Réinitialiser les filtres
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedBoutique("");
  };

  const hasActiveFilters = searchTerm || selectedBoutique;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

        {/* HEADER - Mobile Friendly */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Gestion des produits
            </h1>
            <p className="text-slate-600 mt-1 text-sm sm:text-base">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? "s" : ""}
              {hasActiveFilters ? " trouvé" + (filteredProducts.length > 1 ? "s" : "") : " enregistré" + (filteredProducts.length > 1 ? "s" : "")}
            </p>
          </div>
          <button
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl active:scale-95 font-medium w-full sm:w-auto"
            onClick={handleAdd}
          >
            <Plus className="w-5 h-5" />
            <span>Nouveau produit</span>
          </button>
        </div>

        {/* BARRE DE RECHERCHE ET FILTRES - Mobile Optimized */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-4 space-y-3">
            {/* Recherche principale */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un produit, catégorie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-700 placeholder-slate-400"
              />
            </div>

            {/* Toggle filtres mobile */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 w-full sm:hidden bg-slate-100 text-slate-700 px-4 py-3 rounded-xl hover:bg-slate-200 transition-colors font-medium"
            >
              <Filter className="w-5 h-5" />
              <span>Filtres avancés</span>
              {hasActiveFilters && (
                <span className="ml-auto bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {(searchTerm ? 1 : 0) + (selectedBoutique ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Filtres - Visible sur desktop, collapsible sur mobile */}
            <div className={`${showFilters || window.innerWidth >= 640 ? 'flex' : 'hidden'} flex-col sm:flex-row gap-3`}>
              {/* Filtre par boutique */}
              <div className="flex-1">
                <select
                  value={selectedBoutique}
                  onChange={(e) => setSelectedBoutique(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-700 bg-white"
                >
                  <option value="">📍 Toutes les boutiques</option>
                  {boutiques.map(boutique => (
                    <option key={boutique._id} value={boutique._id}>
                      {boutique.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bouton réinitialiser */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium whitespace-nowrap"
                >
                  <X className="w-5 h-5" />
                  <span>Réinitialiser</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* STATISTIQUES RAPIDES - Mobile Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-4 rounded-2xl shadow-lg border border-blue-100"
          >
            <div className="text-xs sm:text-sm text-slate-600 font-medium mb-1">Total produits</div>
            <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {filteredProducts.length}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-4 rounded-2xl shadow-lg border border-green-100"
          >
            <div className="text-xs sm:text-sm text-slate-600 font-medium mb-1">Stock total</div>
            <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {getStockTotal(filteredProducts)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-4 rounded-2xl shadow-lg border border-amber-100"
          >
            <div className="text-xs sm:text-sm text-slate-600 font-medium mb-1">Stock faible</div>
            <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {getLowStockCount(filteredProducts)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-4 rounded-2xl shadow-lg border border-red-100"
          >
            <div className="text-xs sm:text-sm text-slate-600 font-medium mb-1">Épuisés</div>
            <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
              {getOutOfStockCount(filteredProducts)}
            </div>
          </motion.div>
        </div>

        {/* AFFICHAGE DES PRODUITS - Responsive Cards & Table */}
        {filteredProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center"
          >
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              {hasActiveFilters ? "Aucun produit trouvé" : "Aucun produit disponible"}
            </h3>
            <p className="text-slate-500 mb-6">
              {hasActiveFilters
                ? "Essayez de modifier vos critères de recherche"
                : "Commencez par créer votre premier produit"}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-200 transition-colors font-medium"
              >
                Réinitialiser les filtres
              </button>
            ) : (
              <button
                onClick={handleAdd}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-medium"
              >
                Créer un produit
              </button>
            )}
          </motion.div>
        ) : (
          <>
            {/* MOBILE: Cards View */}
            <div className="lg:hidden space-y-3">
              <AnimatePresence>
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      {/* En-tête produit */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-800 text-lg truncate">
                            {product.name}
                          </h3>
                          {product.description && (
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap ${product.stock === 0
                              ? "bg-red-100 text-red-700"
                              : product.stock < 10
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                            }`}
                        >
                          {product.stock} {product.unit || 'unité'}
                        </span>
                      </div>

                      {/* Info boutique et catégorie */}
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg flex-1 min-w-0">
                          <Store className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                          <span className="text-sm text-slate-700 font-medium truncate">
                            {product.boutique_id?.name || "Non définie"}
                          </span>
                        </div>
                        <span className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                          {product.category || "Non défini"}
                        </span>
                      </div>

                      {/* Prix */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-xl">
                        <div className="text-xs text-slate-600 mb-1">Prix unitaire</div>
                        <div className="text-xl font-bold text-green-700">
                          {product.basePrice?.toLocaleString()} FCFA
                        </div>
                        <div className="text-xs text-slate-500">
                          par {product.unit || 'unité'}
                        </div>
                      </div>

                      {/* Statut */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 font-medium">Statut:</span>
                        {product.stock === 0 ? (
                          <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                            Épuisé
                          </span>
                        ) : product.stock < 10 ? (
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                            Stock faible
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                            En stock
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                        <button
                          onClick={() => handleEdit(product)}
                          className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2.5 rounded-xl transition-colors font-medium text-sm"
                        >
                          <Edit className="w-4 h-4" />
                          Modifier
                        </button>
                        <button
                          onClick={() => handleViewDetails(product)}
                          className="flex items-center justify-center gap-2 text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-2.5 rounded-xl transition-colors font-medium text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Détails
                        </button>
                        <button
                          onClick={() => handleApprovisionner(product)}
                          className="flex items-center justify-center gap-2 text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-2.5 rounded-xl transition-colors font-medium text-sm"
                        >
                          <Package className="w-4 h-4" />
                          Stock
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="flex items-center justify-center gap-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2.5 rounded-xl transition-colors font-medium text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* DESKTOP: Table View */}
            <div className="hidden lg:block bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Produit
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Boutique
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Catégorie
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Prix unitaire
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    <AnimatePresence>
                      {filteredProducts.map((product) => (
                        <motion.tr
                          key={product._id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200"
                        >
                          {/* PRODUIT */}
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">
                              {product.name}
                            </div>
                            {product.description && (
                              <div className="text-sm text-slate-500 mt-1 line-clamp-1">
                                {product.description}
                              </div>
                            )}
                          </td>

                          {/* BOUTIQUE */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Store className="w-4 h-4 text-indigo-500" />
                              <div>
                                <div className="font-medium text-slate-800">
                                  {product.boutique_id?.name || "Non définie"}
                                </div>
                                {product.boutique_id?.address && (
                                  <div className="text-xs text-slate-500">
                                    {product.boutique_id.address}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* CATÉGORIE */}
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                              {product.category || "Non défini"}
                            </span>
                          </td>

                          {/* PRIX UNITAIRE */}
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="font-bold text-green-700 text-lg">
                                {product.basePrice?.toLocaleString()} FCFA
                              </div>
                              <div className="text-xs text-slate-500">
                                par {product.unit || 'unité'}
                              </div>
                            </div>
                          </td>

                          {/* STOCK */}
                          <td className="px-6 py-4">
                            <span
                              className={`px-4 py-2 text-sm font-bold rounded-xl inline-block ${product.stock === 0
                                  ? "bg-red-100 text-red-800"
                                  : product.stock < 10
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                            >
                              {product.stock} {product.unit || 'unité'}
                            </span>
                          </td>

                          {/* STATUT */}
                          <td className="px-6 py-4">
                            {product.stock === 0 ? (
                              <span className="px-3 py-1.5 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                                Épuisé
                              </span>
                            ) : product.stock < 10 ? (
                              <span className="px-3 py-1.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                                Stock faible
                              </span>
                            ) : (
                              <span className="px-3 py-1.5 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                                En stock
                              </span>
                            )}
                          </td>

                          {/* ACTIONS */}
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-2">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEdit(product)}
                                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex-1 justify-center"
                                  title="Modifier"
                                >
                                  <Edit className="w-4 h-4" />
                                  Modifier
                                </button>

                                <button
                                  onClick={() => handleViewDetails(product)}
                                  className="flex items-center gap-1 text-purple-600 hover:text-purple-800 text-sm font-medium px-3 py-1.5 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors flex-1 justify-center"
                                  title="Voir les détails"
                                >
                                  <Eye className="w-4 h-4" />
                                  Détails
                                </button>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApprovisionner(product)}
                                  className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm font-medium px-3 py-1.5 bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex-1 justify-center"
                                  title="Approvisionner"
                                >
                                  <Package className="w-4 h-4" />
                                  Stock
                                </button>

                                <button
                                  onClick={() => handleDelete(product._id)}
                                  className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1.5 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex-1 justify-center"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Suppr.
                                </button>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODALS */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setProductModalOpen(false);
          setActiveProduct(null);
          onRefresh?.();
        }}
        product={activeProduct}
      />

      <ApprovisionnementModal
        isOpen={isApprovisionnementModalOpen}
        onClose={() => {
          setApprovisionnementModalOpen(false);
          setActiveProduct(null);
          onRefresh?.();
        }}
        product={activeProduct}
      />

      <ProductDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setDetailModalModal(false)}
        product={activeProduct}
      />
    </div>
  );
};

export default ProductsPage;