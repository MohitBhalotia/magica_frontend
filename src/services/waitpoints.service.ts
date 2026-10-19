import { WaitpointSchema } from "@mohitbhalotia/magica-contracts";

import { request } from "@/services/http";

/** Answers a paused run's question (PRD §5.8); answering twice returns the first answer. */
export const respondWaitpoint = (id: string, response: unknown, token: string | null) =>
  request(`/api/v1/waitpoints/${encodeURIComponent(id)}/respond`, WaitpointSchema, {
    method: "POST",
    body: JSON.stringify({ response }),
    token,
  });
