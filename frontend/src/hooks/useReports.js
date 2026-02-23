// hooks/useRapports.js
import { useQuery } from "@tanstack/react-query";
import {
  getStatistiquesVentes,
  getHistoriqueVentes,
  getAlertesStock,
} from "../services/sale";

export const rapportKeys = {
  stats: (periode, boutiqueId) => ["rapports", "stats", periode, boutiqueId],
  historique: (params) => ["rapports", "historique", params],
  alertes: (seuil, boutiqueId) => ["rapports", "alertes", seuil, boutiqueId],
};

export function useStatistiques(periode = "jour", boutiqueId = null) {
  return useQuery({
    queryKey: rapportKeys.stats(periode, boutiqueId),
    queryFn: async () => {
      const res = await getStatistiquesVentes(periode, boutiqueId);
      if (res.error) throw new Error(res.error);
      return res.data ?? res;
    },
    staleTime: 60_000,
    refetchInterval: 120_000, // refresh auto toutes les 2min
  });
}

export function useHistoriqueVentes(params = {}) {
  return useQuery({
    queryKey: rapportKeys.historique(params),
    queryFn: async () => {
      const res = await getHistoriqueVentes(params);
      if (res.error) throw new Error(res.error);
      return res.data ?? res;
    },
    staleTime: 30_000,
  });
}

export function useAlertesStock(seuil = 10, boutiqueId = null) {
  return useQuery({
    queryKey: rapportKeys.alertes(seuil, boutiqueId),
    queryFn: async () => {
      const res = await getAlertesStock(seuil, boutiqueId);
      if (res.error) throw new Error(res.error);
      return Array.isArray(res) ? res : res.data ?? [];
    },
    staleTime: 60_000,
  });
}