import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminGuard } from "../middlewares/admin.guard";
import {
    getAllTenants,
    getTenant,
    setTenantStatus,
    setTenantPlan,
    getAdminStats,
} from "../controllers/admin.controller";
import {
    getPlans,
    createPlan,
    updatePlan,
    deletePlan,
    togglePlan,
    getPlanRequests,
    processPlanRequest,
} from "../controllers/adminPlans.controller";
import {
    getAllPayments,
    recordManualPayment,
    cancelSubscription,
} from "../controllers/adminPayments.controller";
import type { AppEnv } from "../types/app.type";

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