# Magica Agent Chat: frontend

The web app for a production-grade clone of Magica's agent chat. Next.js (App Router) on Vercel, signed in with Clerk, following live agent runs over Trigger.dev Realtime. Every API shape comes from the backend's published contracts.

| | |
|---|---|
| **App** | https://magica-galaxy-frontend.vercel.app |
| **API** | https://magica-galaxy-backend.vercel.app/api/v1 (backend repo: `magica_backend`) |
| **API docs** | https://magica-ebc2eaac.mintlify.site |

## What it does

- **The reference's chat shell, closely matched.**
  - Collapsible sidebar with search (⌘/Ctrl+K), pin, rename, duplicate and delete, cursor-paged.
  - Empty state with the idea gallery; composer with attachments; credits pill and usage page.
  - Light and dark themes; mobile layout with a drawer.
- **Live replies.**
  - The reply streams in from the run's Realtime stream, with reasoning, "Thinking", tool steps and generated images and videos inline.
  - Reload mid-reply and the stream replays from the start, with no gaps or duplicates.
  - If Realtime drops, the page polls the run every 2 seconds instead.
- **Stop, retry and failures.** Stop keeps the partial answer as "Stopped". Failed replies show a safe message and Retry.
- **Approvals.** When the agent asks to approve a cost, pick an option or approve a plan, a card appears above the composer, with a countdown. Clicks are ignored for 600ms after it appears, so nothing is approved by accident.
- **Uploads.** Uppy uploads files to Transloadit (tus) with progress, cancel and retry. You can also attach files from earlier uploads with "Select Asset".
- **Long chats.** The thread is virtualized, and older messages load as you scroll up.
- **API keys.** Created and revoked from the user menu, for the public API.

## Architecture

```
src/app/                 routes (App Router): /chat, /chat/[chatId], /usage
src/features/<feature>/  chat, chats (sidebar), credits, uploads, apiKeys, ideas, shell
src/components/ui/       shadcn/ui primitives, restyled with the reference's tokens
src/components/ai-elements/  Vercel AI Elements (conversation, message, reasoning, shimmer)
src/services/            typed REST client: every response is parsed with the contracts' Zod schemas
src/stores/              Zustand: drafts and UI state only
src/styles/tokens.css    design tokens measured from the reference (see DESIGN.md)
e2e/                     Playwright: smoke + axe (local build), signed-in journeys (production)
```

- **Server state goes through TanStack Query; nothing else holds it.** Live replies come from `@trigger.dev/react-hooks` (`useRealtimeStream` / `useRealtimeRun`), read with a run-scoped token. When a run ends, the chat is refetched and the saved message (Postgres) replaces the live one.
- **Contracts come from the backend.** Every type comes from `@mohitbhalotia/magica-contracts` (GitHub Packages); the frontend never redefines an API shape.
- **The UI follows a written design spec.** [DESIGN.md](DESIGN.md) is the source of truth for tokens, components, states and motion, written down from the live reference product.

## Design decisions and trade-offs

- **Saved messages are AI SDK UI parts.** The live view and the saved view render with the same components, so a finished reply doesn't change shape when it's saved.
- **Optimistic where it's safe.** The user's bubble, a new chat in the sidebar, rename, pin and delete all show at once and roll back if the server says no. Replies are never optimistic: they come from the run.
- **Accessibility.** In CI, an axe scan (WCAG 2.1 A/AA, serious or critical fails) and keyboard checks run on every PR. The reference's caption grey (`#777`) fails AA contrast, so ours is `#707070`. That is the one deliberate departure from the reference, logged in the PRD.
- **Signed-in journeys run against production after each deploy.** They cover first task, reload mid-run, Stop and chat management, plus axe and 390px checks, using the free model only. Media journeys spend Magica credits, so they're run by hand.
- **Reference items outside the brief are inert.** Projects, Library, Tools, "Computer" and similar render for layout fidelity but do nothing.

## Running it locally

Requirements: Node 24+, pnpm 12, the backend running (see `magica_backend`), and a Clerk dev instance.

```bash
pnpm install          # @mohitbhalotia/* comes from GitHub Packages: set a token with read:packages
cp .env.example .env.local
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
pnpm dev              # http://localhost:3000
```

| Command | |
|---|---|
| `pnpm typecheck` · `pnpm lint` · `pnpm format:check` | Static checks |
| `pnpm test` / `pnpm test:coverage` | Vitest + React Testing Library + MSW |
| `pnpm test:e2e` | Playwright: smoke, axe and keyboard tests on a local build |
| `pnpm test:e2e:journeys` | Signed-in journeys (needs `E2E_BASE_URL` and the e2e user in `.env.local`) |

CI runs all of it on every PR. On `main` it deploys to Vercel, then runs the journeys against the deployment.

## With more time

- **Visual regression.** Screenshots of the key screens against the reference, light and dark, desktop and mobile.
- **Media journeys in CI,** with deterministic providers so they cost nothing.
- **Fix two known gaps:**
  - typing before hydration is lost;
  - "Choose project" is truncated at 360px.
- **Offline-tolerant drafts,** and resending queued messages after a reconnect.
