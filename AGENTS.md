# AGENTS.md — magica_frontend (frontend)

Next.js App Router frontend for the Magica clone. It talks to the `magica_backend` backend (a separate repo) over REST, plus Trigger.dev Realtime.
In the planning workspace, read `../MEMORY.md` first (project context) and update it on important instructions or decisions.
**Read [`RULES.md`](RULES.md) before writing any code.** It holds the coding conventions, naming, errors and testing rules.
**Read [`DESIGN.md`](DESIGN.md) before any UI work.** It is the design system and UI behaviour spec: tokens, components, states and motion.
If this repo sits inside the planning workspace, also read `../AGENTS.md` and `../PRD.md` (§4 fidelity spec, §9 frontend architecture).

## Commands
| Task | Command |
|---|---|
| Install | `pnpm install` |
| Dev | `pnpm dev` |
| Typecheck / lint / test | `pnpm typecheck` · `pnpm lint` · `pnpm test` |
| E2E (Playwright) | `pnpm test:e2e` |
| Live E2E vs real providers (spends credits — ask first) | `pnpm test:e2e:live` |
| Add shadcn component | `pnpm dlx shadcn@latest add <component>` |

Required before every commit: `pnpm typecheck && pnpm lint && pnpm test`.
(M0 creates these scripts with exactly these names. Keep them in sync if they change.)

## Layout
```
src/app/(app)/chat/[[...chatId]]/  empty state + thread
src/app/(app)/usage/               credit ledger
src/services/        typed API modules — the ONLY place that calls fetch for first-party APIs
src/queries/         TanStack Query hooks + centralised query keys
src/stores/          Zustand: composerStore, uiStore, runViewStore
src/features/chat/   thread, message, step-group, renderers/, composer/, overlays/, files-modal/
src/features/realtime/ run subscription, token refresh, reconnect + REST fallback
src/components/ui/   shadcn primitives themed with reference tokens
src/styles/tokens.css  reference CSS variables (copied verbatim, see PRD §4.1)
```

## Rules (repo-specific)
- **Never redefine backend shapes.**
  - Import schemas and types from `@mohitbhalotia/magica-contracts`.
  - Parse every API response and every realtime metadata payload with the contract schema.
  - If a shape is missing, add it to contracts in the backend first.
- **Data access:**
  - Components never call `fetch`. They use `src/queries` hooks, which call `src/services`.
  - Mutations do optimistic updates with rollback.
  - Invalidate queries when a run reaches a terminal status.
- **State split:**
  - TanStack Query holds server state.
  - Zustand holds UI-only and live-run buffers.
  - Use stable, narrow selectors; never subscribe a list to a whole store.
- **Renderer registries:**
  - `blockRenderers[type]`
  - `toolRenderers[kind|name]`
  - `waitpointRenderers[type]`
  - `assetRenderers[kind]`
  New tools, waitpoints and assets are added as registry entries. No `switch` in thread components.
- **Realtime:**
  - Subscribe per run with a scoped token; refresh it before expiry.
  - Reconnect with bounded backoff (≤ 5 attempts), then fall back to REST polling.
  - Batch stream deltas per animation frame.
  - Merge the live buffer with persisted blocks by `(messageId, blockIndex)`, so there are never duplicate terminal messages.
  - On load, hydrate `activeRun` from `GET /chats/:id` and resubscribe.
- **Performance:**
  - Virtualised message list (TanStack Virtual, dynamic heights).
  - Only the streaming block re-renders.
  - Memoise block renderers.
  - Do not auto-scroll while the user is scrolled up; show the scroll-to-bottom button instead.
- **Fidelity:**
  - Use tokens from `tokens.css` only; no ad-hoc hex values or spacing.
  - Copy, icons, sizes, transitions and states must match the reference exactly (PRD §4).
  - Compare against the reference screenshots or the live app before calling UI done.
- **Uploads:**
  - Uppy + `@uppy/transloadit` (tus), with signed params from the backend; never embed Transloadit secrets.
  - Keep attachment order stable in `composerStore.attachmentOrder`.
- **Accessibility:**
  - Keyboard shortcuts: `⌘/Ctrl+K` search, `Ctrl+Shift+O` new task, Enter to send, Shift+Enter for a newline, Esc to close.
  - Focus trap and return in dialogs; `aria-live` run status; labelled icon buttons.
- **Auth:** Clerk. Send the session JWT as a Bearer token to the API via the services layer. The empty state is public, and gated actions open the Clerk sign-in modal.
- **Secrets:** only `NEXT_PUBLIC_*` values that are genuinely public (Clerk publishable key, API base URL).

## Hard rules (summary — full list in workspace `AGENTS.md`)
- Fixed stack: Next.js, strict TypeScript, Zustand, TanStack Query, shadcn + Tailwind, Clerk, Vitest + RTL + MSW + Playwright.
- No other state or data libraries.
- No UI redesigns, no extra tools.
- Secrets never reach the client.

## Git
- Feature branches, Conventional Commits (`feat(composer): …`, `fix(realtime): …`, `test(thread): …`).
- Commit only after the checks pass. Push and open PRs only when the user asks.
- Bump `@mohitbhalotia/magica-contracts` in a dedicated commit or PR.
