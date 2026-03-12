import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getProduits,
    getProduit,
    addProduit,
    updateProduit,
    deleteProduit,
    approvisionnerProduit,
    vendreProduit,
    transfertStock,
    getAlertesStock,
} from "../services/product";

export const useProduits = (params = {}) =>
    useQuery({
        queryKey: ["produits", params],
        queryFn: () => getProduits(params),
        staleTime: 2 * 60 * 1000,
    });

export const useProduit = (id) =>
    useQuery({
        queryKey: ["produits", id],
        queryFn: () => getProduit(id),
        enabled: !!id,
    });

export const useAlertesStock = (params = {}) =>
    useQuery({
        queryKey: ["alertes-stock", params],
        queryFn: () => getAlertesStock(params),
        staleTime: 60 * 1000,
    });

export const useAddProduit = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: addProduit,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["produits"] }),
    });
};

// Crée le même produit dans plusieurs boutiques (une requête par boutique)
export const useAddProduitMultiBoutiques = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ name, description, category, unit, basePrice, boutiques = [] }) => {
            const results = await Promise.all(
                boutiques.map((b) =>
                    addProduit({
                        name, description, category, unit, basePrice,
                        boutique_id: b.boutique_id,
                        stock: b.stock,
                    })
                )
            );
            return results;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["produits"] }),
    });
};

export const useUpdateProduit = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, updates }) => updateProduit(id, updates),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["produits"] }),
    });
};

export const useDeleteProduit = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deleteProduit,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["produits"] }),
    });
};

export const useApprovisionner = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ productId, data }) => approvisionnerProduit(productId, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["produits"] }),
    });
};

export const useVendreProduit = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...payload }) => vendreProduit(id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["produits"] });
            qc.invalidateQueries({ queryKey: ["ventes"] });
        },
    });
};

export const useTransfertStock = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: transfertStock,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["produits"] }),
    });
};