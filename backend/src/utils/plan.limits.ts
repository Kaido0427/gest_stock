export type PlanType = "starter" | "business" | "enterprise";

export interface PlanLimits {
    boutiques: number;       // -1 = illimité
    produits: number;
    employes: number;
    historiqueJours: number; // -1 = illimité
    transfertInterBoutiques: boolean;
    statsAvancees: boolean;
    export: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
    starter: {
        boutiques: 1,
        produits: 100,
        employes: 2,
        historiqueJours: 30,
        transfertInterBoutiques: false,
        statsAvancees: false,
        export: false,
    },
    business: {
        boutiques: 3,
        produits: 1000,
        employes: 10,
        historiqueJours: 180,
        transfertInterBoutiques: true,
        statsAvancees: true,
        export: true,
    },
    enterprise: {
        boutiques: -1,
        produits: -1,
        employes: -1,
        historiqueJours: -1,
        transfertInterBoutiques: true,
        statsAvancees: true,
        export: true,
    },
};

export const PLAN_PRICES: Record<PlanType, number> = {
    starter: 2000,
    business: 8000,
    enterprise: 20000,
};