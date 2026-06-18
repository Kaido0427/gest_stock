import type { Context } from "hono";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model";
import { Tenant } from "../models/tenant.model";
import { Boutique } from "../models/boutique.model";
import { generateToken } from "../utils/jtw";
import { addToBlacklist } from "../middlewares/auth.middleware";
import { verifyToken } from "../utils/jtw";
import { sendMail } from "../utils/mailer";
import type { AppEnv } from "../types/app.type";

/** Gabarit HTML de l'email de réinitialisation */
function resetEmailHtml(name: string, resetUrl: string): string {
    const hello = name ? `Bonjour ${name},` : "Bonjour,";
    return `<!DOCTYPE html><html lang="fr"><body style="margin:0;background:#eef1f5;font-family:Arial,Helvetica,sans-serif;color:#1e293b">
  <div style="max-width:520px;margin:24px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:#123a55;padding:24px 32px;color:#fff">
      <div style="font-size:20px;font-weight:bold">Gestion de Stock · CMI</div>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 12px">${hello}</p>
      <p style="margin:0 0 20px;line-height:1.6">Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau. Ce lien est valable <strong>1 heure</strong>.</p>
      <p style="text-align:center;margin:28px 0">
        <a href="${resetUrl}" style="background:#2174ab;color:#fff;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:12px;display:inline-block">Réinitialiser mon mot de passe</a>
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#64748b">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
      <p style="margin:0 0 20px;font-size:13px;word-break:break-all"><a href="${resetUrl}" style="color:#2174ab">${resetUrl}</a></p>
      <p style="margin:0;font-size:13px;color:#94a3b8">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email — votre mot de passe reste inchangé.</p>
    </div>
    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;text-align:center">© ${new Date().getFullYear()} CMIDigit. Tous droits réservés.</div>
  </div>
</body></html>`;
}

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

    /**
     * Demande de réinitialisation : génère un token, l'enregistre (haché) et envoie l'email.
     * Réponse générique pour ne pas révéler l'existence d'un compte.
     */
    static async forgotPassword(c: Context<AppEnv>) {
        try {
            const { email } = await c.req.json();
            if (!email) return c.json({ error: "Email requis" }, 400);

            const generic = {
                message: "Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé.",
            };

            const user = await User.findOne({ email: String(email).toLowerCase().trim() });
            if (!user || !user.isActive) return c.json(generic);

            const rawToken = crypto.randomBytes(32).toString("hex");
            user.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
            user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure
            await user.save();

            const appUrl = (process.env.APP_URL || "http://localhost:5173").replace(/\/+$/, "");
            const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

            try {
                await sendMail({
                    to: user.email,
                    subject: "Réinitialisation de votre mot de passe — Gestion de Stock",
                    html: resetEmailHtml(user.name || "", resetUrl),
                });
            } catch (mailErr) {
                console.error("Erreur envoi email reset:", mailErr);
                // On annule le token pour éviter un token inutilisable côté serveur
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;
                await user.save();
                return c.json({ error: "Impossible d'envoyer l'email pour le moment. Réessayez plus tard." }, 500);
            }

            return c.json(generic);
        } catch (error) {
            console.error("Erreur forgotPassword:", error);
            return c.json({ error: "Erreur serveur" }, 500);
        }
    }

    /**
     * Réinitialisation effective : vérifie le token (non expiré) et met à jour le mot de passe.
     */
    static async resetPassword(c: Context<AppEnv>) {
        try {
            const { token, password } = await c.req.json();
            if (!token || !password) return c.json({ error: "Token et mot de passe requis" }, 400);
            if (String(password).length < 6) {
                return c.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, 400);
            }

            const hashed = crypto.createHash("sha256").update(String(token)).digest("hex");
            const user = await User.findOne({
                resetPasswordToken: hashed,
                resetPasswordExpires: { $gt: new Date() },
            });
            if (!user) return c.json({ error: "Lien invalide ou expiré. Refaites une demande." }, 400);

            user.password = await bcrypt.hash(password, 10);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            return c.json({ message: "Mot de passe réinitialisé. Vous pouvez maintenant vous connecter." });
        } catch (error) {
            console.error("Erreur resetPassword:", error);
            return c.json({ error: "Erreur serveur" }, 500);
        }
    }
}