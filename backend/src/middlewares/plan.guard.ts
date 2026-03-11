import type { Context, Next } from "hono";
import { PLAN_LIMITS, type PlanLimits } from "../utils/plan.limits.js";
import type { AppEnv } from "../types/app.type.js";

type PlanFeature = keyof PlanLimits;

/**
 * Vérifie qu'une feature booléenne est activée pour le plan actuel
 * ex: planFeatureGuard("transfertInterBoutiques")
 */
export const planFeatureGuard = (feature: PlanFeature) => {
    return async (c: Context<AppEnv>, next: Next): Promise<Response | void> => {
        const userRole = c.get("userRole");
        if (userRole === "super_admin") return next();

        const plan = c.get("plan");
        const limits = PLAN_LIMITS[plan];
        const value = limits[feature];

        if (value === false) {
            return c.json(
                {
                    error: `Fonctionnalité non disponible sur votre plan (${plan}). Passez au plan supérieur.`,
                    feature,
                    currentPlan: plan,
                },
                403
            );
        }

        await next();
    };
};

/**
 * Vérifie un quota numérique (boutiques, produits, employes)
 * ex: planQuotaGuard("boutiques", () => Boutique.countDocuments({ tenant_id }))
 */
export const planQuotaGuard = (
    quota: PlanFeature,
    getCount: (tenantId: string) => Promise<number>
) => {
    return async (c: Context<AppEnv>, next: Next): Promise<Response | void> => {
        const userRole = c.get("userRole");
        if (userRole === "super_admin") return next();

        const plan = c.get("plan");
        const limits = PLAN_LIMITS[plan];
        const max = limits[quota] as number;

        if (max === -1) return next(); // illimité

        const tenantId = c.get("tenantId");
        const current = await getCount(tenantId);

        if (current >= max) {
            return c.json(
                {
                    error: `Limite atteinte pour votre plan (${plan}): max ${max} ${String(quota)}.`,
                    quota,
                    currentPlan: plan,
                    limit: max,
                    current,
                },
                403
            );
        }

        await next();
    };
};