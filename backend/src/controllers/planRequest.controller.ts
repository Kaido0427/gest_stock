import type { Context } from "hono";
import { PlanRequest } from "../models/planRequest.model.js";
import { Tenant } from "../models/tenant.model.js";
import { Plan } from "../models/plan.model.js";
import { getAllActivePlans } from "../utils/plan.cache.js";
import type { AppEnv } from "../types/app.type.js";

// ─── Liste des plans disponibles (pour la page compte tenant) ────────────────
export const getAvailablePlans = async (c: Context<AppEnv>) => {
    try {
        const plans = await getAllActivePlans();
        return c.json({ plans });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Créer une demande d'upgrade ──────────────────────────────────────────────
export const requestPlanUpgrade = async (c: Context<AppEnv>) => {
    try {
        const tenantId = c.get("tenantId");
        const { requestedPlan, message } = await c.req.json();

        if (!requestedPlan) {
            return c.json({ error: "Le plan demandé est requis" }, 400);
        }

        const tenant = await Tenant.findById(tenantId).lean();
        if (!tenant) return c.json({ error: "Tenant introuvable" }, 404);

        // Vérifier que le plan demandé existe
        const planDoc = await Plan.findOne({ name: requestedPlan, isActive: true }).lean();
        if (!planDoc) return c.json({ error: `Plan "${requestedPlan}" non disponible` }, 404);

        if (tenant.plan === requestedPlan) {
            return c.json({ error: "Vous êtes déjà sur ce plan" }, 400);
        }

        // Vérifier qu'il n'y a pas déjà une demande en attente
        const existingRequest = await PlanRequest.findOne({
            tenant_id: tenantId,
            status: "pending",
        });
        if (existingRequest) {
            return c.json({
                error: "Vous avez déjà une demande en attente. Attendez la réponse de l'administrateur.",
                existingRequest,
            }, 409);
        }

        const request = await PlanRequest.create({
            tenant_id: tenantId,
            currentPlan: tenant.plan,
            requestedPlan,
            message,
            status: "pending",
        });

        return c.json(
            {
                message: "Demande envoyée. L'administrateur vous contactera pour finaliser le paiement.",
                request,
            },
            201
        );
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Historique des demandes du tenant ───────────────────────────────────────
export const getMyPlanRequests = async (c: Context<AppEnv>) => {
    try {
        const tenantId = c.get("tenantId");

        const requests = await PlanRequest.find({ tenant_id: tenantId })
            .sort({ createdAt: -1 })
            .lean();

        return c.json({ requests });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};