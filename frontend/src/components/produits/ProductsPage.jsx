import React, { useState } from "react";
import { Plus, Edit, Trash2, Package, Eye, Store } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductModal from "./ProductModal";
import ApprovisionnementModal from "./ApprovisionnementModal";
import ProductDetailModal from "./ProductDetailModal";
import { deleteProduit } from "../../services/product";

const ProductsPage = ({ products, onRefresh }) => {
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [isApprovisionnementModalOpen, setApprovisionnementModalOpen] = useState(false);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);

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

  // ✅ Fonction pour obtenir le stock total (simplifié)
  const getStockTotal = (products) => {
    return products.reduce((total, product) => total + (product.stock || 0), 0);
  };

  // ✅ Fonction pour compter les produits avec stock faible
  const getLowStockCount = (products) => {
    return products.filter(p => p.stock < 10).length;
  };

  // ✅ Fonction pour compter les produits épuisés
  const getOutOfStockCount = (products) => {
    return products.filter(p => p.stock === 0).length;
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Gestion des produits
          </h1>
          <p className="text-gray-600 mt-1">
            {products.length} produit{products.length > 1 ? "s" : ""} enregistré{products.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          onClick={handleAdd}
        >
          <Plus className="w-4 h-4" />
          Nouveau produit
        </button>
      </div>

      {/* STATISTIQUES RAPIDES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Produits total</div>
          <div className="text-2xl font-bold text-blue-600">{products.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Stock total global</div>
          <div className="text-2xl font-bold text-green-600">
            {getStockTotal(products)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Stock faible (&lt;10)</div>
          <div className="text-2xl font-bold text-amber-600">
            {getLowStockCount(products)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Produits épuisés</div>
          <div className="text-2xl font-bold text-red-600">
            {getOutOfStockCount(products)}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Boutique
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Prix unitaire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-12 h-12 text-gray-300" />
                      <p>Aucun produit disponible</p>
                      <button
                        onClick={handleAdd}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Créer votre premier produit
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {products.map((product) => {
                    return (
                      <motion.tr
                        key={product._id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* PRODUIT */}
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {product.name}
                          </div>
                          {product.description && (
                            <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                              {product.description}
                            </div>
                          )}
                        </td>

                        {/* BOUTIQUE */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-indigo-500" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {product.boutique_id?.name || "Non définie"}
                              </div>
                              {product.boutique_id?.address && (
                                <div className="text-xs text-gray-500">
                                  {product.boutique_id.address}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* CATÉGORIE */}
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {product.category || "Non défini"}
                          </span>
                        </td>

                        {/* PRIX UNITAIRE */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="font-semibold text-green-700">
                              {product.basePrice?.toLocaleString()} FCFA
                            </div>
                            <div className="text-xs text-gray-500">
                              par {product.unit || 'unité'}
                            </div>
                          </div>
                        </td>

                        {/* STOCK */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span
                              className={`px-3 py-1 text-sm font-medium rounded-full inline-block ${product.stock === 0
                                  ? "bg-red-100 text-red-800"
                                  : product.stock < 10
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                            >
                              {product.stock} {product.unit || 'unité'}
                            </span>
                          </div>
                        </td>

                        {/* STATUT */}
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            {product.stock === 0 ? (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                                Épuisé
                              </span>
                            ) : product.stock < 10 ? (
                              <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                                Stock faible
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                En stock
                              </span>
                            )}
                          </div>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            {/* Ligne 1 : Modifier et Détails */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(product)}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 bg-blue-50 rounded hover:bg-blue-100 transition-colors flex-1 justify-center"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4" />
                                Modifier
                              </button>

                              <button
                                onClick={() => handleViewDetails(product)}
                                className="flex items-center gap-1 text-purple-600 hover:text-purple-800 text-sm font-medium px-3 py-1 bg-purple-50 rounded hover:bg-purple-100 transition-colors flex-1 justify-center"
                                title="Voir les détails"
                              >
                                <Eye className="w-4 h-4" />
                                Détails
                              </button>
                            </div>

                            {/* Ligne 2 : Approvisionner et Supprimer */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprovisionner(product)}
                                className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm font-medium px-3 py-1 bg-green-50 rounded hover:bg-green-100 transition-colors flex-1 justify-center"
                                title="Approvisionner"
                              >
                                <Package className="w-4 h-4" />
                                Stock
                              </button>

                              <button
                                onClick={() => handleDelete(product._id)}
                                className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 bg-red-50 rounded hover:bg-red-100 transition-colors flex-1 justify-center"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                                Suppr.
                              </button>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL : AJOUT / ÉDITION PRODUIT */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setProductModalOpen(false);
          setActiveProduct(null);
          onRefresh?.();
        }}
        product={activeProduct}
      />

      {/* MODAL : APPROVISIONNEMENT */}
      <ApprovisionnementModal
        isOpen={isApprovisionnementModalOpen}
        onClose={() => {
          setApprovisionnementModalOpen(false);
          setActiveProduct(null);
          onRefresh?.();
        }}
        product={activeProduct}
      />

      {/* MODAL : DÉTAILS DU PRODUIT */}
      <ProductDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        product={activeProduct}
      />
    </div>
  );
};

export default ProductsPage;