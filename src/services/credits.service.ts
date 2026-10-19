import {
  CreditBalanceSchema,
  UsageExecutionPageSchema,
  UsageSummarySchema,
  type ToolName,
} from "@mohitbhalotia/magica-contracts";

import { request } from "@/services/http";

type Token = string | null;

/** The user's balance; the first call also grants their welcome credits. */
export const getBalance = (token: Token) =>
  request("/api/v1/credits", CreditBalanceSchema, { token });

/** The /usage page: spending per tool since the user's first credits. */
export const getUsage = (token: Token) =>
  request("/api/v1/credits/usage", UsageSummarySchema, { token });

/** One tool's charges, newest first. */
export const listToolUsage = (tool: ToolName, cursor: string | undefined, token: Token) =>
  request(
    `/api/v1/credits/usage/${tool}${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
    UsageExecutionPageSchema,
    { token },
  );
