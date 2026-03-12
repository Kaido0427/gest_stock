export type PlanType = "starter" | "business" | "enterprise";

export interface PlanLimits {
    boutiques: number;              // nb de boutiques ANNEXES (-1 = illimité)
    produits: number;               // nb de produits par boutique (-1 = illimité)
    employes: number;               // nb de managers + employés total (-1 = illimité)
    historiqueJours: number;        // jours d'historique des ventes (-1 = illimité)
    transfertInterBoutiques: boolean;
    statsAvancees: boolean;
    export: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
    starter: {
        boutiques: 0,          // FIX: starter = 0 boutique annexe (1 boutique principale seulement)
        produits: 100,
        employes: 1,           // FIX: 1 seul manager ou employé en plus de l'owner
        historiqueJours: 30,
        transfertInterBoutiques: false,
        statsAvancees: false,
        export: false,
    },
    business: {
        boutiques: 2,          // 2 boutiques annexes en plus de la principale = 3 total
        produits: 1000,
        employes: 10,
        historiqueJours: 180,
        transfertInterBoutiques: true,
        statsAvancees: true,
        export: true,
    },
    enterprise: {
        boutiques: -1,         // illimité
        produits: -1,
        employes: -1,
        historiqueJours: -1,
        transfertInterBoutiques: true,
        statsAvancees: true,
        export: true,
    },
};

export const PLAN_PRICES: Record<PlanType, number> = {
    starter: 2000,    // XOF / mois
    business: 8000,
    enterprise: 20000,
};