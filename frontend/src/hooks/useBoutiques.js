import { useQuery } from "@tanstack/react-query";
import { getBoutiques, getBoutique } from "../services/boutique";

export const useBoutiques = () =>
    useQuery({
        queryKey: ["boutiques"],
        queryFn: async () => {
            const res = await getBoutiques();
            return Array.isArray(res) ? res : res.boutiques ?? [];
        },
        staleTime: 5 * 60 * 1000,
    });

export const useBoutique = (id) =>
    useQuery({
        queryKey: ["boutiques", id],
        queryFn: () => getBoutique(id),
        enabled: !!id,
    });