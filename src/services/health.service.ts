import { HealthResponseSchema } from "@mohitbhalotia/magica-contracts";

import { request } from "@/services/http";

export const getHealth = () => request("/api/v1/health", HealthResponseSchema);
