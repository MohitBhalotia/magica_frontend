"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createApiKey, listApiKeys, revokeApiKey } from "@/services/apiKeys.service";
import { ApiError } from "@/services/http";

const showError = (error: Error) => {
  toast.error(
    error instanceof ApiError ? error.message : "Something went wrong. Please try again.",
  );
};

/** The user's API keys, fetched while the dialog is open. */
export function useApiKeys(enabled: boolean) {
  const { isSignedIn, userId, getToken } = useAuth();
  return useQuery({
    queryKey: ["api-keys", userId],
    queryFn: async () => listApiKeys(await getToken()),
    enabled: isSignedIn === true && enabled,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  const { userId, getToken } = useAuth();
  return useMutation({
    mutationFn: async (name: string) => createApiKey({ name }, await getToken()),
    onError: showError,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["api-keys", userId] }),
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  const { userId, getToken } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => revokeApiKey(id, await getToken()),
    onError: showError,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["api-keys", userId] }),
  });
}
