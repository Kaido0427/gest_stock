import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, login, logout, register } from "../services/auth";

export const useMe = () =>
  useQuery({
    queryKey: ["me"],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }) => login(email, password),
    onSuccess: (data) => {
      if (data?.error) return; // login échoué, pas d'invalidation
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password, name, boutiqueName }) =>
      register(email, password, name, boutiqueName),
    onSuccess: (data) => {
      if (data?.error) return;
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["me"], null);
    },
  });
};