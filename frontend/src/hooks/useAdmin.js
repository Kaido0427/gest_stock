import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getAdminStats,
    getTenants,
    getTenant,
    setTenantStatus,
    setTenantPlan,
} from "../services/admin";

export const useAdminStats = () =>
    useQuery({
        queryKey: ["admin-stats"],
        queryFn: getAdminStats,
        staleTime: 60 * 1000,
    });

export const useTenants = (params = {}) =>
    useQuery({
        queryKey: ["tenants", params],
        queryFn: () => getTenants(params),
        staleTime: 60 * 1000,
    });

export const useTenant = (id) =>
    useQuery({
        queryKey: ["tenants", id],
        queryFn: () => getTenant(id),
        enabled: !!id,
    });

export const useSetTenantStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }) => setTenantStatus(id, status),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["tenants"] });
            qc.invalidateQueries({ queryKey: ["admin-stats"] });
        },
    });
};

export const useSetTenantPlan = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, plan, paymentRef }) => setTenantPlan(id, plan, paymentRef),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["tenants"] });
            qc.invalidateQueries({ queryKey: ["admin-stats"] });
        },
    });
};