import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware";
import { subscriptionGuard } from "../middlewares/subscription.guard";
import { planFeatureGuard } from "../middlewares/plan.guard";
import {
    validerVente,
    getHistoriqueVentes,
    getStatistiquesVentes,
    getVenteById,
} from "../controllers/vente.controller";
import type { AppEnv } from "../types/app.type";

const venteRoutes = new Hono<AppEnv>();

venteRoutes.use("*", authMiddleware);
venteRoutes.use("*", subscriptionGuard);

venteRoutes.post("/", validerVente);
venteRoutes.get("/", getHistoriqueVentes);

// ⚠️ /stats DOIT être avant /:id, sinon Hono matche "stats" comme un id
venteRoutes.get("/stats", planFeatureGuard("statsAvancees"), getStatistiquesVentes);
venteRoutes.get("/:id", getVenteById);

export default venteRoutes;