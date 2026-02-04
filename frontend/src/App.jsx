// App.jsx - MODIFIÉ
import React, { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/Login";
import { getCurrentUser, login, logout } from "./services/auth";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      const currentUser = await getCurrentUser();

      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  // ✅ handleLogin gère TOUT le processus
  const handleLogin = async (email, password) => {
    const result = await login(email, password);

    if (result.error) {
      return result; // ✅ Retourner l'erreur au LoginPage
    }

    // ✅ Récupérer les infos utilisateur
    const currentUser = await getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setIsAuthenticated(true);
    }

    return result; // ✅ Retourner le succès
  };

  const handleLogout = async () => {
    await logout(); // ✅ Appeler le service logout
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <>
      {isAuthenticated ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </>
  );
};

export default App;