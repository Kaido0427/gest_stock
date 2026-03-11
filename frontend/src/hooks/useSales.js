import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    validerVente,
    getHistoriqueVentes,
    getVente,
    getStatistiquesVentes,
} from "../services/sale";

export const useHistoriqueVentes = (params = {}) =>
    useQuery({
        queryKey: ["ventes", params],
        queryFn: () => getHistoriqueVentes(params),
        staleTime: 60 * 1000,
    });

export const useVente = (id) =>
    useQuery({
        queryKey: ["ventes", id],
        queryFn: () => getVente(id),
        enabled: !!id,
    });

export const useStatistiquesVentes = (params = {}) =>
    useQuery({
        queryKey: ["ventes-stats", params],
        queryFn: () => getStatistiquesVentes(params),
        staleTime: 60 * 1000,
    });

export const useValiderVente = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: validerVente,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["ventes"] });
            qc.invalidateQueries({ queryKey: ["produits"] });
        },
    });
};