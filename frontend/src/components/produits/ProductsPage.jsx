import React, { useState } from "react";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductModal from "./ProductModal";
import ApprovisionnementModal from "./ApprovisionnementModal";
import { deleteProduit } from "../../services/product";

const ProductsPage = ({ products, onRefresh }) => {
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [isApprovisionnementModalOpen, setApprovisionnementModalOpen] =
    useState(false);
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
      alert("Produit supprimé");
      onRefresh?.();
    }
  };

  const handleApprovisionner = (product) => {
    setActiveProduct(product);
    setApprovisionnementModalOpen(true);
  };

  // Fonction pour calculer le prix minimum parmi les unités
  const getMinPrice = (units) => {
    if (!units || units.length === 0) return 0;
    return Math.min(...units.map((u) => u.price));
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Gestion des produits
        </h1>
        <button
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          onClick={handleAdd}
        >
          <Plus className="w-4 h-4" />
          Nouveau produit
        </button>
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
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Unité de base
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Prix à partir de
                </th>
                <th className="px6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stock (unité de base)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Unités disponibles
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
                    Aucun produit disponible
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {products.map((product) => (
                    <motion.tr
                      key={product._id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-sm text-gray-500 mt-1">
                            {product.description}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {product.category || "-"}
                      </td>

                      <td className="px-6 py-4 text-gray-900">
                        {product.baseUnit}
                      </td>

                      <td className="px-6 py-4 text-gray-900">
                        {product.units?.length > 0 ? (
                          <span className="font-semibold">
                            {getMinPrice(product.units).toLocaleString()} FCFA
                          </span>
                        ) : (
                          <span className="text-gray-400">Non défini</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-sm rounded-full ${
                            product.stockBase <= 0
                              ? "bg-red-100 text-red-800"
                              : product.stockBase < 10
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {product.stockBase} {product.baseUnit}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex flex-wrap gap-1">
                          {product.units?.map((unit, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {unit.name} ({unit.quantityPerUnit})
                            </span>
                          ))}
                          {(!product.units || product.units.length === 0) &&
                            "-"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 bg-blue-50 rounded hover:bg-blue-100"
                          >
                            <Edit className="w-4 h-4" />
                            Modifier
                          </button>

                          <button
                            onClick={() => handleApprovisionner(product)}
                            className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm font-medium px-3 py-1 bg-green-50 rounded hover:bg-green-100"
                          >
                            <Package className="w-4 h-4" />
                            Approvisionner
                          </button>

                          <button
                            onClick={() => handleDelete(product._id)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 bg-red-50 rounded hover:bg-red-100"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL : AJOUT / EDITION PRODUIT */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setProductModalOpen(false);
          onRefresh?.();
        }}
        product={activeProduct}
      />

      {/* MODAL : APPROVISIONNEMENT */}
      <ApprovisionnementModal
        isOpen={isApprovisionnementModalOpen}
        onClose={() => {
          setApprovisionnementModalOpen(false);
          onRefresh?.();
        }}
        product={activeProduct}
      />
    </div>
  );
};

export default ProductsPage;
