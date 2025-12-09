import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import DashboardPage from "../components/DashboardPage";
import SalesPage from "../components/SalesPage";
import ProductsPage from "../components/ProductsPage";
import ReportsPage from "../components/ReportsPage";
import SettingsPage from "../components/SettingsPage";
import Login from "./Login";

const Dashboard = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [cart, setCart] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // Données à connecter avec votre backend
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({
    today: { sales: 0, transactions: 0, items: 0 },
    month: { sales: 0, transactions: 0, items: 0 },
    year: { sales: 0, transactions: 0, items: 0 },
  });

// Fonction appelée après logout
  const handleLogout = () => {
    // vider token côté frontend si stocké
    localStorage.removeItem("token"); // ou sessionStorage selon ton code
    setIsLoggedIn(false); // met à jour l'état pour rediriger vers login
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
  return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
}


  return (
    <div className="flex h-screen bg-gray-100">
      {/* Passe handleLogout au Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onLogout={handleLogout}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8">{pages[currentPage]}</div>
      </div>
    </div>
  );
};

export default Dashboard;
