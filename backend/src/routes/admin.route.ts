import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminGuard } from "../middlewares/admin.guard.js";
import {
    getAllTenants,
    getTenant,
    setTenantStatus,
    setTenantPlan,
    getAdminStats,
} from "../controllers/admin.controller.js";
import {
    getPlans,
    createPlan,
    updatePlan,
    deletePlan,
    togglePlan,
    getPlanRequests,
    processPlanRequest,
} from "../controllers/adminPlans.controller.js";
import {
    getAllPayments,
    recordManualPayment,
    cancelSubscription,
} from "../controllers/adminPayments.controller.js";
import type { AppEnv } from "../types/app.type.js";

export const adminRoutes = new Hono<AppEnv>();

adminRoutes.use("*", authMiddleware);
adminRoutes.use("*", adminGuard);
    
// ─── Stats globales ──────────────────────────────────────────────────────────
adminRoutes.get("/stats", getAdminStats);

// ─── Tenants ─────────────────────────────────────────────────────────────────
adminRoutes.get("/tenants", getAllTenants);
adminRoutes.get("/tenants/:id", getTenant);
adminRoutes.patch("/tenants/:id/status", setTenantStatus);
adminRoutes.patch("/tenants/:id/plan", setTenantPlan);

// ─── Plans (CRUD dynamique) ───────────────────────────────────────────────────
adminRoutes.get("/plans", getPlans);
adminRoutes.post("/plans", createPlan);
adminRoutes.put("/plans/:id", updatePlan);
adminRoutes.delete("/plans/:id", deletePlan);
adminRoutes.patch("/plans/:id/toggle", togglePlan);

// ─── Demandes de changement de plan ──────────────────────────────────────────
adminRoutes.get("/plan-requests", getPlanRequests);
adminRoutes.patch("/plan-requests/:id", processPlanRequest);

// ─── Paiements ────────────────────────────────────────────────────────────────
adminRoutes.get("/payments", getAllPayments);
adminRoutes.post("/payments/manual", recordManualPayment);
adminRoutes.patch("/payments/:id/cancel", cancelSubscription);