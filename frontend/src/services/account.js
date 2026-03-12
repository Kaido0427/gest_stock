import api from "./api";

// ─── Compte ───────────────────────────────────────────────────────────────────
export const getAccount = async () => {
    const { data } = await api.get("/account");
    return data;
};

export const updateAccount = async (payload) => {
    const { data } = await api.put("/account", payload);
    return data;
};

// ─── Boutiques annexes ────────────────────────────────────────────────────────
export const createBoutiqueAnnexe = async (payload) => {
    const { data } = await api.post("/account/boutiques", payload);
    return data;
};

export const updateBoutiqueAnnexe = async (id, payload) => {
    const { data } = await api.put(`/account/boutiques/${id}`, payload);
    return data;
};

export const deleteBoutiqueAnnexe = async (id) => {
    const { data } = await api.delete(`/account/boutiques/${id}`);
    return data;
};

// ─── Employés ─────────────────────────────────────────────────────────────────
export const inviterEmploye = async (payload) => {
    const { data } = await api.post("/account/employes", payload);
    return data;
};

export const toggleEmploye = async (id) => {
    const { data } = await api.patch(`/account/employes/${id}/toggle`);
    return data;
};

// ─── Plans & demandes d'upgrade ──────────────────────────────────────────────
export const getAvailablePlans = async () => {
    const { data } = await api.get("/account/plans");
    return data;
};

export const requestPlanUpgrade = async (payload) => {
    // payload: { requestedPlan, message? }
    const { data } = await api.post("/account/plan-request", payload);
    return data;
};

export const getMyPlanRequests = async () => {
    const { data } = await api.get("/account/plan-requests");
    return data;
};