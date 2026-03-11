import api from "./api";

export const getBoutiques = async () => {
    const { data } = await api.get("/boutiques");
    return data;
};

export const getBoutique = async (id) => {
    const { data } = await api.get(`/boutiques/${id}`);
    return data;
};