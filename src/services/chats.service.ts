import { z } from "zod";

import {
  ChatDetailSchema,
  ChatListSchema,
  ChatSummarySchema,
  CreateChatResponseSchema,
  SearchResultListSchema,
  type CreateChatRequest,
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

/** Idempotent: resending the same clientMessageId returns the same chat. */
export const createChat = (body: CreateChatRequest, token: Token) =>
  request("/api/v1/chats", CreateChatResponseSchema, {
    method: "POST",
    body: JSON.stringify(body),
    token,
  });

export const updateChat = (id: string, patch: UpdateChatRequest, token: Token) =>
  request(chatPath(id), ChatSummarySchema, { method: "PATCH", body: JSON.stringify(patch), token });

export const duplicateChat = (id: string, token: Token) =>
  request(`${chatPath(id)}/duplicate`, ChatSummarySchema, { method: "POST", token });

// 204 No Content: `request` reads the empty body as null.
export const deleteChat = (id: string, token: Token) =>
  request(chatPath(id), z.null(), { method: "DELETE", token });
