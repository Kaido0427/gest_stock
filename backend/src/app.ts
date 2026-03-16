import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRoutes } from "./routes/auth.route";
import { accountRoutes } from "./routes/account.route";
import { adminRoutes } from "./routes/admin.route";
import { boutiqueRouter } from "./routes/boutique.routes";
import produitRoutes from "./routes/produit.route";
import venteRoutes from "./routes/vente.routes";
import { seedRoutes } from "./routes/seed.route";
import type { AppEnv } from "./types/app.type";

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

app.onError((err, c) => {
  console.error("❌ ERREUR ROUTE:", err.message, err.stack);
  return c.json({ error: err.message, stack: err.stack }, 500);
});

export default app;