// pages/Dashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { Menu, ArrowUp } from "lucide-react";
import Sidebar from "../components/Sidebar";
import DashboardPage from "../components/DashboardPage";
import SalesPage from "../components/ventes/SalesPage";
import ProductsPage from "../components/produits/ProductsPage";
import ReportsPage from "../components/ReportsPage";
import SettingsPage from "../components/SettingsPage";
import Login from "./Login";
import { getProduits } from "../services/product";
import { getCurrentUser } from "../services/auth";

const Dashboard = () => {
  // States
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [cart, setCart] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({
    today: { sales: 0, transactions: 0, items: 0 },
    month: { sales: 0, transactions: 0, items: 0 },
    year: { sales: 0, transactions: 0, items: 0 },
  });

  // Ref & scroll top
  const scrollRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Charger les produits
  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProduits();
      if (!data.error) setProducts(data);
      else console.error("Erreur lors du chargement des produits:", data.error);
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
    } finally {
      setLoading(false);
    }
  };

  // Init user + produits
  useEffect(() => {
    const init = async () => {
      await loadProducts();
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error("Erreur récupération utilisateur:", err);
        setIsLoggedIn(false);
      }
    };
    init();
  }, []);

  // Scroll listener
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => setShowScrollTop(el.scrollTop > 300);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Refresh produits
  const handleRefreshProducts = async () => {
    await loadProducts();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  // Pages
  const pages = {
    dashboard: (
      <DashboardPage
        products={products}
        sales={sales}
        stats={stats}
        onRefreshProducts={handleRefreshProducts}
      />
    ),
    sales: (
      <SalesPage
        products={products}
        cart={cart}
        setCart={setCart}
        onRefreshProducts={handleRefreshProducts}
      />
    ),
    products: (
      <ProductsPage
        products={products}
        onRefresh={handleRefreshProducts}
        loading={loading}
      />
    ),
    reports: <ReportsPage stats={stats} products={products} sales={sales} />,
    settings: <SettingsPage />,
  };

  if (!isLoggedIn) return <Login onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        role={user?.role || "employe"}
        boutiqueName={user?.boutique?.name}
      />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header mobile */}
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

        {/* Contenu scrollable */}
        <div ref={scrollRef} className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {loading && currentPage === "products" ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Chargement des produits...</p>
                </div>
              </div>
            ) : (
              pages[currentPage]
            )}
          </div>
        </div>
      </div>

      {/* Bouton flottant scroll top */}
      {showScrollTop && (
        <button
          onClick={() =>
            scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })
          }
          className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition flex items-center justify-center"
          aria-label="Remonter en haut"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default Dashboard;
