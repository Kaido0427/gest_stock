// hooks/useSales.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
    validerVente,
    getStatistiquesVentes,
    getHistoriqueVentes,
} from "../services/sale";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const saleKeys = {
    historique: (params = {}) => ["ventes", "historique", params],
    stats: (periode, boutiqueId) => ["ventes", "stats", periode, boutiqueId],
};

// ─── HISTORIQUE ───────────────────────────────────────────────────────────────
export function useHistoriqueVentes(params = {}) {
    return useQuery({
        queryKey: saleKeys.historique(params),
        queryFn: async () => {
            const res = await getHistoriqueVentes(params);
            if (res.error) throw new Error(res.error);
            return res;
        },
        staleTime: 1 * 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000,
    });
}

// ─── STATISTIQUES ─────────────────────────────────────────────────────────────
export function useStatistiquesVentes(periode = "jour", boutiqueId = null) {
    return useQuery({
        queryKey: saleKeys.stats(periode, boutiqueId),
        queryFn: async () => {
            const res = await getStatistiquesVentes(periode, boutiqueId);
            if (res.error) throw new Error(res.error);
            return res;
        },
        staleTime: 30 * 1000, // 30s (données fraîches souhaitées)
        gcTime: 2 * 60 * 1000,
    });
}

// ─── VALIDER VENTE ────────────────────────────────────────────────────────────
export function useValiderVente() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (venteData) => {
            const res = await validerVente(venteData);
            if (res.error) throw new Error(res.error);
            return res;
        },
        onSuccess: (res) => {
            // Invalider les produits (stocks mis à jour) ET l'historique
            queryClient.invalidateQueries({ queryKey: ["produits"] });
            queryClient.invalidateQueries({ queryKey: ["ventes"] });

            const montant = res?.data?.montantTotal ?? 0;
            const nb = res?.data?.itemsVendus ?? 0;
            toast.success(`✅ Vente validée — ${nb} article(s) — ${montant.toLocaleString()} FCFA`);
        },
        onError: (err) => {
            toast.error(err.message || "Erreur lors de la validation de la vente");
        },
    });
}