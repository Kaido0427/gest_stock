// hooks/useProducts.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
    getProduits,
    addProduit,
    addProduitMultiBoutiques,
    updateProduit,
    deleteProduit,
    approvisionnerProduit,
    transfertStockBoutiques,
    getProduitsByBoutique,
} from "../services/product";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const productKeys = {
    all: ["produits"],
    byBoutique: (id) => ["produits", "boutique", id],
};

// ─── READ ─────────────────────────────────────────────────────────────────────
export function useProduits() {
    return useQuery({
        queryKey: productKeys.all,
        queryFn: async () => {
            const res = await getProduits();
            if (res.error) throw new Error(res.error);
            // L'API peut renvoyer un tableau directement ou { produits: [] }
            return Array.isArray(res) ? res : res.produits ?? [];
        },
        staleTime: 30_000, // 30s avant re-fetch automatique
    });
}

export function useProduitsByBoutique(boutiqueId) {
    return useQuery({
        queryKey: productKeys.byBoutique(boutiqueId),
        queryFn: async () => {
            const res = await getProduitsByBoutique(boutiqueId);
            if (res.error) throw new Error(res.error);
            return Array.isArray(res) ? res : res.produits ?? [];
        },
        enabled: Boolean(boutiqueId),
        staleTime: 30_000,
    });
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export function useAddProduit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (produit) => {
            const res = await addProduit(produit);
            if (res.error) throw new Error(res.error);
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.all });
            toast.success("Produit créé avec succès !");
        },
        onError: (err) => {
            toast.error(err.message || "Erreur lors de la création");
        },
    });
}

export function useAddProduitMultiBoutiques() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (produitData) => {
            const res = await addProduitMultiBoutiques(produitData);
            if (res.error) throw new Error(res.error);
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.all });
            toast.success("Produit créé dans toutes les boutiques !");
        },
        onError: (err) => {
            toast.error(err.message || "Erreur lors de la création multi-boutiques");
        },
    });
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export function useUpdateProduit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }) => {
            const res = await updateProduit(id, updates);
            if (res.error) throw new Error(res.error);
            return res;
        },
        // Optimistic update : on met à jour le cache AVANT la réponse serveur
        onMutate: async ({ id, updates }) => {
            await queryClient.cancelQueries({ queryKey: productKeys.all });
            const previous = queryClient.getQueryData(productKeys.all);

            queryClient.setQueryData(productKeys.all, (old = []) =>
                old.map((p) => (p._id === id ? { ...p, ...updates } : p))
            );

            return { previous };
        },
        onError: (err, _vars, ctx) => {
            // Rollback si erreur
            if (ctx?.previous) {
                queryClient.setQueryData(productKeys.all, ctx.previous);
            }
            toast.error(err.message || "Erreur lors de la modification");
        },
        onSuccess: () => {
            toast.success("Produit mis à jour !");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.all });
        },
    });
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export function useDeleteProduit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const res = await deleteProduit(id);
            if (res.error) throw new Error(res.error);
            return res;
        },
        // Optimistic delete
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: productKeys.all });
            const previous = queryClient.getQueryData(productKeys.all);

            queryClient.setQueryData(productKeys.all, (old = []) =>
                old.filter((p) => p._id !== id)
            );

            return { previous };
        },
        onError: (err, _id, ctx) => {
            if (ctx?.previous) {
                queryClient.setQueryData(productKeys.all, ctx.previous);
            }
            toast.error(err.message || "Erreur lors de la suppression");
        },
        onSuccess: () => {
            toast.success("Produit supprimé");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.all });
        },
    });
}

// ─── APPROVISIONNER ───────────────────────────────────────────────────────────
export function useApprovisionner() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, data }) => {
            const res = await approvisionnerProduit(productId, data);
            if (res.error) throw new Error(res.error);
            return res;
        },
        onSuccess: (_, { data }) => {
            queryClient.invalidateQueries({ queryKey: productKeys.all });
            toast.success(`Stock mis à jour (+${data.quantite} ajoutés) !`);
        },
        onError: (err) => {
            toast.error(err.message || "Erreur approvisionnement");
        },
    });
}

// ─── TRANSFERT STOCK ─────────────────────────────────────────────────────────
export function useTransfertStock() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data) => {
            const res = await transfertStockBoutiques(data);
            if (res.error) throw new Error(res.error);
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.all });
            toast.success("Transfert de stock effectué !");
        },
        onError: (err) => {
            toast.error(err.message || "Erreur lors du transfert");
        },
    });
}