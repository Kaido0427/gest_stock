import type { Context } from "hono";
import bcrypt from "bcryptjs";
import { Tenant } from "../models/tenant.model";
import { Boutique } from "../models/boutique.model";
import { User } from "../models/user.model";
import { Subscription } from "../models/subscription.model";
import { PLAN_LIMITS, PLAN_PRICES, type PlanType } from "../utils/plan.limits";
import type { AppEnv } from "../types/app.type";

// ─── Récupérer les infos du compte ──────────────────────────────────────────
export const getAccount = async (c: Context<AppEnv>) => {
    try {
        const tenantId = c.get("tenantId");
        const tenant = await Tenant.findById(tenantId).lean();
        if (!tenant) return c.json({ error: "Compte introuvable" }, 404);

        const [boutiques, employes, subscription] = await Promise.all([
            Boutique.find({ tenant_id: tenantId }).lean(),
            User.find({ tenant_id: tenantId }).select("-password").lean(),
            Subscription.findOne({ tenant_id: tenantId, status: "active" })
                .sort({ createdAt: -1 })
                .lean(),
        ]);

        return c.json({
            tenant,
            limits: PLAN_LIMITS[tenant.plan],
            subscription,
            stats: {
                boutiques: boutiques.length,
                employes: employes.length,
            },
            boutiques,
            employes,
        });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Mettre à jour les infos du tenant ──────────────────────────────────────
export const updateAccount = async (c: Context<AppEnv>) => {
    try {
        const tenantId = c.get("tenantId");
        const { name } = await c.req.json();

        const tenant = await Tenant.findByIdAndUpdate(
            tenantId,
            { $set: { name } },
            { new: true }
        ).lean();

        return c.json({ message: "Compte mis à jour", tenant });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Créer une boutique annexe ───────────────────────────────────────────────
export const createBoutiqueAnnexe = async (c: Context<AppEnv>) => {
    try {
        const tenantId = c.get("tenantId");
        const { name, description, address, phone, responsable_id } = await c.req.json();

        if (!name) return c.json({ error: "Nom de la boutique requis" }, 400);

        // La vérification du quota est faite par planQuotaGuard en amont
        const boutique = await Boutique.create({
            name,
            description,
            address,
            phone,
            tenant_id: tenantId,
            responsable_id: responsable_id || null,
            isMain: false,
        });

        return c.json({ message: "Boutique annexe créée", boutique }, 201);
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Mettre à jour une boutique ──────────────────────────────────────────────
export const updateBoutique = async (c: Context<AppEnv>) => {
    try {
        const tenantId = c.get("tenantId");
        const boutiqueId = c.req.param("id");
        const body = await c.req.json();

        const boutique = await Boutique.findOneAndUpdate(
            { _id: boutiqueId, tenant_id: tenantId },
            { $set: body },
            { new: true }
        ).lean();

        if (!boutique) return c.json({ error: "Boutique introuvable" }, 404);

        return c.json({ message: "Boutique mise à jour", boutique });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Supprimer une boutique annexe ──────────────────────────────────────────
export const deleteBoutiqueAnnexe = async (c: Context<AppEnv>) => {
    try {
        const tenantId = c.get("tenantId");
        const boutiqueId = c.req.param("id");

        const boutique = await Boutique.findOne({ _id: boutiqueId, tenant_id: tenantId }).lean();
        if (!boutique) return c.json({ error: "Boutique introuvable" }, 404);
        if (boutique.isMain) return c.json({ error: "Impossible de supprimer la boutique principale" }, 400);

        await Boutique.findByIdAndDelete(boutiqueId);
        return c.json({ message: "Boutique supprimée" });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Inviter un employé ──────────────────────────────────────────────────────
export const inviterEmploye = async (c: Context<AppEnv>) => {
    try {
        const tenantId = c.get("tenantId");
        const { email, name, role, boutique_id, password } = await c.req.json();

        if (!email || !password) return c.json({ error: "Email et mot de passe requis" }, 400);
        if (!["manager", "employe"].includes(role)) return c.json({ error: "Rôle invalide" }, 400);

        const exists = await User.findOne({ email });
        if (exists) return c.json({ error: "Email déjà utilisé" }, 400);

        if (boutique_id) {
            const boutique = await Boutique.findOne({ _id: boutique_id, tenant_id: tenantId });
            if (!boutique) return c.json({ error: "Boutique invalide" }, 400);
        }

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({
            email,
            password: hashed,
            name,
            role: role || "employe",
            tenant_id: tenantId,
            boutique_id: boutique_id || null,
            isActive: true,
        });

        return c.json(
            {
                message: "Employé ajouté avec succès",
                user: { id: user._id, email: user.email, name: user.name, role: user.role },
            },
            201
        );
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Désactiver un employé ───────────────────────────────────────────────────
export const toggleEmploye = async (c: Context<AppEnv>) => {
    try {
        const tenantId = c.get("tenantId");
        const userId = c.req.param("id");

        const user = await User.findOne({ _id: userId, tenant_id: tenantId });
        if (!user) return c.json({ error: "Employé introuvable" }, 404);
        if (user.role === "owner") return c.json({ error: "Impossible de modifier le propriétaire" }, 400);

        user.isActive = !user.isActive;
        await user.save();

        return c.json({ message: `Employé ${user.isActive ? "activé" : "désactivé"}`, isActive: user.isActive });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Souscrire / changer de plan ─────────────────────────────────────────────
export const changerPlan = async (c: Context<AppEnv>) => {
    try {
        const tenantId = c.get("tenantId");
        const { plan, paymentRef } = await c.req.json();

        if (!["starter", "business", "enterprise"].includes(plan)) {
            return c.json({ error: "Plan invalide" }, 400);
        }

        const newPlan = plan as PlanType;
        const amount = PLAN_PRICES[newPlan];

        const now = new Date();
        const expiresAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

        // Expirer l'ancien abonnement actif
        await Subscription.updateMany(
            { tenant_id: tenantId, status: "active" },
            { $set: { status: "cancelled" } }
        );

        const subscription = await Subscription.create({
            tenant_id: tenantId,
            plan: newPlan,
            amount,
            currency: "XOF",
            startsAt: now,
            expiresAt,
            paymentRef,
            status: "active",
        });

        await Tenant.findByIdAndUpdate(tenantId, { plan: newPlan, status: "active" });

        return c.json({ message: `Plan mis à jour vers ${newPlan}`, subscription });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};