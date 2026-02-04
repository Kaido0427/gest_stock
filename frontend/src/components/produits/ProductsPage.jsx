import React, { useState } from "react";
import { Plus, Edit, Trash2, Package, Eye, Tag, Store } from "lucide-react";
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
    if (!confirm("Voulez-vous vraiment supprimer ce produit et toutes ses variantes ?")) return;

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

  // Fonction pour calculer le prix minimum parmi les variantes
  const getMinPrice = (variants) => {
    if (!variants || variants.length === 0) return 0;
    return Math.min(...variants.map((v) => v.price));
  };

  // Fonction pour calculer le prix maximum parmi les variantes
  const getMaxPrice = (variants) => {
    if (!variants || variants.length === 0) return 0;
    return Math.max(...variants.map((v) => v.price));
  };

  // Fonction pour obtenir le stock total (somme des stocks de toutes les variantes)
  const getStockTotal = (product) => {
    if (!product.variants || product.variants.length === 0) return 0;
    return product.variants.reduce((total, variant) => total + variant.stock, 0);
  };

  // Fonction pour obtenir le nombre de variantes avec stock faible (<5)
  const getLowStockCount = (product) => {
    if (!product.variants) return 0;
    return product.variants.filter(v => v.stock < 5).length;
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
            {products.length} produit{products.length > 1 ? "s" : ""} •
            {products.reduce((total, product) => total + (product.variants?.length || 0), 0)} variante{products.reduce((total, product) => total + (product.variants?.length || 0), 0) > 1 ? "s" : ""}
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
          <div className="text-sm text-gray-600">Variantes total</div>
          <div className="text-2xl font-bold text-purple-600">
            {products.reduce((total, product) => total + (product.variants?.length || 0), 0)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Stock total global</div>
          <div className="text-2xl font-bold text-green-600">
            {products.reduce((total, product) => total + getStockTotal(product), 0)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-600">Variantes faible stock</div>
          <div className="text-2xl font-bold text-amber-600">
            {products.reduce((total, product) => total + getLowStockCount(product), 0)}
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
                  Variantes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Gamme de prix
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stock total
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
                    colSpan="8"
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
                    const stockTotal = getStockTotal(product);
                    const lowStockCount = getLowStockCount(product);
                    const minPrice = getMinPrice(product.variants);
                    const maxPrice = getMaxPrice(product.variants);

                    return (
                      <motion.tr
                        key={product._id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
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

                        {/* ✅ NOUVELLE COLONNE BOUTIQUE */}
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

                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {product.category || "Non défini"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-purple-500" />
                            <span className="text-gray-900 font-medium">
                              {product.variants?.length || 0}
                            </span>
                            <span className="text-gray-500 text-sm">
                              variante{product.variants?.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          {product.variants && product.variants.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {product.variants.slice(0, 2).map(v => v.name).join(', ')}
                              {product.variants.length > 2 && '...'}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {product.variants?.length > 0 ? (
                            <div className="space-y-1">
                              <div className="font-semibold text-green-700">
                                {minPrice === maxPrice
                                  ? `${minPrice.toLocaleString()} FCFA`
                                  : `${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} FCFA`
                                }
                              </div>
                              {product.variants.length === 1 ? (
                                <div className="text-xs text-gray-500">1 prix unique</div>
                              ) : (
                                <div className="text-xs text-gray-500">{product.variants.length} prix différents</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Non défini</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span
                              className={`px-3 py-1 text-sm font-medium rounded-full inline-block ${stockTotal === 0
                                ? "bg-red-100 text-red-800"
                                : stockTotal < 10
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-green-100 text-green-800"
                                }`}
                            >
                              {stockTotal} pièce(s)
                            </span>
                            {product.variants && product.variants.length > 1 && (
                              <div className="text-xs text-gray-500">
                                Sur {product.variants.length} variante{product.variants.length > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            {stockTotal === 0 ? (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                                Épuisé
                              </span>
                            ) : lowStockCount > 0 ? (
                              <div>
                                <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                                  Stock faible
                                </span>
                                <div className="text-xs text-amber-600 mt-1">
                                  {lowStockCount} variante{lowStockCount > 1 ? 's' : ''}
                                </div>
                              </div>
                            ) : (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                En stock
                              </span>
                            )}
                          </div>
                        </td>

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