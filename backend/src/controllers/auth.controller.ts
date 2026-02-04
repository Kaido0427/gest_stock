import type { Context } from "hono";
import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jtw.js";
import jwt from "jsonwebtoken";
import { Boutique } from "../models/boutique.model.js";

const tokenBlacklist = new Set<string>();

export class AuthController {
    static async register(c: Context) {
        try {
            const { email, password, role, name } = await c.req.json();

            const exists = await User.findOne({ email });
            if (exists) return c.json({ error: "Email déjà utilisé" }, 400);

            const hashed = await bcrypt.hash(password, 10);

            const user = await User.create({ 
                email, 
                password: hashed, 
                role: role || "user",
                name 
            });

            const token = generateToken(user._id.toString());

            return c.json({
                message: "Compte créé",
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                },
            });
        } catch (error) {
            console.error("Erreur register:", error);
            return c.json({ error: "Erreur lors de l'inscription" }, 500);
        }
    }

    static async login(c: Context) {
        try {
            const { email, password } = await c.req.json();

            const user = await User.findOne({ email });
            if (!user) {
                return c.json({ error: "Utilisateur introuvable" }, 404);
            }

            const valid = await bcrypt.compare(password, user.password);
            if (!valid) {
                return c.json({ error: "Mot de passe incorrect" }, 400);
            }

            const token = generateToken(user._id.toString());

            return c.json({
                message: "Connexion réussie",
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                },
            });
        } catch (error) {
            console.error("Erreur login:", error);
            return c.json({ error: "Erreur lors de la connexion" }, 500);
        }
    }

    static async logout(c: Context) {
        try {
            const authHeader = c.req.header("Authorization");
            const token = authHeader?.replace("Bearer ", "");

            if (token) {
                tokenBlacklist.add(token);
            }

            return c.json({ message: "Déconnexion réussie" });
        } catch (error) {
            console.error("Erreur logout:", error);
            return c.json({ error: "Erreur lors de la déconnexion" }, 500);
        }
    }
static async getMe(c: Context) {
  try {
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return c.json({ error: "Token manquant" }, 401);
    }
    
    if (tokenBlacklist.has(token)) {
      return c.json({ error: "Token invalide (déconnecté)" }, 401);
    }
    
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET!
    ) as { userId: string };
    
    const user = await User.findById(decoded.userId).select("-password");
    
    if (!user) {
      return c.json({ error: "Utilisateur introuvable" }, 404);
    }
    
    // Récupérer la boutique SEULEMENT si ce n'est PAS un admin
    let boutique = null;
    if (user.role !== "admin") {
      boutique = await Boutique.findOne({ responsable_id: user._id });
    }
    
    return c.json({
      id: user._id,
      email: user.email,
      role: user.role,
      boutique: boutique ? {
        id: boutique._id,
        name: boutique.name,
        description: boutique.description,
        address: boutique.address,
        phone: boutique.phone
      } : null
    });
  } catch (error) {
    console.error("❌ Erreur getMe:", error);
    return c.json({ error: "Token invalide ou expiré" }, 401);
  }
}
    // ✅ Middleware pour protéger d'autres routes (optionnel)
    static async verifyToken(c: Context, next: any) {
        const authHeader = c.req.header("Authorization");
        const token = authHeader?.replace("Bearer ", "");

        if (!token) {
            return c.json({ error: "Token manquant" }, 401);
        }

        if (tokenBlacklist.has(token)) {
            return c.json({ error: "Token invalide (déconnecté)" }, 401);
        }

        try {
            const decoded = jwt.verify(
                token, 
                process.env.JWT_SECRET!
            ) as { userId: string };
            
            // Stocker l'ID utilisateur dans le contexte
            c.set("userId", decoded.userId);
            
            await next();
        } catch (error) {
            return c.json({ error: "Token invalide" }, 401);
        }
    }
}