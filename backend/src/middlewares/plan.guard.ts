import type { Context, Next } from "hono";
import { getPlanByName } from "../utils/plan.cache";
import type { AppEnv } from "../types/app.type";

export const planFeatureGuard = (feature: string) => {
    return async (c: Context<AppEnv>, next: Next): Promise<Response | void> => {
        const userRole = c.get("userRole");
        if (userRole === "super_admin") return next();

        const planName = c.get("plan");
        if (!planName) return c.json({ error: "Plan introuvable" }, 403);

        const plan = await getPlanByName(planName);
        if (!plan) return c.json({ error: `Plan "${planName}" introuvable en base` }, 403);

        const value = plan.features?.[feature];
        if (value === false || value === undefined) {
            return c.json({
                error: `La fonctionnalité "${feature}" n'est pas disponible sur le plan ${plan.label}. Passez à un plan supérieur.`,
                feature,
                currentPlan: planName,
                upgradeRequired: true,
            }, 403);
        }
        await next();
    };
};

export const planQuotaGuard = (
    quota: "boutiques" | "produits" | "employes",
    getCount: (tenantId: string) => Promise<number>
) => {
    return async (c: Context<AppEnv>, next: Next): Promise<Response | void> => {
        const userRole = c.get("userRole");
        if (userRole === "super_admin") return next();

        const planName = c.get("plan");
        if (!planName) return c.json({ error: "Plan introuvable" }, 403);

        const plan = await getPlanByName(planName);
        if (!plan) return c.json({ error: `Plan "${planName}" introuvable en base` }, 403);

        const max = plan.limits?.[quota] as number;
        if (max === -1) return next();

        const tenantId = c.get("tenantId");
        if (!tenantId) return c.json({ error: "Tenant introuvable" }, 403);

        const current = await getCount(tenantId);
        if (current >= max) {
            return c.json({
                error: `Limite atteinte : votre plan ${plan.label} autorise maximum ${max} ${quota}. Vous en avez déjà ${current}.`,
                quota,
                currentPlan: planName,
                limit: max,
                current,
                upgradeRequired: true,
            }, 403);
        }
        await next();
    };
};