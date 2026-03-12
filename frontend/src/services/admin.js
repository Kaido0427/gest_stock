import api from "./api";

// ─── Stats ────────────────────────────────────────────────────────────────────
export const getAdminStats = async () => {
    const { data } = await api.get("/admin/stats");
    return data;
};

// ─── Tenants ──────────────────────────────────────────────────────────────────
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

export const setTenantPlan = async (id, payload) => {
    // payload: { plan, durationMonths?, note? }
    const { data } = await api.patch(`/admin/tenants/${id}/plan`, payload);
    return data;
};

// ─── Plans (CRUD) ─────────────────────────────────────────────────────────────
export const getAdminPlans = async () => {
    const { data } = await api.get("/admin/plans");
    return data;
};

export const createPlan = async (payload) => {
    const { data } = await api.post("/admin/plans", payload);
    return data;
};

export const updatePlan = async (id, payload) => {
    const { data } = await api.put(`/admin/plans/${id}`, payload);
    return data;
};

export const deletePlan = async (id) => {
    const { data } = await api.delete(`/admin/plans/${id}`);
    return data;
};

export const togglePlan = async (id) => {
    const { data } = await api.patch(`/admin/plans/${id}/toggle`);
    return data;
};

// ─── Plan Requests ────────────────────────────────────────────────────────────
export const getPlanRequests = async (status) => {
    const { data } = await api.get("/admin/plan-requests", {
        params: status ? { status } : {},
    });
    return data;
};

export const processPlanRequest = async (id, payload) => {
    // payload: { action, adminNote?, durationMonths? }
    const { data } = await api.patch(`/admin/plan-requests/${id}`, payload);
    return data;
};

// ─── Paiements ────────────────────────────────────────────────────────────────
export const getAdminPayments = async (params = {}) => {
    const { data } = await api.get("/admin/payments", { params });
    return data;
};

export const recordManualPayment = async (payload) => {
    const { data } = await api.post("/admin/payments/manual", payload);
    return data;
};

export const cancelSubscription = async (id) => {
    const { data } = await api.patch(`/admin/payments/${id}/cancel`);
    return data;
};