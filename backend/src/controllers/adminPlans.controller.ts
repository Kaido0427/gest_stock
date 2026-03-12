import type { Context } from "hono";
import { Plan } from "../models/plan.model";
import { PlanRequest } from "../models/planRequest.model";
import { Tenant } from "../models/tenant.model";
import { Subscription } from "../models/subscription.model";
import { User } from "../models/user.model";
import { invalidateAllPlansCache, invalidatePlanCache } from "../utils/plan.cache";
import type { AppEnv } from "../types/app.type";

// ─── Liste tous les plans (actifs + inactifs pour l'admin) ───────────────────
export const getPlans = async (c: Context<AppEnv>) => {
    try {
        const plans = await Plan.find().sort({ sortOrder: 1 }).lean();
        return c.json({ plans });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Créer un plan ────────────────────────────────────────────────────────────
export const createPlan = async (c: Context<AppEnv>) => {
    try {
        const body = await c.req.json();
        const { name, label, price, limits, features, description, color, sortOrder, isActive, isDefault } = body;

        if (!name || !label || price === undefined) {
            return c.json({ error: "name, label et price sont requis" }, 400);
        }

        const exists = await Plan.findOne({ name: name.toLowerCase().trim() });
        if (exists) return c.json({ error: `Un plan "${name}" existe déjà` }, 409);

        // Si ce plan est marqué par défaut, retirer le défaut des autres
        if (isDefault) {
            await Plan.updateMany({}, { $set: { isDefault: false } });
        }

        const plan = await Plan.create({
            name: name.toLowerCase().trim(),
            label,
            price,
            limits: {
                boutiques: limits?.boutiques ?? 1,
                produits: limits?.produits ?? 100,
                employes: limits?.employes ?? 2,
                historiqueJours: limits?.historiqueJours ?? 30,
            },
            features: {
                transfertInterBoutiques: features?.transfertInterBoutiques ?? false,
                statsAvancees: features?.statsAvancees ?? false,
                export: features?.export ?? false,
                ...features, // features custom supplémentaires
            },
            description,
            color: color || "slate",
            sortOrder: sortOrder ?? 99,
            isActive: isActive ?? true,
            isDefault: isDefault ?? false,
        });

        invalidateAllPlansCache();
        return c.json({ message: "Plan créé", plan }, 201);
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Mettre à jour un plan ────────────────────────────────────────────────────
export const updatePlan = async (c: Context<AppEnv>) => {
    try {
        const id = c.req.param("id");
        const body = await c.req.json();

        // Si on met ce plan par défaut, retirer le défaut des autres
        if (body.isDefault === true) {
            await Plan.updateMany({ _id: { $ne: id } }, { $set: { isDefault: false } });
        }

        const plan = await Plan.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        ).lean();

        if (!plan) return c.json({ error: "Plan introuvable" }, 404);

        // Invalider le cache pour ce plan
        invalidatePlanCache(plan.name);
        invalidateAllPlansCache();

        return c.json({ message: "Plan mis à jour", plan });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Supprimer un plan ────────────────────────────────────────────────────────
export const deletePlan = async (c: Context<AppEnv>) => {
    try {
        const id = c.req.param("id");

        // Vérifier qu'aucun tenant actif n'utilise ce plan
        const plan = await Plan.findById(id).lean();
        if (!plan) return c.json({ error: "Plan introuvable" }, 404);

        const tenantsUsing = await Tenant.countDocuments({ plan: plan.name });
        if (tenantsUsing > 0) {
            return c.json({
                error: `Impossible de supprimer : ${tenantsUsing} tenant(s) utilisent ce plan. Désactivez-le plutôt.`,
                tenantsUsing,
            }, 409);
        }

        await Plan.findByIdAndDelete(id);
        invalidateAllPlansCache();

        return c.json({ message: "Plan supprimé" });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Toggle actif/inactif ─────────────────────────────────────────────────────
export const togglePlan = async (c: Context<AppEnv>) => {
    try {
        const id = c.req.param("id");
        const plan = await Plan.findById(id);
        if (!plan) return c.json({ error: "Plan introuvable" }, 404);

        plan.isActive = !plan.isActive;
        await plan.save();

        invalidatePlanCache(plan.name);
        invalidateAllPlansCache();

        return c.json({
            message: `Plan ${plan.isActive ? "activé" : "désactivé"}`,
            plan,
        });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Demandes d'upgrade (liste admin) ────────────────────────────────────────
export const getPlanRequests = async (c: Context<AppEnv>) => {
    try {
        const { status } = c.req.query();
        const filter: Record<string, unknown> = {};
        if (status) filter.status = status;

        const requests = await PlanRequest.find(filter)
            .populate("tenant_id", "name ownerEmail plan status")
            .populate("processedBy", "name email")
            .sort({ createdAt: -1 })
            .lean();

        return c.json({ requests });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Approuver / Refuser une demande ─────────────────────────────────────────
export const processPlanRequest = async (c: Context<AppEnv>) => {
    try {
        const id = c.req.param("id");
        const adminUserId = c.get("userId");
        const { action, adminNote, durationMonths = 1 } = await c.req.json();

        if (!["approved", "rejected"].includes(action)) {
            return c.json({ error: "Action invalide : approved ou rejected" }, 400);
        }

        const request = await PlanRequest.findById(id).populate("tenant_id");
        if (!request) return c.json({ error: "Demande introuvable" }, 404);
        if (request.status !== "pending") {
            return c.json({ error: "Cette demande a déjà été traitée" }, 409);
        }

        request.status = action;
        request.adminNote = adminNote;
        request.processedBy = adminUserId as any;
        request.processedAt = new Date();
        await request.save();

        // Si approuvé → activer le plan sur le tenant
        if (action === "approved") {
            const tenantId = request.tenant_id._id.toString();
            const newPlanName = request.requestedPlan;

            const planDoc = await Plan.findOne({ name: newPlanName }).lean();
            if (!planDoc) return c.json({ error: `Plan "${newPlanName}" introuvable` }, 404);

            const now = new Date();
            const expiresAt = new Date(now);
            expiresAt.setMonth(expiresAt.getMonth() + Math.max(1, durationMonths));

            await Subscription.updateMany(
                { tenant_id: tenantId, status: "active" },
                { $set: { status: "cancelled" } }
            );

            await Subscription.create({
                tenant_id: tenantId,
                plan: newPlanName,
                amount: planDoc.price,
                currency: planDoc.currency,
                startsAt: now,
                expiresAt,
                paymentRef: `ADMIN-APPROVED-${id}`,
                status: "active",
            });

            await Tenant.findByIdAndUpdate(tenantId, {
                plan: newPlanName,
                status: "active",
            });
        }

        return c.json({
            message: action === "approved" ? "Demande approuvée et plan activé" : "Demande refusée",
            request,
        });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};