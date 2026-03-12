import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getAccount,
    updateAccount,
    createBoutiqueAnnexe,
    updateBoutiqueAnnexe,
    deleteBoutiqueAnnexe,
    inviterEmploye,
    toggleEmploye,
    getAvailablePlans,
    requestPlanUpgrade,
    getMyPlanRequests,
} from "../services/account";

// ─── Compte ───────────────────────────────────────────────────────────────────
export const useAccount = () =>
    useQuery({
        queryKey: ["account"],
        queryFn: getAccount,
        staleTime: 5 * 60 * 1000,
    });

export const useUpdateAccount = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: updateAccount,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["account"] }),
    });
};

// ─── Boutiques annexes ────────────────────────────────────────────────────────
export const useCreateBoutiqueAnnexe = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createBoutiqueAnnexe,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["account"] });
            qc.invalidateQueries({ queryKey: ["boutiques"] });
        },
    });
};

export const useUpdateBoutiqueAnnexe = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...payload }) => updateBoutiqueAnnexe(id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["account"] });
            qc.invalidateQueries({ queryKey: ["boutiques"] });
        },
    });
};

export const useDeleteBoutiqueAnnexe = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deleteBoutiqueAnnexe,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["account"] });
            qc.invalidateQueries({ queryKey: ["boutiques"] });
        },
    });
};

// ─── Employés ─────────────────────────────────────────────────────────────────
export const useInviterEmploye = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: inviterEmploye,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["account"] }),
    });
};

export const useToggleEmploye = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: toggleEmploye,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["account"] }),
    });
};

// ─── Plans & demandes d'upgrade ───────────────────────────────────────────────
export const useAvailablePlans = () =>
    useQuery({
        queryKey: ["account", "plans"],
        queryFn: getAvailablePlans,
        staleTime: 5 * 60 * 1000, // les plans changent rarement
    });

export const useRequestPlanUpgrade = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: requestPlanUpgrade,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["account", "plan-requests"] });
            qc.invalidateQueries({ queryKey: ["account"] });
        },
    });
};

export const useMyPlanRequests = () =>
    useQuery({
        queryKey: ["account", "plan-requests"],
        queryFn: getMyPlanRequests,
    });