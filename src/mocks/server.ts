import { setupServer } from "msw/node";

/** Shared MSW server for Vitest; each test adds its handlers with `server.use(...)`. */
export const server = setupServer();
