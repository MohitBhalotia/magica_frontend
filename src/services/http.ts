import type { z } from "zod";

import { ErrorEnvelopeSchema, type ErrorEnvelope } from "@mohitbhalotia/magica-contracts";

import { env } from "@/lib/env";

/** A backend error envelope, thrown so TanStack Query surfaces code, safe message and traceId. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly error: ErrorEnvelope["error"],
  ) {
    super(error.message);
    this.name = "ApiError";
  }
}

/**
 * The only first-party fetch. Sends the Clerk session token as Bearer (the API is cross-origin)
 * and parses the response with its contract schema, so callers get typed, validated data.
 */
export async function request<S extends z.ZodType>(
  path: string,
  schema: S,
  init: RequestInit & { token?: string | null } = {},
): Promise<z.infer<S>> {
  const { token, ...rest } = init;
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${path}`, { ...rest, headers });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const parsed = ErrorEnvelopeSchema.safeParse(body);
    throw new ApiError(
      res.status,
      parsed.success
        ? parsed.data.error
        : { code: "INTERNAL", message: "Something went wrong. Please try again.", traceId: "" },
    );
  }
  return schema.parse(body);
}
