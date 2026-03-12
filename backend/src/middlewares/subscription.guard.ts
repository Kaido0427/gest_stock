import type { Context, Next } from "hono";
import { Tenant } from "../models/tenant.model";
import type { AppEnv } from "../types/app.type";

export const subscriptionGuard = async (c: Context<AppEnv>, next: Next): Promise<Response | void> => {
    const userRole = c.get("userRole");

    // super_admin bypass
    if (userRole === "super_admin") return next();

    const tenantId = c.get("tenantId");
    const tenant = await Tenant.findById(tenantId).lean();

    if (!tenant) return c.json({ error: "Compte introuvable" }, 403);

    if (tenant.status === "suspended") {
        return c.json({ error: "Compte suspendu. Contactez le support." }, 403);
    }

    if (tenant.status === "expired") {
        return c.json({ error: "Abonnement expiré. Veuillez renouveler." }, 403);
    }

    if (tenant.status === "trial" && tenant.trialEndsAt < new Date()) {
        await Tenant.findByIdAndUpdate(tenantId, { status: "expired" });
        return c.json({ error: "Période d'essai expirée. Veuillez souscrire à un abonnement." }, 403);
    }

    await next();
};