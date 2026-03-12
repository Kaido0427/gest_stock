import { Plan, type IPlan } from "../models/plan.model";

// Cache en mémoire avec TTL de 60 secondes
// Évite une requête DB à chaque appel de middleware
const cache = new Map<string, { plan: IPlan; expiresAt: number }>();
const CACHE_TTL_MS = 60_000; // 60 secondes

/**
 * Récupère un plan par son name (ex: "starter", "business").
 * Utilise un cache court pour éviter les requêtes DB répétées.
 */
export const getPlanByName = async (name: string): Promise<IPlan | null> => {
    const now = Date.now();
    const cached = cache.get(name);

    if (cached && cached.expiresAt > now) {
        return cached.plan;
    }

    const plan = await Plan.findOne({ name, isActive: true }).lean() as IPlan | null;
    if (plan) {
        cache.set(name, { plan, expiresAt: now + CACHE_TTL_MS });
    }

    return plan;
};

/**
 * Invalide le cache pour un plan donné.
 * À appeler après une mise à jour de plan par l'admin.
 */
export const invalidatePlanCache = (name?: string): void => {
    if (name) {
        cache.delete(name);
    } else {
        cache.clear();
    }
};

/**
 * Récupère tous les plans actifs (avec cache global).
 */
let allPlansCache: { plans: IPlan[]; expiresAt: number } | null = null;

export const getAllActivePlans = async (): Promise<IPlan[]> => {
    const now = Date.now();
    if (allPlansCache && allPlansCache.expiresAt > now) {
        return allPlansCache.plans;
    }
    const plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1 }).lean() as IPlan[];
    allPlansCache = { plans, expiresAt: now + CACHE_TTL_MS };
    return plans;
};

export const invalidateAllPlansCache = (): void => {
    allPlansCache = null;
    cache.clear();
};