// App.jsx - MODIFIÉ
import React, { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/Login";
import { getCurrentUser, login, logout } from "./services/auth";

const App = () => {
  // 🔍 TEST DE LA VARIABLE D'ENVIRONNEMENT
  console.log('API_URL:', import.meta.env.VITE_API_URL);
  console.log('Toutes les env:', import.meta.env);
  
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

  const handleLogin = async (email, password) => {
    const result = await login(email, password);

    if (result.error) {
      return result;
    }

    const currentUser = await getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setIsAuthenticated(true);
    }

    return result;
  };

  const handleLogout = async () => {
    await logout();
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