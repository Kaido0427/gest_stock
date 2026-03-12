import type { Context, Next } from "hono";
import { verifyToken } from "../utils/jtw";
import { User } from "../models/user.model";
import { Tenant } from "../models/tenant.model";
import type { AppEnv } from "../types/app.type";

const tokenBlacklist = new Set<string>();

export const addToBlacklist = (token: string): void => {
  tokenBlacklist.add(token);
};

export const isBlacklisted = (token: string): boolean => {
  return tokenBlacklist.has(token);
};

export const authMiddleware = async (c: Context<AppEnv>, next: Next): Promise<Response | void> => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return c.json({ error: "Token manquant" }, 401);
  }

  if (tokenBlacklist.has(token)) {
    return c.json({ error: "Token invalide (déconnecté)" }, 401);
  }

  try {
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.userId).select("-password").lean();
    if (!user || !user.isActive) {
      return c.json({ error: "Utilisateur introuvable ou inactif" }, 401);
    }

    c.set("userId", decoded.userId);
    c.set("userRole", user.role);

    if (user.role !== "super_admin" && user.tenant_id) {
      const tenantId = user.tenant_id.toString();
      c.set("tenantId", tenantId);

      const tenant = await Tenant.findById(tenantId).lean();
      if (!tenant) return c.json({ error: "Tenant introuvable" }, 401);

      c.set("plan", tenant.plan);
    }

    await next();
  } catch {
    return c.json({ error: "Token invalide ou expiré" }, 401);
  }
};