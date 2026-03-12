import type { Context } from "hono";
import { Subscription } from "../models/subscription.model";
import { Tenant } from "../models/tenant.model";
import { Plan } from "../models/plan.model";
import { invalidatePlanCache } from "../utils/plan.cache";
import type { AppEnv } from "../types/app.type";

// ─── Historique de tous les paiements ────────────────────────────────────────
export const getAllPayments = async (c: Context<AppEnv>) => {
    try {
        const { page = "1", limit = "30", tenant_id, status, type } = c.req.query();
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, parseInt(limit));
        const skip = (pageNum - 1) * limitNum;

        const filter: Record<string, unknown> = {};
        if (tenant_id) filter.tenant_id = tenant_id;
        if (status) filter.status = status;

        // Filtrer par type : "manual" = paymentRef commence par "ADMIN-"
        if (type === "manual") {
            filter.paymentRef = { $regex: /^ADMIN-/ };
        } else if (type === "online") {
            filter.paymentRef = { $not: /^ADMIN-/ };
        }

        const [subscriptions, total] = await Promise.all([
            Subscription.find(filter)
                .populate("tenant_id", "name ownerEmail plan")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Subscription.countDocuments(filter),
        ]);

        // Enrichir avec le type de paiement
        const payments = subscriptions.map((s) => ({
            ...s,
            paymentType: s.paymentRef?.startsWith("ADMIN-") ? "manual" : "online",
        }));

        // Stats globales
        const totalRevenu = await Subscription.aggregate([
            { $match: { status: "active" } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);

        return c.json({
            payments,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
            stats: {
                mrr: totalRevenu[0]?.total ?? 0,
                currency: "XOF",
            },
        });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Enregistrer un paiement manuel ──────────────────────────────────────────
export const recordManualPayment = async (c: Context<AppEnv>) => {
    try {
        const {
            tenant_id,
            plan,
            amount,
            paymentRef,
            durationMonths = 1,
            note,
            paymentDate,
        } = await c.req.json();

        if (!tenant_id || !plan) {
            return c.json({ error: "tenant_id et plan sont requis" }, 400);
        }

        const tenant = await Tenant.findById(tenant_id).lean();
        if (!tenant) return c.json({ error: "Tenant introuvable" }, 404);

        const planDoc = await Plan.findOne({ name: plan }).lean();
        if (!planDoc) return c.json({ error: `Plan "${plan}" introuvable` }, 404);

        const finalAmount = amount ?? planDoc.price;
        const now = paymentDate ? new Date(paymentDate) : new Date();
        const expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + Math.max(1, durationMonths));

        // Annuler abonnements actifs
        await Subscription.updateMany(
            { tenant_id, status: "active" },
            { $set: { status: "cancelled" } }
        );

        const subscription = await Subscription.create({
            tenant_id,
            plan,
            amount: finalAmount,
            currency: planDoc.currency || "XOF",
            startsAt: now,
            expiresAt,
            paymentRef: paymentRef || `ADMIN-MANUAL-${Date.now()}`,
            status: "active",
        });

        await Tenant.findByIdAndUpdate(tenant_id, {
            plan,
            status: "active",
        });

        return c.json(
            {
                message: `Paiement manuel enregistré — plan ${plan} activé pour ${durationMonths} mois`,
                subscription,
                tenant: await Tenant.findById(tenant_id).lean(),
            },
            201
        );
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Annuler / expirer un abonnement ─────────────────────────────────────────
export const cancelSubscription = async (c: Context<AppEnv>) => {
    try {
        const id = c.req.param("id");
        const { reason } = await c.req.json().catch(() => ({ reason: undefined }));

        const sub = await Subscription.findById(id);
        if (!sub) return c.json({ error: "Abonnement introuvable" }, 404);

        sub.status = "cancelled";
        await sub.save();

        // Passer le tenant en expiré
        await Tenant.findByIdAndUpdate(sub.tenant_id, { status: "expired" });

        return c.json({ message: "Abonnement annulé", subscription: sub });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};