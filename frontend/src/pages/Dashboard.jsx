import React, { useState } from "react";
import {
  Home,
  ShoppingCart,
  Package,
  BarChart3,
  TrendingUp,
  FileText,
  Settings,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

// Données mockées
const mockProducts = [
  {
    id: 1,
    name: "Riz 50kg",
    category: "Alimentaire",
    price: 25000,
    stock: 45,
    minStock: 20,
    supplier: "SOBEMAP",
  },
  {
    id: 2,
    name: "Huile 5L",
    category: "Alimentaire",
    price: 6500,
    stock: 12,
    minStock: 15,
    supplier: "SONAIM",
  },
  {
    id: 3,
    name: "Sucre 1kg",
    category: "Alimentaire",
    price: 750,
    stock: 89,
    minStock: 30,
    supplier: "SUCOBE",
  },
  {
    id: 4,
    name: "Savon Omo",
    category: "Entretien",
    price: 2500,
    stock: 34,
    minStock: 20,
    supplier: "Unilever",
  },
  {
    id: 5,
    name: "Lait Peak",
    category: "Alimentaire",
    price: 1200,
    stock: 56,
    minStock: 25,
    supplier: "Nestlé",
  },
];

const mockSales = [
  {
    id: 1,
    date: "2024-12-05 14:30",
    items: 3,
    total: 15000,
    customer: "Client A",
    payment: "Cash",
  },
  {
    id: 2,
    date: "2024-12-05 13:15",
    items: 5,
    total: 28500,
    customer: "Client B",
    payment: "Mobile Money",
  },
  {
    id: 3,
    date: "2024-12-05 11:20",
    items: 2,
    total: 8000,
    customer: "Client C",
    payment: "Cash",
  },
  {
    id: 4,
    date: "2024-12-05 10:05",
    items: 7,
    total: 42300,
    customer: "Client D",
    payment: "Carte",
  },
];

const mockStats = {
  today: { sales: 156000, transactions: 24, items: 87 },
  month: { sales: 3240000, transactions: 456, items: 1876 },
  year: { sales: 38880000, transactions: 5472, items: 22512 },
};

const App = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const menuItems = [
    { id: "dashboard", label: "Tableau de bord", icon: Home },
    { id: "sales", label: "Ventes / Caisse", icon: ShoppingCart },
    { id: "products", label: "Produits", icon: Package },
    { id: "stock", label: "Stock", icon: BarChart3 },
    { id: "supply", label: "Approvisionnement", icon: TrendingUp },
    { id: "reports", label: "Rapports", icon: FileText },
    { id: "settings", label: "Paramètres", icon: Settings },
  ];

  const DashboardPage = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Tableau de bord</h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm">Ventes du jour</p>
              <h3 className="text-3xl font-bold mt-2">
                {mockStats.today.sales.toLocaleString()} FCFA
              </h3>
              <p className="text-blue-100 text-sm mt-2">
                {mockStats.today.transactions} transactions
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-green-100 text-sm">Ventes du mois</p>
              <h3 className="text-3xl font-bold mt-2">
                {mockStats.month.sales.toLocaleString()} FCFA
              </h3>
              <p className="text-green-100 text-sm mt-2">
                {mockStats.month.transactions} transactions
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-purple-100 text-sm">Produits en stock</p>
              <h3 className="text-3xl font-bold mt-2">
                {mockProducts.reduce((sum, p) => sum + p.stock, 0)}
              </h3>
              <p className="text-purple-100 text-sm mt-2">
                {mockProducts.length} produits
              </p>
            </div>
            <Package className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Ventes récentes
          </h2>
          <div className="space-y-3">
            {mockSales.slice(0, 4).map((sale) => (
              <div
                key={sale.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-800">{sale.customer}</p>
                  <p className="text-sm text-gray-500">
                    {sale.date} • {sale.items} articles
                  </p>
                </div>
                <p className="font-bold text-green-600">
                  {sale.total.toLocaleString()} FCFA
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Alertes Stock
          </h2>
          <div className="space-y-3">
            {mockProducts
              .filter((p) => p.stock < p.minStock)
              .map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 bg-orange-50 border-l-4 border-orange-500 rounded"
                >
                  <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {product.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Stock: {product.stock} (Min: {product.minStock})
                    </p>
                  </div>
                </div>
              ))}
            {mockProducts
              .filter((p) => p.stock >= p.minStock)
              .slice(0, 1)
              .map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 bg-green-50 border-l-4 border-green-500 rounded"
                >
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {product.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Stock optimal: {product.stock}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const SalesPage = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">
        Caisse / Point de vente
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow">
          <div className="flex gap-4 mb-6">
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
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtrer
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {mockProducts
              .filter((p) =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((product) => (
                <div
                  key={product.id}
                  onClick={() => setCart([...cart, { ...product, qty: 1 }])}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-all hover:shadow-md"
                >
                  <div className="bg-gray-100 w-full h-24 rounded-lg mb-3 flex items-center justify-center">
                    <Package className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-1">
                    {product.name}
                  </h3>
                  <p className="text-blue-600 font-bold">
                    {product.price.toLocaleString()} FCFA
                  </p>
                  <p className="text-xs text-gray-500">
                    Stock: {product.stock}
                  </p>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Panier</h2>

          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p>Panier vide</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                {cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">Qté: {item.qty}</p>
                    </div>
                    <p className="font-bold text-sm">
                      {(item.price * item.qty).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">
                    {cart
                      .reduce((sum, item) => sum + item.price * item.qty, 0)
                      .toLocaleString()}{" "}
                    FCFA
                  </span>
                </div>
              </div>

              <button className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                Valider la vente
              </button>
              <button
                onClick={() => setCart([])}
                className="w-full mt-2 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Vider le panier
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const ProductsPage = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Gestion des produits
        </h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Nouveau produit
        </button>
      </div>

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
              {mockProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {product.price.toLocaleString()} FCFA
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        product.stock < product.minStock
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {product.supplier}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const ReportsPage = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Rapports</h1>
        <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
          <Download className="w-4 h-4" />
          Exporter PDF
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-blue-500 bg-blue-50 rounded-lg transition-colors">
            <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="font-semibold text-gray-800">Aujourd'hui</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {mockStats.today.sales.toLocaleString()} FCFA
            </p>
          </button>
          <button className="p-4 border-2 border-gray-200 hover:border-blue-500 rounded-lg transition-colors">
            <Calendar className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <p className="font-semibold text-gray-800">Ce mois</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {mockStats.month.sales.toLocaleString()} FCFA
            </p>
          </button>
          <button className="p-4 border-2 border-gray-200 hover:border-blue-500 rounded-lg transition-colors">
            <Calendar className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <p className="font-semibold text-gray-800">Cette année</p>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {mockStats.year.sales.toLocaleString()} FCFA
            </p>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Ventes par jour
          </h2>
          <div className="h-64 bg-gradient-to-t from-blue-50 to-transparent rounded-lg flex items-end justify-around p-4">
            {[65, 80, 45, 90, 70, 85, 95].map((height, i) => (
              <div
                key={i}
                className="bg-blue-500 w-12 rounded-t transition-all hover:bg-blue-600"
                style={{ height: `${height}%` }}
              ></div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Top produits</h2>
          <div className="space-y-3">
            {mockProducts.slice(0, 5).map((product, i) => (
              <div key={product.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{product.name}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${90 - i * 15}%` }}
                    ></div>
                  </div>
                </div>
                <p className="font-bold text-gray-600">{150 - i * 20} ventes</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const StockPage = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Gestion du Stock</h1>
      <div className="bg-white p-12 rounded-xl shadow text-center">
        <BarChart3 className="w-24 h-24 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Vue temps réel du stock
        </h2>
        <p className="text-gray-600">
          Interface de suivi des mouvements et alertes de stock
        </p>
      </div>
    </div>
  );

  const SupplyPage = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Approvisionnement</h1>
      <div className="bg-white p-12 rounded-xl shadow text-center">
        <TrendingUp className="w-24 h-24 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Commandes fournisseurs
        </h2>
        <p className="text-gray-600">
          Gestion des approvisionnements et commandes
        </p>
      </div>
    </div>
  );

  const SettingsPage = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Paramètres</h1>
      <div className="bg-white p-12 rounded-xl shadow text-center">
        <Settings className="w-24 h-24 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Configuration</h2>
        <p className="text-gray-600">
          Paramètres de la boutique et préférences
        </p>
      </div>
    </div>
  );

  const pages = {
    dashboard: <DashboardPage />,
    sales: <SalesPage />,
    products: <ProductsPage />,
    stock: <StockPage />,
    supply: <SupplyPage />,
    reports: <ReportsPage />,
    settings: <SettingsPage />,
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white shadow-lg flex-shrink-0">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-blue-600">Ma Boutique</h1>
          <p className="text-sm text-gray-500">Gestion complète</p>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPage === item.id
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-8">{pages[currentPage]}</div>
      </div>
    </div>
  );
};

export default App;
