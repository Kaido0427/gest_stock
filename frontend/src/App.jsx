import React, { useState } from "react";
import { useMe, useLogout } from "./hooks/useAuth";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProduitsPage from "./pages/ProductPage";
import VentesPage from "./pages/VentesPage";
import ComptePage from "./pages/ComptePage";
import AdminLayout from "./pages/admin/AdminLayout";

const PAGES = {
  dashboard: DashboardPage,
  produits: ProduitsPage,
  ventes: VentesPage,
  compte: ComptePage,
  admin: AdminLayout,
};

const App = () => {
  const { data: user, isLoading } = useMe();
  const { mutate: logout } = useLogout();

  // Le super_admin arrive directement sur "admin", les autres sur "dashboard"
  const getDefaultPage = (u) => (u?.role === "super_admin" ? "admin" : "dashboard");
  const [currentPage, setCurrentPage] = useState(null);
  const [authView, setAuthView] = useState("login");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f5f6fa]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900" />
      </div>
    );
  }

  if (!user) {
    return authView === "login" ? (
      <LoginPage onSwitchToRegister={() => setAuthView("register")} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setAuthView("login")} />
    );
  }

  const activePage = currentPage ?? getDefaultPage(user);
  const PageComponent = PAGES[activePage] || DashboardPage;

  return (
    <AppLayout
      user={user}
      onLogout={logout}
      currentPage={activePage}
      onPageChange={setCurrentPage}
    >
      <PageComponent />
    </AppLayout>
  );
};

export default App;