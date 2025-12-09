import { Hono } from "hono";
import { AuthController } from "../controllers/auth.controller.js";
import { deleteCookie } from "hono/cookie";

export const authRoutes = new Hono();

authRoutes.post("/register", (c) => AuthController.register(c));
authRoutes.post("/login", (c) => AuthController.login(c));
authRoutes.post("/logout", (c) => {
    console.log("🔒 Déconnexion demandée"); // <--- log pour vérifier
    deleteCookie(c, "token"); // ton cookie JWT
    return c.json({ message: "Déconnexion réussie" });
});