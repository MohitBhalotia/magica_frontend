"use client";

import { useAuth } from "@clerk/nextjs";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  ChatList,
  ChatSummary,
  CreateChatRequest,
  UpdateChatRequest,
} from "@mohitbhalotia/magica-contracts";

import {
  createChat,
  deleteChat,
  duplicateChat,
  getChat,
  listChats,
  searchChats,
  updateChat,
} from "@/services/chats.service";
import { ApiError } from "@/services/http";

type Pages = InfiniteData<ChatList, string | undefined>;

/** Per user, so one account never sees another's cached list after a switch. */
export const chatListKey = (userId: string | null | undefined) => ["chats", userId] as const;

const showError = (error: Error) => {
  toast.error(
    error instanceof ApiError ? error.message : "Something went wrong. Please try again.",
  );
};

/** Sidebar list, pinned first then most recent (server order), 20 per page. */
export function useChatList() {
  const { isSignedIn, userId, getToken } = useAuth();
  return useInfiniteQuery({
    queryKey: chatListKey(userId),
    queryFn: async ({ pageParam }) => listChats(pageParam, await getToken()),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: isSignedIn === true,
  });
}

/** Search results for a (debounced) query; an empty query runs nothing. */
export function useChatSearch(q: string) {
  const { isSignedIn, userId, getToken } = useAuth();
  return useQuery({
    queryKey: ["chat-search", userId, q],
    queryFn: async () => searchChats(q, await getToken()),
    enabled: isSignedIn === true && q !== "",
    // Keep the last results on screen while the next query loads (no flicker per keystroke).
    placeholderData: (previous) => previous,
  });
}

/** One chat with its newest messages. A 404 is final, so it isn't retried. */
export function useChat(id: string) {
  const { isSignedIn, userId, getToken } = useAuth();
  return useQuery({
    queryKey: ["chat", userId, id],
    queryFn: async () => getChat(id, await getToken()),
    enabled: isSignedIn === true,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 3,
  });
}

/**
 * Send from the empty state: creates the chat and its first message. A "New chat" row appears
 * at the top at once (the server uses clientMessageId as the chat id, so the row is the real one)
 * and is removed again if the server says no. Callers navigate in `onSuccess`.
 */
export function useCreateChat() {
  const queryClient = useQueryClient();
  const { userId, getToken } = useAuth();
  const queryKey = chatListKey(userId);
  return useMutation({
    mutationFn: async (body: CreateChatRequest) => createChat(body, await getToken()),
    onMutate: async ({ clientMessageId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Pages>(queryKey);
      const now = new Date().toISOString();
      const row: ChatSummary = {
        id: clientMessageId,
        title: "New chat",
        titleSource: "placeholder",
        isPinned: false,
        createdAt: now,
        updatedAt: now,
      };
      queryClient.setQueryData<Pages>(queryKey, (old) =>
        old
          ? {
              ...old,
              pages: old.pages.map((page, i) =>
                i === 0 ? { ...page, items: [row, ...page.items] } : page,
              ),
            }
          : old,
      );
      return { previous };
    },
    onError: (error, _body, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      showError(error);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

/** Rename or pin. The sidebar updates at once; the old list comes back if the server says no. */
export function useUpdateChat() {
  const queryClient = useQueryClient();
  const { userId, getToken } = useAuth();
  const queryKey = chatListKey(userId);
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: UpdateChatRequest }) =>
      updateChat(id, patch, await getToken()),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Pages>(queryKey);
      queryClient.setQueryData<Pages>(queryKey, (old) =>
        old
          ? {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.map((c) => (c.id === id ? { ...c, ...patch } : c)),
              })),
            }
          : old,
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      showError(error);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

/** Delete. The row disappears at once; it comes back if the server says no. */
export function useDeleteChat() {
  const queryClient = useQueryClient();
  const { userId, getToken } = useAuth();
  const queryKey = chatListKey(userId);
  return useMutation({
    mutationFn: async (id: string) => deleteChat(id, await getToken()),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Pages>(queryKey);
      queryClient.setQueryData<Pages>(queryKey, (old) =>
        old
          ? {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.filter((c) => c.id !== id),
              })),
            }
          : old,
      );
      return { previous };
    },
    onError: (error, _id, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      showError(error);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

/** Not optimistic: the copy's id comes from the server. Callers navigate in `onSuccess`. */
export function useDuplicateChat() {
  const queryClient = useQueryClient();
  const { userId, getToken } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => duplicateChat(id, await getToken()),
    onError: showError,
    onSettled: () => queryClient.invalidateQueries({ queryKey: chatListKey(userId) }),
  });
}
