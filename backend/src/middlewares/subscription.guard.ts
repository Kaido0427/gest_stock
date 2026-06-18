import type { Context, Next } from "hono";
import { Tenant } from "../models/tenant.model";
import { Subscription } from "../models/subscription.model";
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

    // Abonnement payé : on vérifie la date de fin de l'abonnement actif.
    // Sans ce contrôle, un tenant "active" gardait l'accès même après expiration.
    if (tenant.status === "active") {
        const sub = await Subscription.findOne({ tenant_id: tenantId, status: "active" })
            .sort({ expiresAt: -1 })
            .lean();
        if (sub && sub.expiresAt < new Date()) {
            await Tenant.findByIdAndUpdate(tenantId, { status: "expired" });
            await Subscription.findByIdAndUpdate(sub._id, { status: "expired" });
            return c.json({ error: "Abonnement expiré. Veuillez renouveler." }, 403);
        }
    }

    await next();
};