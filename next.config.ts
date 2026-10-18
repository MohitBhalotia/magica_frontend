import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // AGENTS.md is hand-maintained; stop `next dev` injecting its own block
  agentRules: false,
  // `/` has no page of its own; redirecting here (307) skips rendering entirely.
  redirects: () => Promise.resolve([{ source: "/", destination: "/chat", permanent: false }]),
  // Idea-card media is served from the reference's public CDN (DESIGN §4.4).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "g.tlcdn.com" },
      { protocol: "https", hostname: "galaxyai.tlcdn.com" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
};

export default nextConfig;
