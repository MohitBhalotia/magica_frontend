import { z } from "zod";

import {
  ChatDetailSchema,
  ChatListSchema,
  ChatSummarySchema,
  RunHandleSchema,
  SearchResultListSchema,
  SendResponseSchema,
  type SendMessageRequest,
  type UpdateChatRequest,
} from "@mohitbhalotia/magica-contracts";

import { request } from "@/services/http";

type Token = string | null;
const chatPath = (id: string) => `/api/v1/chats/${encodeURIComponent(id)}`;

export const listChats = (cursor: string | undefined, token: Token) =>
  request(`/api/v1/chats${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`, ChatListSchema, {
    token,
  });

/** Titles and message text, case-insensitive substring (DEC-049); first page only in the dialog. */
export const searchChats = (q: string, token: Token) =>
  request(`/api/v1/chats/search?q=${encodeURIComponent(q)}`, SearchResultListSchema, { token });

/** The chat plus its newest messages (newest first). Not yours or deleted → 404 NOT_FOUND. */
export const getChat = (id: string, token: Token) =>
  request(chatPath(id), ChatDetailSchema, { token });

/** First message: the chat, the message and the run answering it. Idempotent per clientMessageId. */
export const createChat = (body: SendMessageRequest, token: Token) =>
  request("/api/v1/chats", SendResponseSchema, {
    method: "POST",
    body: JSON.stringify(body),
    token,
  });

/** A follow-up in an existing chat. 409 RUN_ACTIVE while a reply is still being written. */
export const sendMessage = (chatId: string, body: SendMessageRequest, token: Token) =>
  request(`${chatPath(chatId)}/messages`, SendResponseSchema, {
    method: "POST",
    body: JSON.stringify(body),
    token,
  });

/** Stop a reply. Idempotent; a reply that already ended comes back as it is. */
export const cancelRun = (runId: string, token: Token) =>
  request(`/api/v1/runs/${encodeURIComponent(runId)}/cancel`, RunHandleSchema, {
    method: "POST",
    token,
  });

export const updateChat = (id: string, patch: UpdateChatRequest, token: Token) =>
  request(chatPath(id), ChatSummarySchema, { method: "PATCH", body: JSON.stringify(patch), token });

export const duplicateChat = (id: string, token: Token) =>
  request(`${chatPath(id)}/duplicate`, ChatSummarySchema, { method: "POST", token });

// 204 No Content: `request` reads the empty body as null.
export const deleteChat = (id: string, token: Token) =>
  request(chatPath(id), z.null(), { method: "DELETE", token });
