//../backend/src/routes/auth.route.ts
import { Hono } from "hono";
import { AuthController } from "../controllers/auth.controller.js";
import { deleteCookie } from "hono/cookie";

export const authRoutes = new Hono();

authRoutes.post("/register", (c) => AuthController.register(c));
authRoutes.post("/login", (c) => AuthController.login(c));
authRoutes.post("/logout", async (c) => {
  console.log("🔒 Déconnexion demandée");
  
  // Récupère le token depuis l'en-tête Authorization
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  
  if (!token) {
    return c.json({ error: "Token manquant" }, 401);
  }
  
  return c.json({ message: "Déconnexion réussie" });
});