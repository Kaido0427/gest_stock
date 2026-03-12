import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware";
import { subscriptionGuard } from "../middlewares/subscription.guard";
import { planFeatureGuard } from "../middlewares/plan.guard";
import { managerGuard } from "../middlewares/admin.guard";
import {
  createProduit,
  getProduit,
  getAllProduits,
  updateProduit,
  deleteProduit,
  vendreProduit,
  getAlertesStock,
  transfertStockBoutiques,
  approvisionnerProduit,
} from "../controllers/produit.controller";
import type { AppEnv } from "../types/app.type";

const produitRoutes = new Hono<AppEnv>();

produitRoutes.use("*", authMiddleware);
produitRoutes.use("*", subscriptionGuard);

produitRoutes.get("/alertes-stock", getAlertesStock);
produitRoutes.post(
  "/transfert-stock",
  planFeatureGuard("transfertInterBoutiques"),
  transfertStockBoutiques
);

produitRoutes.post("/", managerGuard, createProduit);
produitRoutes.get("/", getAllProduits);
produitRoutes.get("/:id", getProduit);
produitRoutes.put("/:id", managerGuard, updateProduit);
produitRoutes.delete("/:id", managerGuard, deleteProduit);
produitRoutes.post("/:id/vendre", vendreProduit);
produitRoutes.post("/:id/approvisionner", managerGuard, approvisionnerProduit);

export default produitRoutes;