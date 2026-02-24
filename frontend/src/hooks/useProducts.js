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
    all: (params = {}) => ["produits", params],
    byBoutique: (id) => ["produits", "boutique", id],
};

// ─── READ ─────────────────────────────────────────────────────────────────────

// ✅ FIX #7 : Supporte la pagination + filtre boutique via params
// params: { page, limit, boutique_id }
export function useProduits(params = {}) {
    return useQuery({
        queryKey: productKeys.all(params),
        queryFn: async () => {
            const res = await getProduits(params);
            if (res.error) throw new Error(res.error);

            // Gère l'ancien format (tableau) et le nouveau (paginé)
            if (Array.isArray(res)) return { produits: res, pagination: null };
            if (res.produits) return res;
            return { produits: [], pagination: null };
        },
        // ✅ FIX : staleTime plus long → moins de refetch inutiles
        staleTime: 2 * 60 * 1000,  // 2 minutes (était 30s)
        gcTime: 5 * 60 * 1000,   // garde en cache 5min après unmount
        select: (data) => data,     // accès à data.produits + data.pagination
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
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
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
            queryClient.invalidateQueries({ queryKey: ["produits"] });
            toast.success("Produit créé avec succès !");
        },
        onError: (err) => toast.error(err.message || "Erreur lors de la création"),
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
            queryClient.invalidateQueries({ queryKey: ["produits"] });
            toast.success("Produit créé dans toutes les boutiques !");
        },
        onError: (err) => toast.error(err.message || "Erreur création multi-boutiques"),
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
        // ✅ Optimistic update conservé
        onMutate: async ({ id, updates }) => {
            await queryClient.cancelQueries({ queryKey: ["produits"] });
            const snapshots = queryClient.getQueriesData({ queryKey: ["produits"] });

            queryClient.setQueriesData({ queryKey: ["produits"] }, (old) => {
                if (!old) return old;
                const list = Array.isArray(old) ? old : old.produits;
                const updated = list?.map((p) => (p._id === id ? { ...p, ...updates } : p));
                return Array.isArray(old) ? updated : { ...old, produits: updated };
            });

            return { snapshots };
        },
        onError: (err, _vars, ctx) => {
            ctx?.snapshots?.forEach(([key, val]) => queryClient.setQueryData(key, val));
            toast.error(err.message || "Erreur lors de la modification");
        },
        onSuccess: () => toast.success("Produit mis à jour !"),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ["produits"] }),
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
        // ✅ Optimistic delete
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["produits"] });
            const snapshots = queryClient.getQueriesData({ queryKey: ["produits"] });

            queryClient.setQueriesData({ queryKey: ["produits"] }, (old) => {
                if (!old) return old;
                const list = Array.isArray(old) ? old : old.produits;
                const filtered = list?.filter((p) => p._id !== id);
                return Array.isArray(old) ? filtered : { ...old, produits: filtered };
            });

            return { snapshots };
        },
        onError: (err, _id, ctx) => {
            ctx?.snapshots?.forEach(([key, val]) => queryClient.setQueryData(key, val));
            toast.error(err.message || "Erreur lors de la suppression");
        },
        onSuccess: () => toast.success("Produit supprimé"),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ["produits"] }),
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
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["produits"] });
            const added = res?.produit?.quantityAdded ?? "";
            toast.success(`Stock mis à jour (+${added} ajoutés) !`);
        },
        onError: (err) => toast.error(err.message || "Erreur approvisionnement"),
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
            queryClient.invalidateQueries({ queryKey: ["produits"] });
            toast.success("Transfert de stock effectué !");
        },
        onError: (err) => toast.error(err.message || "Erreur lors du transfert"),
    });
}