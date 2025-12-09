import React, { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "../components/Sidebar";
import DashboardPage from "../components/DashboardPage";
import SalesPage from "../components/SalesPage";
import ProductsPage from "../components/produits/ProductsPage";
import ReportsPage from "../components/ReportsPage";
import SettingsPage from "../components/SettingsPage";
import Login from "./Login";

const Dashboard = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [cart, setCart] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({
    today: { sales: 0, transactions: 0, items: 0 },
    month: { sales: 0, transactions: 0, items: 0 },
    year: { sales: 0, transactions: 0, items: 0 },
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  const pages = {
    dashboard: (
      <DashboardPage products={products} sales={sales} stats={stats} />
    ),
    sales: <SalesPage products={products} cart={cart} setCart={setCart} />,
    products: <ProductsPage products={products} />,
    reports: <ReportsPage stats={stats} products={products} />,
    settings: <SettingsPage />,
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header mobile avec bouton menu */}
        <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Ma Boutique</h1>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">{pages[currentPage]}</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;