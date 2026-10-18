import { z } from "zod";

// Public values only (they ship to the browser). Next inlines NEXT_PUBLIC_* only when referenced
// literally, so each key is read by name rather than passing process.env whole.
export const env = z
  .object({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
    NEXT_PUBLIC_API_BASE_URL: z.url(),
  })
  .parse({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  });
