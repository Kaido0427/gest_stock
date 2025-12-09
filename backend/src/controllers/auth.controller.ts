import type { Context } from "hono";
import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jtw.js";

export class AuthController {
    static async register(c: Context) {
        const { email, password } = await c.req.json();

        const exists = await User.findOne({ email });
        if (exists) return c.json({ error: "Email déjà utilisé" }, 400);

        const hashed = await bcrypt.hash(password, 10);

        const user = await User.create({ email, password: hashed });

        return c.json({
            message: "Compte créé",
            token: generateToken(user._id.toString()),
        });
    }

    static async login(c: Context) {
        const { email, password } = await c.req.json();

        const user = await User.findOne({ email });
        if (!user) return c.json({ error: "Utilisateur introuvable" }, 404);

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return c.json({ error: "Mot de passe incorrect" }, 400);

        return c.json({
            message: "Connexion réussie",
            token: generateToken(user._id.toString()),
        });
    }
}
