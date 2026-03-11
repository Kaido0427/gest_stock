import api from "./api";

export const getAdminStats = async () => {
    const { data } = await api.get("/admin/stats");
    return data;
};

export const getTenants = async (params = {}) => {
    const { data } = await api.get("/admin/tenants", { params });
    return data;
};

export const getTenant = async (id) => {
    const { data } = await api.get(`/admin/tenants/${id}`);
    return data;
};

export const setTenantStatus = async (id, status) => {
    const { data } = await api.patch(`/admin/tenants/${id}/status`, { status });
    return data;
};

export const setTenantPlan = async (id, plan, paymentRef) => {
    const { data } = await api.patch(`/admin/tenants/${id}/plan`, { plan, paymentRef });
    return data;
};