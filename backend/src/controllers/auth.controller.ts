import type { Context } from "hono";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model";
import { Tenant } from "../models/tenant.model";
import { Boutique } from "../models/boutique.model";
import { generateToken } from "../utils/jtw";
import { addToBlacklist } from "../middlewares/auth.middleware";
import { verifyToken } from "../utils/jtw";
import type { AppEnv } from "../types/app.type";

export class AuthController {
    /**
     * Inscription : crée un tenant + owner + boutique principale
     */
    static async register(c: Context<AppEnv>) {
        try {
            const { email, password, name, boutiqueName } = await c.req.json();

            if (!email || !password || !boutiqueName) {
                return c.json({ error: "Email, mot de passe et nom de boutique sont requis" }, 400);
            }

            const exists = await User.findOne({ email });
            if (exists) return c.json({ error: "Email déjà utilisé" }, 400);

            // Créer le tenant
            const tenant = await Tenant.create({
                name: boutiqueName,
                ownerEmail: email,
                plan: "starter",
                status: "trial",
            });

            // Créer le user owner
            const hashed = await bcrypt.hash(password, 10);
            const user = await User.create({
                email,
                password: hashed,
                name: name || email.split("@")[0],
                role: "owner",
                tenant_id: tenant._id,
                isActive: true,
            });

            // Créer la boutique principale
            await Boutique.create({
                name: boutiqueName,
                tenant_id: tenant._id,
                responsable_id: user._id,
                isMain: true,
            });

            const token = generateToken({
                userId: user._id.toString(),
                tenantId: tenant._id.toString(),
                role: user.role,
            });

            return c.json(
                {
                    message: "Compte créé avec succès. Période d'essai de 14 jours.",
                    token,
                    user: {
                        id: user._id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                    },
                    tenant: {
                        id: tenant._id,
                        name: tenant.name,
                        plan: tenant.plan,
                        status: tenant.status,
                        trialEndsAt: tenant.trialEndsAt,
                    },
                },
                201
            );
        } catch (error) {
            console.error("Erreur register:", error);
            return c.json({ error: "Erreur lors de l'inscription" }, 500);
        }
    }

    static async login(c: Context<AppEnv>) {
        try {
            const { email, password } = await c.req.json();

            const user = await User.findOne({ email }).lean();
            if (!user) return c.json({ error: "Utilisateur introuvable" }, 404);
            if (!user.isActive) return c.json({ error: "Compte désactivé" }, 403);

            const valid = await bcrypt.compare(password, user.password);
            if (!valid) return c.json({ error: "Mot de passe incorrect" }, 400);

            let tenantData = null;
            if (user.role !== "super_admin" && user.tenant_id) {
                const tenant = await Tenant.findById(user.tenant_id).lean();
                if (tenant) {
                    tenantData = {
                        id: tenant._id,
                        name: tenant.name,
                        plan: tenant.plan,
                        status: tenant.status,
                        trialEndsAt: tenant.trialEndsAt,
                    };
                }
            }

            const token = generateToken({
                userId: user._id.toString(),
                tenantId: user.tenant_id?.toString(),
                role: user.role,
            });

            return c.json({
                message: "Connexion réussie",
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
                tenant: tenantData,
            });
        } catch (error) {
            console.error("Erreur login:", error);
            return c.json({ error: "Erreur lors de la connexion" }, 500);
        }
    }

    static async logout(c: Context<AppEnv>) {
        const authHeader = c.req.header("Authorization");
        const token = authHeader?.replace("Bearer ", "");
        if (token) addToBlacklist(token);
        return c.json({ message: "Déconnexion réussie" });
    }

    static async getMe(c: Context<AppEnv>) {
        try {
            const authHeader = c.req.header("Authorization");
            const token = authHeader?.replace("Bearer ", "");
            if (!token) return c.json({ error: "Token manquant" }, 401);

            const decoded = verifyToken(token);
            const user = await User.findById(decoded.userId).select("-password").lean();
            if (!user) return c.json({ error: "Utilisateur introuvable" }, 404);

            let tenant = null;
            let boutiques: unknown[] = [];

            if (user.role !== "super_admin" && user.tenant_id) {
                tenant = await Tenant.findById(user.tenant_id).lean();
                boutiques = await Boutique.find({ tenant_id: user.tenant_id })
                    .select("name address phone isMain")
                    .lean();
            }

            return c.json({
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                boutique_id: user.boutique_id,
                tenant: tenant
                    ? {
                        id: tenant._id,
                        name: tenant.name,
                        plan: tenant.plan,
                        status: tenant.status,
                        trialEndsAt: tenant.trialEndsAt,
                    }
                    : null,
                boutiques,
            });
        } catch (error) {
            console.error("Erreur getMe:", error);
            return c.json({ error: "Token invalide ou expiré" }, 401);
        }
    }
}