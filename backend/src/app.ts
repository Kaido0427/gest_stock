import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRoutes } from "./routes/auth.route.js";
import { accountRoutes } from "./routes/account.route.js";
import { adminRoutes } from "./routes/admin.route.js";
import { boutiqueRouter } from "./routes/boutique.routes.js";
import produitRoutes from "./routes/produit.route.js";
import venteRoutes from "./routes/vente.routes.js";
import { seedRoutes } from "./routes/seed.route.js";
import type { AppEnv } from "./types/app.type.js";

const app = new Hono<AppEnv>();

app.use(
    "*",
    cors({
        origin: "*",
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
    })
);

app.route("/auth", authRoutes);
app.route("/account", accountRoutes);
app.route("/admin", adminRoutes);
app.route("/boutiques", boutiqueRouter);
app.route("/produits", produitRoutes);
app.route("/ventes", venteRoutes);

// ⚠️ Route de seed — à désactiver après création du super admin en production
// Protégée par SEED_SECRET dans les variables d'environnement
app.route("/seed", seedRoutes);

app.get("/", (c) => c.json({ status: "OK", message: "GestStock API v2" }));

export default app;