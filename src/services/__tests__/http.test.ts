import { http, HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";

import { HealthResponseSchema } from "@mohitbhalotia/magica-contracts";

import { server } from "@/mocks/server";
import { getHealth } from "@/services/health.service";
import { ApiError, request } from "@/services/http";

const API = "http://localhost:4000";
const HEALTH = `${API}/api/v1/health`;

describe("request", () => {
  it("returns contract-parsed data", async () => {
    server.use(
      http.get(HEALTH, () => HttpResponse.json({ status: "ok", time: "2026-10-18T00:00:00Z" })),
    );
    await expect(getHealth()).resolves.toEqual({ status: "ok", time: "2026-10-18T00:00:00Z" });
  });

  it("sends the Clerk token as a Bearer header", async () => {
    let auth: string | null = null;
    server.use(
      http.get(HEALTH, ({ request: req }) => {
        auth = req.headers.get("authorization");
        return HttpResponse.json({ status: "ok", time: "2026-10-18T00:00:00Z" });
      }),
    );
    await request("/api/v1/health", HealthResponseSchema, { token: "tok" });
    expect(auth).toBe("Bearer tok");
  });

  it("throws ApiError with the backend envelope", async () => {
    const error = {
      code: "RUN_ACTIVE",
      message: "A response is already in progress.",
      traceId: "t1",
    } as const;
    server.use(http.get(HEALTH, () => HttpResponse.json({ error }, { status: 409 })));
    await expect(getHealth()).rejects.toEqual(new ApiError(409, error));
  });

  it("maps a non-envelope failure to a safe INTERNAL error", async () => {
    server.use(http.get(HEALTH, () => new HttpResponse("<html>502</html>", { status: 502 })));
    await expect(getHealth()).rejects.toMatchObject({ status: 502, error: { code: "INTERNAL" } });
  });

  it("rejects a response that breaks the contract", async () => {
    server.use(http.get(HEALTH, () => HttpResponse.json({ status: "ok", time: "now" })));
    await expect(getHealth()).rejects.toThrow();
  });
});
