import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { subscriptionGuard } from "../middlewares/subscription.guard.js";
import { ownerGuard, managerGuard } from "../middlewares/admin.guard.js";
import { planQuotaGuard } from "../middlewares/plan.guard.js";
import { Boutique } from "../models/boutique.model.js";
import { User } from "../models/user.model.js";
import {
    getAccount, updateAccount, createBoutiqueAnnexe,
    updateBoutique, deleteBoutiqueAnnexe, inviterEmploye, toggleEmploye,
} from "../controllers/account.controller.js";
import {
    getAvailablePlans, requestPlanUpgrade, getMyPlanRequests,
} from "../controllers/planRequest.controller.js";
import type { AppEnv } from "../types/app.type.js";

export const accountRoutes = new Hono<AppEnv>();

// Auth obligatoire sur tout
accountRoutes.use("*", authMiddleware);

// ─── Routes accessibles même si abonnement expiré/trial ─────────────────────
// Le tenant doit pouvoir voir les plans et ses demandes même compte bloqué
accountRoutes.get("/plans", ownerGuard, getAvailablePlans);
accountRoutes.post("/plan-request", ownerGuard, requestPlanUpgrade);
accountRoutes.get("/plan-requests", ownerGuard, getMyPlanRequests);

// ─── Toutes les autres routes nécessitent un abonnement valide ───────────────
accountRoutes.use("*", subscriptionGuard);

accountRoutes.get("/", getAccount);
accountRoutes.put("/", ownerGuard, updateAccount);

// Boutiques annexes
accountRoutes.post(
    "/boutiques",
    ownerGuard,
    planQuotaGuard("boutiques", (tenantId) =>
        Boutique.countDocuments({ tenant_id: tenantId, isMain: false })
    ),
    createBoutiqueAnnexe
);
accountRoutes.put("/boutiques/:id", ownerGuard, updateBoutique);
accountRoutes.delete("/boutiques/:id", ownerGuard, deleteBoutiqueAnnexe);

// Employés
accountRoutes.post(
    "/employes",
    managerGuard,
    planQuotaGuard("employes", (tenantId) =>
        User.countDocuments({ tenant_id: tenantId, role: { $in: ["manager", "employe"] }, isActive: true })
    ),
    inviterEmploye
);
accountRoutes.patch("/employes/:id/toggle", ownerGuard, toggleEmploye);