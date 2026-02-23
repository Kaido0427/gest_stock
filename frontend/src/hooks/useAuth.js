// hooks/useAuth.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { login, logout, getCurrentUser } from "../services/auth";

export const authKeys = {
  me: ["auth", "me"],
};

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      const user = await getCurrentUser();
      return user ?? null;
    },
    staleTime: Infinity,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password }) => {
      const res = await login(email, password);
      if (res.error) throw new Error(res.error);
      return res;
    },
    onSuccess: (data) => {
      // Met en cache l'utilisateur connecté
      queryClient.setQueryData(authKeys.me, data.user ?? data);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear();
    },
  });
}