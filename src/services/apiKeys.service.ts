import { z } from "zod";

import {
  ApiKeyListSchema,
  CreateApiKeyResponseSchema,
  type CreateApiKeyRequest,
} from "@mohitbhalotia/magica-contracts";

import { request } from "@/services/http";

type Token = string | null;

/** The user's live API keys, newest first (50 per page: few people have more). */
export const listApiKeys = (token: Token) =>
  request("/api/v1/api-keys?limit=50", ApiKeyListSchema, { token });

/** A new key; the response is the only time the key itself is visible. */
export const createApiKey = (body: CreateApiKeyRequest, token: Token) =>
  request("/api/v1/api-keys", CreateApiKeyResponseSchema, {
    method: "POST",
    body: JSON.stringify(body),
    token,
  });

// 204 No Content: `request` reads the empty body as null.
export const revokeApiKey = (id: string, token: Token) =>
  request(`/api/v1/api-keys/${encodeURIComponent(id)}`, z.null(), { method: "DELETE", token });
