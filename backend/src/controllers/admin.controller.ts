import type { Context } from "hono";
import { Tenant } from "../models/tenant.model.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { PLAN_PRICES, PLAN_LIMITS, type PlanType } from "../utils/plan.limits.js";
import type { AppEnv } from "../types/app.type.js";
import type { TenantStatus } from "../models/tenant.model.js";

// ─── Liste tous les tenants ──────────────────────────────────────────────────
export const getAllTenants = async (c: Context<AppEnv>) => {
    try {
        const { page = "1", limit = "20", status } = c.req.query();
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, parseInt(limit));
        const skip = (pageNum - 1) * limitNum;

        const filter: Record<string, unknown> = {};
        if (status) filter.status = status;

        const [tenants, total] = await Promise.all([
            Tenant.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
            Tenant.countDocuments(filter),
        ]);

        const tenantsWithStats = await Promise.all(
            tenants.map(async (t) => {
                const [userCount, subscription] = await Promise.all([
                    User.countDocuments({ tenant_id: t._id }),
                    Subscription.findOne({ tenant_id: t._id, status: "active" }).lean(),
                ]);
                return { ...t, userCount, activeSubscription: subscription };
            })
        );

        return c.json({
            tenants: tenantsWithStats,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Détail d'un tenant ──────────────────────────────────────────────────────
export const getTenant = async (c: Context<AppEnv>) => {
    try {
        const id = c.req.param("id");
        const [tenant, users, subscriptions] = await Promise.all([
            Tenant.findById(id).lean(),
            User.find({ tenant_id: id }).select("-password").lean(),
            Subscription.find({ tenant_id: id }).sort({ createdAt: -1 }).lean(),
        ]);

        if (!tenant) return c.json({ error: "Tenant introuvable" }, 404);

        return c.json({
            tenant,
            limits: PLAN_LIMITS[tenant.plan],
            users,
            subscriptions,
        });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Changer le statut d'un tenant ──────────────────────────────────────────
export const setTenantStatus = async (c: Context<AppEnv>) => {
    try {
        const id = c.req.param("id");
        const { status } = await c.req.json();

        const allowed: TenantStatus[] = ["active", "suspended", "expired", "trial"];
        if (!allowed.includes(status)) return c.json({ error: "Statut invalide" }, 400);

        const tenant = await Tenant.findByIdAndUpdate(id, { status }, { new: true }).lean();
        if (!tenant) return c.json({ error: "Tenant introuvable" }, 404);

        return c.json({ message: `Statut mis à jour: ${status}`, tenant });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Changer le plan d'un tenant (admin) — manuel, sans paiement requis ─────
export const setTenantPlan = async (c: Context<AppEnv>) => {
    try {
        const id = c.req.param("id");
        const { plan, paymentRef, durationMonths = 1, note } = await c.req.json();

        const validPlans: PlanType[] = ["starter", "business", "enterprise"];
        if (!validPlans.includes(plan)) return c.json({ error: "Plan invalide" }, 400);

        const tenant = await Tenant.findById(id).lean();
        if (!tenant) return c.json({ error: "Tenant introuvable" }, 404);

        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + Math.max(1, durationMonths));

        // Annuler les abonnements actifs
        await Subscription.updateMany(
            { tenant_id: id, status: "active" },
            { $set: { status: "cancelled" } }
        );

        // Créer le nouvel abonnement
        // paymentRef est optionnel — si absent, c'est une activation manuelle admin
        const subscription = await Subscription.create({
            tenant_id: id,
            plan,
            amount: PLAN_PRICES[plan as PlanType],
            currency: "XOF",
            startsAt: now,
            expiresAt,
            paymentRef: paymentRef || `ADMIN-MANUAL-${Date.now()}`,
            status: "active",
            ...(note && { note }), // champ libre pour raison admin
        });

        const updatedTenant = await Tenant.findByIdAndUpdate(
            id,
            { plan, status: "active" },
            { new: true }
        ).lean();

        return c.json({
            message: `Plan mis à jour vers ${plan} pour ${durationMonths} mois`,
            tenant: updatedTenant,
            subscription,
            limits: PLAN_LIMITS[plan as PlanType],
        });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Statistiques globales (dashboard super admin) ──────────────────────────
export const getAdminStats = async (c: Context<AppEnv>) => {
    try {
        const [
            totalTenants,
            activeTenants,
            trialTenants,
            suspendedTenants,
            expiredTenants,
            totalUsers,
            activeSubscriptions,
        ] = await Promise.all([
            Tenant.countDocuments(),
            Tenant.countDocuments({ status: "active" }),
            Tenant.countDocuments({ status: "trial" }),
            Tenant.countDocuments({ status: "suspended" }),
            Tenant.countDocuments({ status: "expired" }),
            User.countDocuments({ role: { $ne: "super_admin" } }),
            Subscription.find({ status: "active" }).lean(),
        ]);

        const mrr = activeSubscriptions.reduce((sum, s) => sum + s.amount, 0);

        const planDistribution = await Tenant.aggregate([
            { $group: { _id: "$plan", count: { $sum: 1 } } },
        ]);

        // Nouveaux tenants ce mois-ci
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const newTenantsThisMonth = await Tenant.countDocuments({
            createdAt: { $gte: startOfMonth },
        });

        return c.json({
            tenants: {
                total: totalTenants,
                active: activeTenants,
                trial: trialTenants,
                suspended: suspendedTenants,
                expired: expiredTenants,
                newThisMonth: newTenantsThisMonth,
            },
            users: totalUsers,
            mrr,
            currency: "XOF",
            planDistribution,
        });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};