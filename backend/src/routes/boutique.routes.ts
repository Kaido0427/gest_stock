import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware";
import { subscriptionGuard } from "../middlewares/subscription.guard";
import { managerGuard } from "../middlewares/admin.guard";
import { getAllBoutiques, getBoutique } from "../controllers/boutique.controller";
import type { AppEnv } from "../types/app.type";

export const boutiqueRouter = new Hono<AppEnv>();

boutiqueRouter.use("*", authMiddleware);
boutiqueRouter.use("*", subscriptionGuard);
boutiqueRouter.use("*", managerGuard);

boutiqueRouter.get("/", getAllBoutiques);
boutiqueRouter.get("/:id", getBoutique);