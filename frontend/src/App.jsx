import React, { useState } from "react";
import { useMe, useLogout } from "./hooks/useAuth";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
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

// Token de réinitialisation présent dans l'URL (lien reçu par email)
const getResetToken = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  return token && window.location.pathname.includes("reset-password") ? token : null;
};

const App = () => {
  const { data: user, isLoading } = useMe();
  const { mutate: logout } = useLogout();

  // Le super_admin arrive directement sur "admin", les autres sur "dashboard"
  const getDefaultPage = (u) => (u?.role === "super_admin" ? "admin" : "dashboard");
  const [currentPage, setCurrentPage] = useState(null);
  const [authView, setAuthView] = useState("login");
  const [resetToken, setResetToken] = useState(getResetToken);

  // Page de réinitialisation : prioritaire si l'URL contient un token (même connecté)
  if (resetToken) {
    const finishReset = () => {
      window.history.replaceState({}, "", "/");
      setResetToken(null);
      setAuthView("login");
    };
    return <ResetPasswordPage token={resetToken} onDone={finishReset} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f5f6fa]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900" />
      </div>
    );
  }

  if (!user) {
    if (authView === "register") {
      return <RegisterPage onSwitchToLogin={() => setAuthView("login")} />;
    }
    if (authView === "forgot") {
      return <ForgotPasswordPage onBackToLogin={() => setAuthView("login")} />;
    }
    return (
      <LoginPage
        onSwitchToRegister={() => setAuthView("register")}
        onSwitchToForgot={() => setAuthView("forgot")}
      />
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
