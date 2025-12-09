import type { Context, Next } from "hono";
import jwt from "jsonwebtoken";

export async function authMiddleware(c: Context, next: Next) {
  const token = c.req.header("authorization")?.replace("Bearer ", "");

  if (!token) return c.json({ error: "Token manquant" }, 401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    c.set("user", decoded);
    await next();
  } catch (err) {
    return c.json({ error: "Token invalide" }, 401);
  }
}
