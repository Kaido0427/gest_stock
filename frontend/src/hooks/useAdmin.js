import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getAdminStats,
    getTenants,
    getTenant,
    setTenantStatus,
    setTenantPlan,
    getAdminPlans,
    createPlan,
    updatePlan,
    deletePlan,
    togglePlan,
    getPlanRequests,
    processPlanRequest,
    getAdminPayments,
    recordManualPayment,
    cancelSubscription,
} from "../services/admin";

// ─── Stats ────────────────────────────────────────────────────────────────────
export const useAdminStats = () =>
    useQuery({ queryKey: ["admin", "stats"], queryFn: getAdminStats });

// ─── Tenants ──────────────────────────────────────────────────────────────────
export const useTenants = (params = {}) =>
    useQuery({ queryKey: ["admin", "tenants", params], queryFn: () => getTenants(params) });

export const useTenant = (id) =>
    useQuery({ queryKey: ["admin", "tenant", id], queryFn: () => getTenant(id), enabled: !!id });

export const useSetTenantStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }) => setTenantStatus(id, status),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "tenants"] }),
    });
};

export const useSetTenantPlan = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...payload }) => setTenantPlan(id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "tenants"] });
            qc.invalidateQueries({ queryKey: ["admin", "payments"] });
        },
    });
};

// ─── Plans (CRUD) ─────────────────────────────────────────────────────────────
export const useAdminPlans = () =>
    useQuery({ queryKey: ["admin", "plans"], queryFn: getAdminPlans });

export const useCreatePlan = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createPlan,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "plans"] }),
    });
};

export const useUpdatePlan = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...body }) => updatePlan(id, body),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "plans"] }),
    });
};

export const useDeletePlan = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deletePlan,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "plans"] }),
    });
};

export const useTogglePlan = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: togglePlan,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "plans"] }),
    });
};

// ─── Plan Requests ────────────────────────────────────────────────────────────
export const usePlanRequests = (status) =>
    useQuery({
        queryKey: ["admin", "plan-requests", status],
        queryFn: () => getPlanRequests(status),
    });

export const useProcessPlanRequest = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...payload }) => processPlanRequest(id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "plan-requests"] });
            qc.invalidateQueries({ queryKey: ["admin", "tenants"] });
            qc.invalidateQueries({ queryKey: ["admin", "payments"] });
        },
    });
};

// ─── Paiements ────────────────────────────────────────────────────────────────
export const useAdminPayments = (params = {}) =>
    useQuery({ queryKey: ["admin", "payments", params], queryFn: () => getAdminPayments(params) });

export const useRecordManualPayment = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: recordManualPayment,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "payments"] });
            qc.invalidateQueries({ queryKey: ["admin", "tenants"] });
        },
    });
};

export const useCancelSubscription = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: cancelSubscription,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "payments"] });
            qc.invalidateQueries({ queryKey: ["admin", "tenants"] });
        },
    });
};