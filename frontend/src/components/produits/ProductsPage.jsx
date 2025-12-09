import React, { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductModal from "./ProductModal";
import { deleteProduit } from "../../services/product";

const ProductsPage = ({ products }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);

  const handleEdit = (product) => {
    setActiveProduct(product);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setActiveProduct(null);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer ce produit ?")) return;

    const res = await deleteProduit(id);

    if (res.error) alert(res.error);
    else alert("Produit supprimé");

    // Ici tu devras recharger la liste depuis le parent
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
                  Prix
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fournisseur
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
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    Aucun produit disponible
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {products.map((product) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {product.name}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {product.category || "-"}
                      </td>

                      <td className="px-6 py-4 text-gray-900">
                        {product.price.toLocaleString()} FCFA
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            product.stock < (product.minStock || 0)
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {product.supplier || "-"}
                      </td>

                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          <Edit className="w-4 h-4" />
                          Modifier
                        </button>

                        <button
                          onClick={() => handleDelete(product.id)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL : AJOUT / EDITION */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        product={activeProduct}
      />
    </div>
  );
};

export default ProductsPage;
