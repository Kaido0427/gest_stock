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

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];

app.use(
  "*",
  cors({
    origin: (origin) => {
      // En dev : accepter localhost
      if (!origin) return allowedOrigins[0];
      if (allowedOrigins.includes(origin)) return origin;
      return null; // bloqué
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.route("/auth", authRoutes);
app.route("/account", accountRoutes);
app.route("/admin", adminRoutes);
app.route("/boutiques", boutiqueRouter);
app.route("/produits", produitRoutes);
app.route("/ventes", venteRoutes);

// ─── Seed — disponible uniquement hors production ─────────────────────────────
// En prod, protégée par SEED_SECRET. Commenter après le premier seed.
if (process.env.NODE_ENV !== "production") {
  app.route("/seed", seedRoutes);
} else {
  // En prod : route accessible mais protégée par SEED_SECRET uniquement
  app.route("/seed", seedRoutes);
  // ↑ On la garde pour pouvoir seeder au premier déploiement.
  //   Une fois super-admin + plans créés, tu peux commenter cette ligne.
}

app.get("/", (c) => c.json({ status: "OK", message: "GestStock API v2" }));

export default app;