import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { subscriptionGuard } from "../middlewares/subscription.guard.js";
import { managerGuard } from "../middlewares/admin.guard.js";
import { getAllBoutiques, getBoutique } from "../controllers/boutique.controller.js";
import type { AppEnv } from "../types/app.type.js";

export const boutiqueRouter = new Hono<AppEnv>();

boutiqueRouter.use("*", authMiddleware);
boutiqueRouter.use("*", subscriptionGuard);
boutiqueRouter.use("*", managerGuard);

boutiqueRouter.get("/", getAllBoutiques);
boutiqueRouter.get("/:id", getBoutique);