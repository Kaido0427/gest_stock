import type { Context, Next } from "hono";
import type { AppEnv } from "../types/app.type";
import type { UserRole } from "../models/user.model";

export const roleGuard = (...allowedRoles: UserRole[]) => {
    return async (c: Context<AppEnv>, next: Next): Promise<Response | void> => {
        const userRole = c.get("userRole");

        if (!allowedRoles.includes(userRole)) {
            return c.json({ error: "Accès refusé. Permissions insuffisantes." }, 403);
        }

        await next();
    };
};

export const adminGuard = roleGuard("super_admin");
export const ownerGuard = roleGuard("super_admin", "owner");
export const managerGuard = roleGuard("super_admin", "owner", "manager");