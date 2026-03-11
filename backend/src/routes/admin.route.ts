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
import type { AppEnv } from "../types/app.type.js";

export const adminRoutes = new Hono<AppEnv>();

adminRoutes.use("*", authMiddleware);
adminRoutes.use("*", adminGuard);

adminRoutes.get("/stats", getAdminStats);
adminRoutes.get("/tenants", getAllTenants);
adminRoutes.get("/tenants/:id", getTenant);
adminRoutes.patch("/tenants/:id/status", setTenantStatus);
adminRoutes.patch("/tenants/:id/plan", setTenantPlan);