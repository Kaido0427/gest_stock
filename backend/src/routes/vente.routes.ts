import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { subscriptionGuard } from "../middlewares/subscription.guard.js";
import { planFeatureGuard } from "../middlewares/plan.guard.js";
import {
    validerVente,
    getHistoriqueVentes,
    getStatistiquesVentes,
    getVenteById,
} from "../controllers/vente.controller.js";
import type { AppEnv } from "../types/app.type.js";

const venteRoutes = new Hono<AppEnv>();

venteRoutes.use("*", authMiddleware);
venteRoutes.use("*", subscriptionGuard);

venteRoutes.post("/", validerVente);
venteRoutes.get("/", getHistoriqueVentes);

// ⚠️ /stats DOIT être avant /:id, sinon Hono matche "stats" comme un id
venteRoutes.get("/stats", planFeatureGuard("statsAvancees"), getStatistiquesVentes);
venteRoutes.get("/:id", getVenteById);

export default venteRoutes;