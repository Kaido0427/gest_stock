import React, { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/Login";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Vérifier le token dans le localStorage au chargement
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <>{isAuthenticated ? <Dashboard /> : <LoginPage onLogin={handleLogin} />}</>
  );
};

export default App;
