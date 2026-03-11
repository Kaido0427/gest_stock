import { useQuery } from "@tanstack/react-query";
import { getBoutiques, getBoutique } from "../services/boutique";

export const useBoutiques = () =>
    useQuery({
        queryKey: ["boutiques"],
        queryFn: getBoutiques,
        staleTime: 5 * 60 * 1000,
    });

export const useBoutique = (id) =>
    useQuery({
        queryKey: ["boutiques", id],
        queryFn: () => getBoutique(id),
        enabled: !!id,
    });