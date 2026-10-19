"use client";

import { useAuth } from "@clerk/nextjs";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import type { ToolName } from "@mohitbhalotia/magica-contracts";

import { getBalance, getUsage, listToolUsage } from "@/services/credits.service";

/** Everything credit-related for a user; invalidated together when a turn ends. */
export const creditsKey = (userId: string | null | undefined) => ["credits", userId] as const;

export function useBalance() {
  const { isSignedIn, userId, getToken } = useAuth();
  return useQuery({
    queryKey: [...creditsKey(userId), "balance"],
    queryFn: async () => getBalance(await getToken()),
    enabled: isSignedIn === true,
  });
}

export function useUsage() {
  const { isSignedIn, userId, getToken } = useAuth();
  return useQuery({
    queryKey: [...creditsKey(userId), "usage"],
    queryFn: async () => getUsage(await getToken()),
    enabled: isSignedIn === true,
  });
}

export function useToolUsage(tool: ToolName) {
  const { isSignedIn, userId, getToken } = useAuth();
  return useInfiniteQuery({
    queryKey: [...creditsKey(userId), "usage", tool],
    queryFn: async ({ pageParam }) => listToolUsage(tool, pageParam, await getToken()),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: isSignedIn === true,
  });
}
