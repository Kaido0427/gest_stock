import type { Context } from "hono";
import { Boutique } from "../models/boutique.model.js";
import type { AppEnv } from "../types/app.type.js";

export const getAllBoutiques = async (c: Context<AppEnv>) => {
  try {
    const tenantId = c.get("tenantId");
    const boutiques = await Boutique.find({ tenant_id: tenantId })
      .populate("responsable_id", "name email")
      .lean();
    return c.json(boutiques);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
};

export const getBoutique = async (c: Context<AppEnv>) => {
  try {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id");
    const boutique = await Boutique.findOne({ _id: id, tenant_id: tenantId })
      .populate("responsable_id", "name email")
      .lean();
    if (!boutique) return c.json({ error: "Boutique introuvable" }, 404);
    return c.json(boutique);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
};