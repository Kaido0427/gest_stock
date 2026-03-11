import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { subscriptionGuard } from "../middlewares/subscription.guard.js";
import { ownerGuard, managerGuard } from "../middlewares/admin.guard.js";
import { planQuotaGuard } from "../middlewares/plan.guard.js";
import { Boutique } from "../models/boutique.model.js";
import { User } from "../models/user.model.js";
import {
    getAccount,
    updateAccount,
    createBoutiqueAnnexe,
    updateBoutique,
    deleteBoutiqueAnnexe,
    inviterEmploye,
    toggleEmploye,
    changerPlan,
} from "../controllers/account.controller.js";
import type { AppEnv } from "../types/app.type.js";

export const accountRoutes = new Hono<AppEnv>();

// Toutes les routes nécessitent auth + subscription valide
accountRoutes.use("*", authMiddleware);
accountRoutes.use("*", subscriptionGuard);

// Infos compte
accountRoutes.get("/", getAccount);
accountRoutes.put("/", ownerGuard, updateAccount);

// Boutiques
accountRoutes.post(
    "/boutiques",
    ownerGuard,
    planQuotaGuard("boutiques", (tenantId) => Boutique.countDocuments({ tenant_id: tenantId })),
    createBoutiqueAnnexe
);
accountRoutes.put("/boutiques/:id", ownerGuard, updateBoutique);
accountRoutes.delete("/boutiques/:id", ownerGuard, deleteBoutiqueAnnexe);

// Employés
accountRoutes.post(
    "/employes",
    managerGuard,
    planQuotaGuard("employes", (tenantId) =>
        User.countDocuments({ tenant_id: tenantId, role: { $ne: "owner" } })
    ),
    inviterEmploye
);
accountRoutes.patch("/employes/:id/toggle", ownerGuard, toggleEmploye);

// Abonnement
accountRoutes.post("/plan", ownerGuard, changerPlan);