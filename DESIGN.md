# DESIGN.md — Magica UI

The design system and UI behaviour spec for `magica_frontend`. Its goal is **pixel parity with the reference product**
(https://app.magica.com/chat, which `app.galaxy.ai/chat` redirects to). The brief says: *"When unsure, match the reference exactly rather than re-designing."*

**Tag key**
- **[Observed]** Measured from the live reference DOM or CSS on 2026-10-17. Copy it exactly.
- **[Decision]** Our choice, made where the reference can't be copied or wasn't observable. Can change.
- **[TBV]** Not yet observed. Verify against the live app before calling the screen done, then update this file.

**Sources**
- `../docs/research/reference-raw/design-tokens.json`: the full `:root` and `.dark` variable dump.
- `../docs/research/reference-ui-notes.md`
- `../.playwright-mcp/*.png`: screenshots.

---

## 1. Principles
1. **Reference first.** Every value comes from a token below. No ad-hoc hex codes, px values or durations in components.
2. **Neutral, quiet UI.** The interface is near-monochrome greys. Colour is reserved for status (success green, error red), step-type icons, and the brand mascot (indigo).
3. **Content-width reading.** The conversation is a centred column of at most 900px, and the assistant writes without a bubble.
4. **Motion is subtle and short.** Durations are 75–300ms, nothing bounces, and every animation respects `prefers-reduced-motion`.

---

## 2. Tokens

**Implementation [Decision]:**
- Copy the reference variable names verbatim into `src/styles/tokens.css`, with `:root` for light and `.dark` for dark.
- Map them with Tailwind v4 `@theme inline` in `src/app/globals.css` (DEC-037): colours `bg-surface-primary`, `text-text-secondary`, `text-icon-primary`, `border-boarder-tertiary`; radius `rounded-radius-l`; type `text-body`, `text-caption` (size + line-height); spacing `p-space-04`; `shadow-xs…xl` and `shadow-popover`.
- Keep the reference's misspelling `--boarder-*` so values can be diffed one to one against the reference.
- shadcn's HSL variables (`--background`, `--primary`, …) come verbatim from the reference dump and are mapped as `hsl(var(--x))`, so shadcn primitives inherit the theme.

### 2.1 Colour — semantic (light / dark) [Observed]
| Token | Light | Dark |
|---|---|---|
| `--surface-main-background` (page canvas) | `#ffffff` | `#111111` |
| `--surface-main-background-2` (sidebar / soft) | `#fafafa` | `#111111` |
| `--surface-main-background-3` | `#ffffff` | `#1a1a1a` |
| `--surface-primary` | `#f7f7f7` | `#1a1a1a` |
| `--surface-secondary` (hover) | `#f1f1f1` | `#1b1b1b` |
| `--surface-tertiary` (pressed / active row) | `#e8e8e8` | `#222222` |
| `--surface-disabled` | `#f7f7f7` | `#1b1b1b` |
| `--text-primary` | `#1b1b1b` | `#f1f1f1` |
| `--text-secondary` | `#585858` | `#9a9a9a` |
| `--text-tertiary` | `#777777` | `#626262` |
| `--text-disabled` | `#bdbdbd` | `#626262` |
| `--icon-primary` | `#343434` | `#f1f1f1` |
| `--icon-secondary` | `#585858` | `#9a9a9a` |
| `--icon-tertiary` | `#777777` | `#626262` |
| `--boarder-primary` | `#bdbdbd` | `#a9a9a9` |
| `--boarder-secondary` | `#dedede` | `#222222` |
| `--boarder-tertiary` (cards, dividers) | `#ededed` | `#222222` |
| `--boarder-action` (focus ring) | `#8a8a8a` | `#a9a9a9` |
| User message background | `#f4f4f4` | `#1f1f20` (`--user-message-background`) |
| Tooltip surface | `#1b1b1b` | — |
| Overlay control (on media) | `#0a0a0b80`, hover `#0a0a0bb3` | same |

### 2.2 Colour — foundation, primary action & status [Observed]
- **Primary button:** a vertical gradient `#3b3b3b → #2b2b2b`; hover `#343434 → #252525`; pressed `#222222`; disabled `#aaaaaa`; label `#f7f7f7`. Pill CTAs such as "Sign up" use a solid `#1b1b1b`.
- **Danger:** `#b42318`, hover `#9f1f15`, pressed `#891b13`, disabled `#d8a09b`. Used for the Delete menu item.
- **Status** (500 = default; dark mode uses 300–400):

| Status | 50 | 500 | 600 | Used for |
|---|---|---|---|---|
| Success (green) | `#e7f5ec` | `#16a34a` | `#12823b` | step check-circle, success text |
| Error (red) | `#fbe9e9` | `#dc2626` | `#b01e1e` | failed step, stop button tint, errors |
| Warning (yellow) | `#fef5e6` | `#f59e0b` | `#c47e09` | Skill ⚡ icon, warnings |
| Info (blue) | `#e6effd` | `#0b62f1` | `#094ec1` | Model-schema 🔧 icon, "View more" link |
| Brand (indigo) | `#edecfc` | `#4f46e6` | `#3f38b8` | mascot logo, accents |

The full 50–1000 ramps are in `design-tokens.json`.

### 2.3 Typography [Observed]
- **Family:**
  - The reference uses `magicaCircular`, a proprietary Circular-style geometric sans, at weights 400, 500, 600 and 700, falling back to Arial and sans-serif. Inter 500 is also loaded.
  - **[Decision]** We use **Figtree** (Google Fonts, variable 400–700) via `next/font` as the closest open substitute, with the same fallback stack. This is pending reviewer confirmation (PRD §14 Q6). It is swappable through one CSS variable, `--font-body`.

| Token | Size / line-height | Use |
|---|---|---|
| display | 36 / 40 | — |
| page-title | 30 / 36 | Page headers (e.g. Usage) |
| heading-lg | 24 / 32 | Empty-state H1 "Your AI worker" (700) |
| heading-md | 20 / 28 | Dialog titles **[TBV]** |
| heading-sm | 16 / 24 | Files modal title (500/600) |
| heading-xs | 14 / 20 | Section labels |
| body / copy | 14 / 24 | Default UI text, composer textarea |
| small | 14 / 20 | Sidebar rows, user message, step labels |
| metadata | 13 / 19.5 | Tool-detail key/value rows, file meta |
| caption | 12 / 16 | Turn credits "◎ 0.22M credits", "Recent tasks" header |
| caption-1 / 2 | 10 / 12 · 8 / 10 | Keycaps, superscript AM/PM |
| tooltip | 10.5 / 15.75 | Tooltips |
| **assistant prose** | **16 / 28** | Assistant Markdown paragraphs (`text-base leading-7`, `mb-4`) |

- **Weights:** 400 for body text; 500 for buttons, sidebar rows and labels; 700 for H1.
- **Letter-spacing:** 0 everywhere.
- **Durations** (`193ms`, `2.2s`) use a monospace, `tabular-nums` face. **[Decision]** `ui-monospace, SFMono-Regular, Menlo, monospace`.

### 2.4 Spacing [Observed]
`--space-00..14` = `0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96` px. Use only these values.

### 2.5 Radius [Observed]
| Token | px | Use |
|---|---|---|
| `radius-m` | 4 | small chips, inner bits |
| `radius-tooltipKeycap` | 5 | keycaps |
| `radius-tooltip` | 6 | tooltips |
| `radius-menuItem` | 8 | dropdown items, detail cards |
| `radius-l` | 10 | sidebar rows, ghost buttons (34px controls) |
| `radius-xl` | 12 | generated media, image thumbs |
| `radius-xxl` | 16 | user bubble, message containers, popovers |
| `radius-xxxl` | 20 | files modal **[TBV]** |
| `radius-xxxxl` | 24 | composer |
| `radius-max` | 999 | pills: Sign up, credits pill, filter chips, send/stop |

### 2.6 Elevation [Observed]
| Token | Light | Use |
|---|---|---|
| `shadow-xs` | `0 1px 2px rgba(26,26,24,.04)` | subtle controls |
| `shadow-sm` | `0 1px 3px rgba(26,26,24,.06), 0 1px 2px rgba(26,26,24,.04)` | buttons, pills |
| `shadow-md` | `0 4px 8px -2px rgba(26,26,24,.08), 0 2px 4px -2px rgba(26,26,24,.04)` | cards on hover |
| `shadow-lg` | `0 12px 16px -4px rgba(26,26,24,.1), 0 4px 6px -2px rgba(26,26,24,.05)` | dropdown menus |
| `shadow-xl` = `shadow-popover` | `0 24px 32px -8px rgba(26,26,24,.12), 0 8px 12px -6px rgba(26,26,24,.06)` | popovers, modals |

Dark mode uses the same geometry with black alpha .2–.55 (see `design-tokens.json`).
Borders: widths `0.5 / 1 / 1.5 / 2` px; the default card border is `1px var(--boarder-tertiary)`.

### 2.7 Component sizes [Observed]
| Token | Value |
|---|---|
| `--magica-sidebar-expanded` / `-collapsed` | 240 / 48 px |
| `--magica-sidebar-header` | 52 px |
| `--magica-control-height` (sidebar rows, menu triggers) | 34 px |
| `--magica-sidebar-header-control` | 28 px |
| `--magica-icon-size` / `-compact-icon-size` | 16 / 14 px |
| `--magica-logo-width × height` | 80 × 20 px |
| `--magica-composer-min-height` | 132 px (max-height 70vh; textarea max 200 px) |
| `--magica-composer-action-control` | 32 px |
| `--magica-send-control` / `-model-control` | 28 px |
| `--magica-credit-control` | 32 px |
| `--magica-tooltip-keycap` | 18 px |
| Search dialog | 512 × 370 (header 44, results 270, footer 48) |
| Content column | composer `max-w-[900px]`; messages ~868 px |
| User bubble max width | 448 px (`max-w-md`) |
| Generated image | 384 × 384 display box, radius 12 |

### 2.8 Motion [Observed]
| Token | Value | Use |
|---|---|---|
| `duration-fast` | 75 ms | button background/colour on press |
| `duration-base` | 150 ms, `cubic-bezier(0.4,0,0.2,1)` | hover colour, opacity, icon rotate |
| `duration-medium` | 200 ms | menus, chevrons, `chat-scale-in` (0.2s ease-out) |
| `duration-slow` | 300 ms | layout (sidebar collapse) |
| `chat-fade-in-up` | opacity 0 → 1, translateY 8px → 0 | new message or block entering |
| `accordion-down/up` | Radix height animation | step-group expand and collapse |
| `cursor-blink` | 50% opacity blink | streaming caret **[TBV] whether shown** |
| `spin` | 1 turn | loading spinners |
| Thinking shimmer | text gradient sweep over `--text-secondary` | "Thinking" label **[TBV] exact keyframe** — the run had finished before capture |
| Step counter | per-digit vertical roll (0–9 column, `tabular-nums`) | "Working · **N** steps" |

All motion is disabled or reduced under `prefers-reduced-motion: reduce`.

### 2.9 Iconography [Observed]
The reference mixes **Lucide** (most icons) and **Tabler** (a few). Default size 16, compact 14, stroke 2. Colours come from `--icon-*`.

| Where | Icon |
|---|---|
| Sidebar: search, new task, tasks, projects, tools, help, unfair advantage | lucide `search`, `circle-plus`, `message-square-more`, `folder-open`, `boxes`, `life-buoy`, `sparkles` |
| Sidebar: library, API / MCP, collapse | tabler `books`, `api-book`, `layout-sidebar` |
| Row menu / more | lucide `ellipsis`, `ellipsis-vertical` |
| Theme toggle | lucide `laptop`, `sun`, `moon` |
| Composer: attach, connect apps, dictation | paperclip **[TBV name]**, tabler `plug` (rotated −45°), mic **[TBV name]** |
| Top bar: files, credits | tabler `folder-open` (20px), tabler `sparkles-2` |
| Step: Skill / Tool search / Model schema / AI Generation | lucide `zap` (warning colour), `search`, `wrench` (info colour), `sparkles` — all 20px (`h-5`) |
| Step status / meta | lucide `circle-check` (12px, success), `clock` (10px), `image` (12px media-type), `chevron-right` / `chevron-down` (12px) |
| Media hover actions | lucide `image-plus` ("Use as reference"), `download` |

---

## 3. Layout

### 3.1 App shell [Observed]
```
┌───────────────┬──────────────────────────────────────────────────────────────┐
│ Sidebar 240   │ Top bar: [Model ▾]                        [📁] [✦ 29.95M]   │
│ (floating     ├──────────────────────────────────────────────────────────────┤
│  card, inset  │                 Thread / empty state                         │
│  8px, radius  │            centred column, max 900px                         │
│  ~16, bg      │                                                              │
│  surface-main │                                                              │
│  -2)          │  ┌──────────── Composer (pinned bottom, max 900) ─────────┐  │
│               │  └────────────────────────────────────────────────────────┘  │
└───────────────┴──────────────────────────────────────────────────────────────┘
```
- **Composer gutter:**
  - Width is `calc(100% − gutter)`, where the gutter is 1rem below `sm`, 2rem from `sm`, 3rem from `md`, and auto-centred at max 900 from `lg`.
  - The wrapper uses `pt-2 pb-1 lg:px-8`.
- **Breakpoints:** Tailwind defaults (`sm` 640, `md` 768, `lg` 1024). **[Observed 2026-10-18]** The sidebar is inline from **`md` (768px)** up and becomes an off-canvas drawer below it.
  - **Drawer trigger:** an "Open sidebar" icon button (tabler `layout-sidebar`) at the far left of the top bar, before the model selector.
  - **Drawer:** the same sidebar card (`--surface-main-background-2`, radius 24), full-width on phones, over a fixed backdrop `--surface-overlay-control` (`rgba(10,10,11,.5)`) with `backdrop-blur-[3px]`, z-40. Esc closes it.
  - On touch widths the task-row "…" buttons are always visible (no hover).

### 3.2 Sidebar [Observed]
- **Header (52):** logo (80×20), plus Search and Collapse icon buttons on the right (28px controls).
- **"New task" row:** 34px, radius 10, 14px weight 500 `--text-secondary`, padding `0 8px`, with a `Ctrl+Shift+O` keycap on the right that **shows on hover only** (`opacity-0 group-hover:opacity-100`, 150ms `cubic-bezier(0.4,0,0.2,1)`; keycap text `--text-primary`) **[Observed 2026-10-18]**. Row hover background `--surface-secondary`.
- **Nav rows:** same row spec, 16px icon with a 10px gap. Hover background `--surface-secondary`; hovered text becomes `--text-primary`.
- **"Recent tasks":**
  - Caption-size header (12px, `--text-tertiary`) with a chevron that appears on hover, and "View all" on the right.
  - Task rows: 34px, truncated, `pl-8 pr-8`; the right padding grows to 40 on hover to make room for the "…" button (24px, radius 4).
  - Active row: background `--surface-tertiary`, rounded, with `aria-current="page"`.
- **Pinned [Observed 2026-10-18]:** pinned chats move into their own **"Pinned tasks"** section above "Recent tasks" (same caption header style; the section disappears when nothing is pinned). Rows look identical to recent rows — no pin icon. Pinning or unpinning does not reorder chats by activity.
- **Empty list:** centred "No tasks yet" (14px, `--text-secondary`).
- **Loading:** grey skeleton bars, about 10 rows of varying widths.
- **Footer:** a divider, then "⋮ More", then the user button (avatar circle + name). Signed out, there is a "Magica 101" card, "Claim Offer" and "Sign in".
  - **[Observed 2026-10-18]** Only "More" and the user button are visible. Available Credits (link to `/usage`), Add Credits, Settings, Updates, "Invite team members" and the System / Light / Dark theme tabs live inside the **More** menu.
  - **[Observed 2026-10-18] "More" expands inline** (not a dropdown); the row reads **"Less"** while open (lucide `ellipsis-vertical`, 14px weight 400). Panel, top to bottom:
    - "Available Credits" (12px) with the value right-aligned (12px/500 `--text-secondary`, tabular).
    - "Add Credits": h32, radius 10, dark gradient, 12px/500, lucide `wallet`, shadow `0 0 0 1px #303030, inset 0 1px 0 rgba(255,255,255,.15), 0 1px 3px rgba(0,0,0,.2)`.
    - "Settings" (lucide `settings`) and "Updates" (lucide `sparkles`): two outlined h28 buttons, gap 8.
    - "Invite team members": outlined 34px row, lucide `users` and `arrow-right`.
    - Theme tabs: h32 pill, 1px border, padding 2; tabs are h24 with 14px lucide `laptop` / `sun` / `moon` (aria "System theme" / "Light theme" / "Dark theme"); a sliding `--magica-foundation-surface-hover` indicator moves over 200ms.
  - User button: Clerk trigger, full width, 34px; avatar on the left, name right-aligned (13px/500).
- **Logo [Observed 2026-10-18]:** `/magica.png` at 80×20 (`object-contain object-left`, `dark:invert`). The rail mark is `/magica_logo_collapsed_{light,dark}.svg` at 18×13, which fades to tabler `layout-sidebar` on hover. Both are copied to `public/`.
- **Header controls [Observed 2026-10-18]:** the logo button is "Start a new task"; the icon buttons are "Search" and "Close sidebar" (28px, round, 2px gap).
- **Collapsed rail [Observed 2026-10-18]:** 48px wide. "Open sidebar" (logo mark, 34px), then Search (28px, 16px below), then New task and the 7 nav items as 34px icon buttons with 4px gaps; "Settings" (32px) sits at the bottom. No task list and no footer.

### 3.3 Top bar [Observed]
- **Left:** model selector button (28px), with a small black rounded-square logo, the model name (14px/500) and a chevron-down. It is **disabled and dimmed** while a run is active.
- **Right:**
  - Files button: 36px circle, `--surface-primary`, tabler folder-open.
  - Credits pill: 32px, radius max, sparkle icon and `29.95M` (14px/500).
  - **[Observed 2026-10-18]** The reference now shows a dark **"Computer"** pill (lucide `monitor`, aria "Open computer"; icon-only on mobile) in place of the files button. It is a reference feature outside our brief's tool surface → render it inert ("Not available in this build"), or keep our files button; logged in PRD §14.
  - The model button reads "Magica Auto" in the reference; ours reads "OpenRouter Free" (§4.3).
- **Signed out [Observed 2026-10-18]:**
  - **Top bar:** a "Magica 101" pill absolutely centred in the header (`bg-surface-secondary`, h28, px12, 14px/500, hidden below `sm`), plus "Sign in" (ghost pill, h32) and "Sign up" (`bg-text-primary` / `text-surface-main-background`, h32, px12, `shadow-sm`, hover opacity 90).
  - **Sidebar:** shows "No tasks yet" (py32). The footer has a "Magica 101 / Learn what Magica can do" card (white, radius 16, 16px mascot) above More, then a centred filled "Sign in" (h34, `--surface-secondary`, radius 10).

---

## 4. Components

Each component lists its anatomy, its states, and the copy to use. Use shadcn primitives (Radix) underneath and restyle them with the tokens.

### 4.1 Button family [Observed]
| Variant | Spec |
|---|---|
| Primary | gradient primary (§2.2), text `#f7f7f7`, radius 10 or max, h34 / h32, `shadow-sm` |
| Pill CTA | `#1b1b1b`, white text, radius max, h32, px12 |
| Secondary | `--surface-primary` background, hover `--surface-secondary` |
| Ghost / icon | transparent, hover `--surface-secondary`, icon `--icon-secondary` → `--icon-primary` on hover |
| Outline pill | 1px `--boarder-tertiary`, white background, h32, e.g. "⤓ Download all" |
| Danger item | text `#b42318` with lucide `trash`, used in menus |

- **Focus:** `focus-visible:ring-2 ring-[--boarder-action]` with no outline. Disabled is `opacity-50` with `pointer-events-none`.

### 4.2 Composer [Observed]
- **Container:**
  - Radius 24, padding `16 16 12`, min height 132.
  - Background: a gradient `from-surface-primary to-surface-main-background` (top to bottom). Dark mode uses a flat `--surface-main-background-3`.
  - No shadow and no border. **Focus: no visual change** — the container keeps the same border, shadow and background; only the caret (`--text-primary`) appears **[Observed 2026-10-18]**.
  - **Edge [Observed 2026-10-18]:** an absolutely-positioned overlay draws an inset 1px ring, `--boarder-secondary` (#dedede), darkening to `--boarder-primary` (#bdbdbd) when the composer is hovered (150ms).
  - **Buttons [Observed 2026-10-18]:** all action buttons, Send included, are 32px circles.
    - Empty Send: `--surface-main-background-2`, `--icon-secondary`, opacity 50, `cursor-not-allowed`.
    - Ready Send: `--surface-primary-active` (#2b2b2b), white arrow, hover opacity 90.
    - "Choose project": h32, px8, 14/500 `--text-secondary`, lucide `folder` + label.
- **Textarea:** 14/24, transparent background, auto-grow up to 200px then scroll, placeholder colour `--text-tertiary`.
  - Empty state: "Assign a task or ask anything..."
  - In a thread: "Send a message..."
- **Action row:**
  - Left: Attach (lucide `paperclip`) and Connect apps (tabler `plug` rotated −45°), 32px ghost icon buttons.
  - Right: Dictation (lucide `mic`) and the Send / Stop button (28px circle).
  - **[Observed 2026-10-18]** The reference added **"Choose project"** (lucide `folder`) between Attach and Connect apps; it shows the icon plus the label "Choose project" (desktop and mobile). Projects are out of scope → inert with the "Coming soon" tooltip, like Connect apps.
- **Send states:**

| State | Look | Behaviour |
|---|---|---|
| empty | `--surface-primary` circle, arrow-up `--icon-disabled` | disabled; tooltip "Add a message first" |
| ready | `#1b1b1b` circle, white arrow-up | Enter sends |
| sending | ready look + spinner **[TBV]** | double submit blocked by `clientMessageId` |
| running | **red-tinted circle** (`--alias-error-a100` background) with a red `#dc2626` filled square | click → stop; textarea stays editable |
| stopping | spinner in the stop circle **[TBV]** | — |
| blocked (no credits) | disabled; inline notice above the composer **[TBV copy]** | link to /usage |

- **Attachment chips [TBV]:** above the textarea. Thumbnail 48–56px, radius 8, progress ring or bar, ✕ to remove, retry on error. Order is stable.
- **Plan-mode toggle [TBV]:** placement unknown. Ask the reviewers before building it.
- **OpenRouter Free status [Decision]:** the model selector shows "OpenRouter Free". Once `/models/status` exists (M2), a 6px status dot (green, amber or red) goes in the menu item's subtitle line. This keeps the reference's top-bar layout instead of adding new composer chrome.

### 4.3 Model selector menu [Observed]
- **[Observed 2026-10-18]**
  - **Trigger:** h28, padding 4×8, gap 8, radius 10. A 12px `magica_favicon_black.svg` (with `dark:invert`), the name (14px/400), and a 14px chevron that flips while the popover is open. Hover and open background: `--magica-foundation-surface-hover`.
  - **Popover:** a role="dialog" popover; 360 wide, radius 16, 1px `--boarder-tertiary`, padding 16, `shadow-md`.
  - **Item:** h54, padding `8 24 8 12`, gap 10, radius 10, with a 20px logo, title 14px/400, and subtitle 12px `--text-secondary`, all on one line (`whitespace-nowrap`). The selected item has a `--surface-primary` background.
- **[Decision]** A single item: "OpenRouter Free" / "Picks an available free model for your task". The reference lists Magica Auto, Fast, Flash, Max and Pro Max.

### 4.4 Empty state [Observed]
- **Centred stack:**
  - Mascot (indigo, ~40px).
  - Local time, e.g. "12:01" with a superscript "PM" in caption-2.
  - H1 "Your AI worker" (24/32, 700).
  - Subtitle "Work at the speed of thought." (14px, `--text-secondary`).
  - The composer, below it.
- **Idea tabs:** pill tabs. The selected one has a `--surface-primary` background with `--text-primary`; the rest are plain `--text-secondary`.
  - Copy: All, Viral Video Formats, Video Special Effects, Content Creation, Branding & Design, Image & Editing.
- **Idea cards:** masonry, 3 columns on desktop and 2 on mobile. Media thumbnail, radius 12, with the title at the bottom on a white fade.
  - Clicking a card **fills the composer** and doesn't send.
  - "See more ideas" button at the end.
- **Data (user call, 2026-10-18; replaces our own 12 ideas):**
  - The reference's own 30 "All" ideas (title, prompt, tabs, media) were captured read-only into `src/features/ideas/ideas.json` and Zod-checked at load.
  - Media comes from the reference's public CDN (`g.tlcdn.com`, `galaxyai.tlcdn.com`). Videos use `preload="none"`, are muted and looping, and play only while hovered or focused (unless reduced motion). Images go through `next/image`.
  - Tabs filter those 30, so most tabs show a few cards (the reference loads 22–30 per tab from its server). "See more ideas" shows the not-available toast.
  - Many prompts ask for video models we don't have (Seedance, Kling); the agent will explain what it can do instead.
- **[Observed 2026-10-18] Exact values:**
  - **Hero:** a 448-wide stack, padding-top 113 (40 on mobile), 40px mascot.
  - **Time:** 13px/500, `--text-secondary`, tracking .01em, margin-top 19 (14 on mobile). "PM" is caption-1, shifted by (−3px, −5px). Formatted en-US 12-hour on every locale.
  - **Heading and tagline:** h1 24/32 bold (20 on mobile), margin-top 4; tagline 14/24, 500 weight, margin-top 8.
  - **Spacing:** 48 between the hero and the composer, 32 between the composer and the tabs, 32 between the tabs and the cards.
  - **Tabs:** h34, px10, radius 10, 14/500, spread `justify-between` across 900, scrolling sideways on narrow screens. The active tab is `--surface-secondary` with foreground text.
  - **Cards:** radius 16, 1px `--boarder-secondary`, `--surface-main-background-2`, `shadow-xs`. Media on top, then a title footer (px8, pt4, pb8, 14/500, one line). Three columns with a 16px gap (two columns, 12px gap, on mobile).
  - **"See more ideas":** h36, px12, radius 10, 1px border, `--surface-main-background-3`, `shadow-xs`, margin-top 32.
- **Ours:** all 30 ideas shown at once. Clicking a card sets the new-chat draft in `composerStore`. CSS columns balance the masonry slightly differently from the reference (its third column starts one card earlier).

### 4.5 Messages [Observed]
- **User message:**
  - Right-aligned; background `#f4f4f4` (dark `#1f1f20`); radius 16; padding 6×16; max width 448; 14/20; `whitespace-pre-wrap`; `break-words`.
  - Attachments render above the bubble **[TBV]**.
  - **Hover row [Observed 2026-10-19]:** 4px under the bubble, right-aligned: the time (12/500 `--text-primary`), then Copy (28px, 14px icon). It reserves its 28px even when hidden, so the next message starts 24px below it (56px below the bubble).
- **Assistant message:**
  - No bubble, full column width.
  - Prose 16/28, paragraph margin 16, lists at the same size, `**bold**` at 600–700.
  - Headings, code and tables **[TBV]**. Default: Tailwind Typography with tokens.
- **Turn footer** (after the final block, once complete) **[Observed 2026-10-19, measured]:**
  - `◎ 0.05M credits`: 10/12px, `#585858`, coin icon; 12px under the text, 4px above the actions. Shown from M4 (LLM turns are 0 credits).
  - Action row, gap 2px: 28px ghost buttons with 14px icons in `#585858` (`--icon-secondary`): Copy (lucide `copy`), Fork chat (lucide `git-fork`, out of scope → toast), Good response, Bad response; then, 8px later, the time 12/500 `--text-primary`: "12:40 PM" today, "Oct 17" for older days.
- **Columns [Observed 2026-10-19]:** messages 868px wide; the in-thread composer is 900px (16px wider on each side) and has **no "Choose project"** (only Attach and Connect apps on the left).
- **Loading [Observed 2026-10-19]:** a 192×40 user-bubble skeleton, then 7 and 2 grey lines (12px tall, 24px pitch) for the reply.
- **Spacing:** ~24px between messages; 40px between a user message and the assistant turn **[Observed approx.]**.
- **Entry animation:** `chat-fade-in-up` at 200ms.
- **Chat page states [Decision, not observed]:** our reference session expired before we could check these.
  - Loading: see **Loading** above (observed later).
  - Missing, deleted or someone else's chat (all 404): "Task not found" / "It may have been deleted, or the link is wrong." with a "New task" pill.
  - Other errors: "Couldn't load this task" with the safe API message.
  - Signed out: "Sign in to see this task" with a Sign in pill.
  - `/chat` and `/chat/<id>` are separate routes. `/chat/a/b` matches neither, so it returns a real 404. The original optional catch-all made Vercel serve the empty state for chat URLs on a full page load (found in the live check on 2026-10-19).

### 4.6 Step group & step rows — core streaming UI [Observed]
**Group header** (14/20, `--text-secondary`, hover `--text-primary`, with a chevron-down 12px):
- Running: `Working · <N> steps` (the digit rolls when N changes; "step" is singular for 1).
- Done: `Completed <N> steps`. The group **auto-collapses** when it completes.
- Waiting: **[TBV]** e.g. `Waiting for you`.
- Failed or stopped: **[TBV]** e.g. `Failed after N steps`, `Stopped`.

**Before the first step:** the row reads `⌄ Thinking` with a shimmer. It turns into the group header once the first tool call arrives. Thinking duration is stored in metadata (`thinkingDurationSeconds`).

**Step row** (height ~36, icon column 20px, 8px gap):
```
[icon 20] Label  [✓ 12]  [⏱ 10] 193ms                         0.005M  [⌄]
          ┌─ detail card (indented ≈28px, 1px --boarder-tertiary, radius 8, p 12) ─┐
          │ Key (13px, --text-secondary, col ≈88px)   Value (13px, --text-primary) │
          └────────────────────────────────────────────────────────────────────────┘
```
| Kind | Icon (colour) | Label | Collapsed detail | Expanded card |
|---|---|---|---|---|
| Skill | `zap` (warning-500) | Skill | — (skill name in the card) | Skill · `<name>` |
| Model discovery | `search` (icon-primary) | Tool search | — | Query · `<q>` (shown **open** by default) |
| Schema | `wrench` (info-500) | Model schema | — | Model ID · `<id>` (open by default) |
| Media generation | `sparkles` (icon-primary) + `image`/`video` 12px | AI Generation | — | Model, input media preview (max 384, radius 12), params (first 3 rows + **"View more"** link in info-500), output media |

- **[Observed 2026-10-19]** A crop step is labelled **"Image crop"** (with its credits, `0.005M`), not "AI Generation". Rows show their duration (`193ms`, `2.2s`) after the status icon (lucide `clock` 10px, `text-text-secondary/40 text-caption tabular-nums`); billed rows (AI Generation, Image crop) show their credits instead, with no duration. The group header digit rolls ("Completed 7 steps").
- **"View more" [TBV]:** the only reference media card seen (2 rows) has no "View more", so whether it turns into "View less" is unverified; ours expands and the link goes away.

**Step status:**

| State | Look |
|---|---|
| running | spinner in the status slot, live elapsed time |
| completed | lucide `circle-check`, success-500 |
| failed | red ✕ circle; the card shows the safe error and code **[TBV] exact look** |
| cancelled | grey, no check **[TBV]** |
| waiting (approval) | **[TBV]** |

- Duration: `<1s` → `193ms`, otherwise one decimal (`2.2s`, `25.5s`), in mono `tabular-nums`.
- Credits: billable steps only, right-aligned, `0.005M` format (§6).

### 4.7 Generated media [Observed]
- **Inline in the turn, after the text it relates to:**
  - Image: 384px wide box, radius 12, `object-contain` on a `--surface-primary` letterbox.
  - Video: the same box with a native player **[TBV] controls styling**.
  - Audio: **[TBV]**.
- **Hover overlay:** round buttons on `--surface-overlay-control` (white icons), "Use as reference" (`image-plus`) and "Download" (`download`), top-right.
- **Multiple assets:** stacked vertically, with an outline pill "⤓ Download all" right-aligned below them (aria-label "Download all N generated assets").
- **Loading [TBV]:** a skeleton box at the target aspect ratio with a pulse, shown while the step is running.

### 4.8 Files modal [Observed 2026-10-19, measured]
- **Opened from** a "View all files in this task" button in the top bar, shown **inside a chat** to the right of the Computer pill (8px gap); the empty state shows only Computer.
  - Button: `inline-flex rounded-radius-max border-[length:var(--border-width-xs)] border-boarder-tertiary bg-surface-main-background-2 p-space-03 text-icon-primary hover:bg-surface-primary`, tabler `folder-open` 20px (stroke 1.5) → 37.6px circle.
- **Dialog:** `h-[75vh] w-full max-w-[600px] rounded-2xl` (16px), 1px border, white surface, `shadow-elevation-xl`; mobile `h-[calc(100dvh-1rem)] rounded-xl`.
- **Header** (`px-5 py-4`, bottom border `--boarder-tertiary`): "All files in this task" (`text-base font-semibold`), then ghost buttons (`rounded-lg px-3 py-1.5 text-sm font-medium text-text-secondary`, hover `bg-surface-secondary`): "Select all", "⤓ Download all" (disabled at 50% when nothing to download), and a 36px ✕ ("Close").
- **Filter chips** (`rounded-full px-3.5 py-1.5 text-sm`, h32, 8px apart): "All 2", "Documents", "Images 2", "Videos", "Audio", "Code files"; the count is a `ml-1 opacity-60` span, shown only when > 0.
  - Selected: `bg-surface-overlay-control font-medium text-text-on-action`. Others: `bg-surface-secondary text-text-secondary`, hover `text-text-primary`.
- **List:**
  - Day header: the full date, "Saturday, October 17, 2026" (`text-xs font-medium text-text-secondary`).
  - Row (`group flex items-center gap-3 px-5 py-2.5`, hover `bg-surface-secondary/50`): a checkbox ("Select <name>", visible on hover), a 40px thumbnail (`rounded-lg bg-surface-secondary`, `object-cover`), the filename (`text-sm font-medium`, truncated), the meta "PNG · Sat, Oct 17 · 1.1 MB" (`text-xs text-text-secondary`), and an `ellipsis` button ("Open actions for <name>", 28px, visible on hover).
  - Row menu: **Preview** (lucide `layout-grid`), **Download** (`download`), **Copy URL** (`file-text`).
  - Without a filename the reference shows "image file" and meta "IMAGE · Sat, Oct 17".
- **Loading:** a centred spinner. **Empty:** **[TBV] copy**.

### 4.9 Popovers & menus [Observed]
- **Attach popover:**
  - About 245px wide, radius 16, `--surface-primary` background, padding 16.
  - Copy (13px, `--text-secondary`): "Add a file from your device or select one from your library".
  - Then a full-width secondary button "🖼 Select Asset" and a primary black button "+ Upload". Both are h40 with radius 10.
- **Credits popover:**
  - About 300px wide, radius 16, `shadow-popover`, padding 16.
  - Plan label "HOBBY" (caption caps, 600), then "Available Credits" with the balance (16px/700).
  - Primary "Add Credits" (full width, h40), a caption-caps "EXPLORE PLANS" section, a "Compare plans / Find the right plan for you ↗" card, and chips "View usage" and "Billing details".
- **Task row menu:**
  - **[Observed 2026-10-18]** 180px wide, radius 10, padding 5, white, shadow `0 4px 12px rgba(0,0,0,.14)`. Items h32, radius 8, padding `0 9px`, gap 8, 14px `#5e5e5e` (the focused item is `--text-primary`); icons 16px at stroke 1.5.
  - Items: **Pin to top** (tabler `pin`) — or **Unpin** (tabler `pinned-off`) when pinned — **Rename** (tabler `pencil`), **Duplicate** (tabler `copy`), **Add to project** (lucide `folder-input`, ›), **Delete** (tabler `trash`, `#dc2626`).
- **Tooltip [Observed 2026-10-18]:** `#1b1b1b` background, 1px `--magica-tooltip-border`, `#f7f7f7` text at 10.5px/600 (line-height 15.75), radius 6, no arrow, 4px from the trigger. The reference pads `4 4 4 8`; ours pads 4×8 on both sides (user call: the 4px right edge looked cramped). Composer tooltips show the button's own name ("Attach files", "Connect apps", "Dictation"), and the empty Send shows "Add a message first". Keycaps are 18px with radius 5 at `rgba(255,255,255,.15)` **[TBV]**.

### 4.10 Search dialog (⌘/Ctrl+K) [Observed 2026-10-18]
- **Dialog:** 512 × 370, white, radius 24, Tailwind `shadow-lg` (`0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -4px rgba(0,0,0,.1)`). Accessible name "Search tasks", description "Search your recent tasks and open an existing task or start a new one."
- **Header (44):** lucide `search` icon, input (14px, h40, placeholder **"Search"**, aria "Search projects and tasks"), and an `esc` keycap button (aria "Close") on the right.
- **Results panel:** a `--surface-primary` rounded panel (radius ~16) holding a listbox "Suggestions" with a caption group label **"Tasks"**.
  - **Row:** h40, pill (radius 999), px 16, 14px `--text-secondary`, lucide `message-circle` at the compact icon size; the **selected/hovered row is white** (`--surface-main-background`). Shows the **title only**, with the matched text in **bold** (`font-weight: 700`) — no snippet line.
  - Empty query lists recent tasks. After results: centred caption **"End of search results"** (`--text-secondary`).
- **Footer (48):** right-aligned "New task" with keycaps `Ctrl` `Shift` `O`.
- ↑/↓ move the selection, Enter opens, Esc closes.
- **Ours:**
  - The results panel is inset 4px. Keycaps are grey sans-serif pills (`--surface-secondary`, 18px, radius 5). The footer "New task" is `--text-primary`.
  - Typing is debounced 200ms; an empty query lists the sidebar's cached first page. Search covers titles and message text (substring, DEC-049), first page only.
  - The open dialog is built per open, so it starts empty each time. ⌘K toggles it.
  - **[Decision]** Empty results: "No tasks found". The overlay uses the drawer's tint + 3px blur **[TBV]**.

### 4.11 Approval / waitpoint overlay [TBV — not observed]
**[Decision]**, until verified against the reference:
- An inline card anchored **above the composer** within the 900 column. Radius 16, 1px `--boarder-tertiary`, `shadow-md`, padding 16.
- Contents: a title, a body specific to the waitpoint type, then actions (primary "Approve"/"Continue", secondary "Cancel"), and an expiry countdown in caption text.
- Focus moves to it when it appears, and it is announced via `aria-live`.
- Expired state: "This request expired. Reply to continue." and the card dims.
- Renderers by type: `options` (radio list), `plan_approval` (Markdown plan), `credit_approval` ("This will use ~0.27M credits"), `media_approval`.

### 4.12 Error, failed & cancelled turns [TBV — not observed]
**[Decision]**, until verified:
- The partial content stays rendered.
- A notice block below it reads "Something went wrong — <safe message>". It is caption-size, uses `--text-error`, has a `circle-alert` icon and a copyable `traceId`, plus a "Retry" outline pill.
- Cancelled turns read "Stopped" in `--text-tertiary`, with no error colour.
- Free-model unavailable: "Free models are busy right now. Try again in a minute."

### 4.13 Toasts [Observed 2026-10-18]
- **Look:** shadcn **Sonner** at the **top right**. A white card (about 386px wide, radius 16, `shadow-lg`, 1px `--boarder-tertiary`) with a 14px semibold title, a 14px `--text-secondary` description, and a close ✕. The reference's region is "Notifications (F8)".
- **Observed copy:** after Duplicate, "Task duplicated" / "The copied task and its message history are ready." Rename and Delete show no toast.
- **[Decision]** Also used for out-of-scope affordances ("Not available in this build") and for non-blocking errors (the `ApiError` message, which is user-safe, plus a generic fallback).

### 4.14 Task actions [Observed 2026-10-18]
- **Rename:** inline. The row becomes a pencil icon plus an input (placeholder "Untitled task", text pre-selected, ring `--boarder-action`). Enter or blur saves; Escape cancels. No toast.
- **Duplicate:** a "Duplicate task" dialog first.
  - Panel: 448 wide, padding 24, radius 16, 1px `--boarder-tertiary`, `shadow-lg`, gap 16. The backdrop is a 3px blur with no tint.
  - Title (14/600), then "Create an exact copy of the task “<title>” and all its messages."
  - A "Complete task copy" card (lucide `copy`, radius 10, padding 16), with the text "All messages will be copied to a new task. The original task will remain unchanged."
  - Buttons: "Cancel" (outlined) and "Duplicate task" (`#2b2b2b`, lucide `copy`), both h34 with radius 10, plus a close ✕.
  - On confirm it **navigates to the copy**, titled **"<title> - Copy"**, which appears at the top of Recent, and shows the toast above.
- **Delete:** a "Delete task?" **alertdialog**.
  - Panel: 512 wide; title 18/600; body "This task will be permanently deleted and cannot be recovered."
  - Backdrop `--surface-overlay-control` with a 3px blur.
  - Buttons: "Cancel" (outlined pill, h36) and "Delete" (`--magica-foundation-danger` pill, h36).
  - No toast. Deleting the open chat navigates to `/chat`.

---

## 5. Behaviour & interaction

### 5.1 Streaming
- New blocks enter with `chat-fade-in-up`. Text deltas are appended per animation frame, not per token.
- Order within a turn: Thinking, then a step group, then text, then (optionally) another step group, then text, then media, then the footer. Block order always follows the server's `blockIndex`.
- **Scrolling:**
  - Follow the bottom only while the user is at the bottom (within 80px).
  - Otherwise, show the floating **scroll-to-bottom** button: a 32px white circle with `shadow-sm` and an arrow-down, centred above the composer.
- **Reload mid-run:** the persisted blocks render immediately, then the live stream resumes. There is no flash of an empty state and no duplicate blocks.

### 5.2 Chat lifecycle in the sidebar [Observed]
On send from the empty state:
1. The row appears instantly at the top as "New chat" (active).
2. Within about a second it becomes the truncated first prompt.
3. After the first turn it becomes the AI title.

The URL changes to `/chat/<id>` without a full reload, and the document title becomes `<title> | Magica`. Ours matches: "Magica" by default, `<title> | Magica` on a chat, with the reference favicon (user call, 2026-10-18).

### 5.3 Keyboard [Observed + Decision]
| Keys | Action |
|---|---|
| ⌘/Ctrl + K | Search dialog |
| Ctrl + Shift + O | New task |
| Enter / Shift+Enter | Send / newline |
| Esc | Close popover, dialog or menu; while running, focus stays (stop is click-only) **[Decision]** |
| ↑ / ↓ / Enter | Navigate menus and search results |
| Tab order | sidebar, then top bar, then thread, then composer; dialogs trap focus and return it on close |

### 5.4 Accessibility
- Icon buttons have `aria-label` text matching the reference: "Attach files", "Connect apps", "Dictation", "Send message", "View all files in this task", "Credits available: 29.95M. Click for plan details.", "Chat actions", "Copy", "Fork chat", "Good response", "Bad response", "Use as reference", "Download".
- The step counter has `aria-label="<N>"`. Run status changes are announced in an `aria-live="polite"` region ("Thinking", "Working, 3 steps", "Completed", "Failed: …").
- Contrast: `--text-tertiary` `#777` on white is 4.48:1. Use it only for caption-size metadata the reference also uses it for; never for actionable text.
- `prefers-reduced-motion` disables the shimmer, the digit roll and fade-ups (instant swap instead).

### 5.5 Responsive [Observed partially]
- Below `lg`, the sidebar hides and the top bar keeps the model selector and the right-side controls. The composer is full width with a 16px gutter. Idea cards use 2 columns.
- The thread on mobile and the drawer trigger **[TBV]**.

---

## 6. Formatting rules [Observed]
- **Credits:** stored in microcredits and shown in millions with a trailing `M`: `29.95M`, `0.22M`, `0.005M`.
  - Step-level values keep up to 3 decimals.
  - Balance and turn totals use 2 decimals.
  - Trailing zeros are trimmed **[TBV] rounding mode**.
- **Durations:** `<1000ms` → `193ms`; otherwise `x.ys` with 1 decimal; `≥60s` → `1m 05s` **[Decision]**.
- **Times:** locale `h:mm A` ("12:40 PM"). Day groups read "Today" / "Yesterday" / `MMM d`.
- **File meta:** `PNG · 12:40 PM · 1.1 MB`. The extension is uppercase and the size uses 1 decimal in KB, MB or GB.

---

## 7. Theming
- The three-way theme toggle (System / Light / Dark) sits in the sidebar footer (`laptop`, `sun`, `moon`), via `next-themes` with `class` strategy **[Decision]**.
- Dark values come from the `.dark` block in §2.1. Verify the dark thread rendering **[TBV]**.

---

## 8. Do / Don't
- ✅ Use token classes (`bg-surface-primary`, `text-text-secondary`, `rounded-radius-xxl`).
- ✅ Measure against the reference in Playwright (computed styles) when unsure, then add the value here.
- ✅ Register new step kinds, blocks, waitpoints and assets in the renderer registries, using the visual specs above.
- ❌ No new colours, shadows, radii, font sizes or durations outside the tokens.
- ❌ No redesigns or "improvements". If the reference looks off, log it in PRD §14 for the reviewers.
- ❌ No layout shift while streaming. Reserve space for media at its aspect ratio.

---

## 9. Open items checklist (move to [Observed] when verified)
- [ ] Thinking shimmer keyframe and timing
- [ ] Streaming caret (shown or not)
- [ ] Failed, cancelled and stopped turn and step styling and copy
- [ ] Waiting and approval group header and overlay
- [ ] Plan-mode toggle placement
- [ ] Insufficient-credits copy and placement
- [ ] Attachment chips in the composer and on user messages
- [ ] Video and audio result cards
- [x] Search dialog results UI (2026-10-18, §4.10)
- [x] Mobile drawer trigger and breakpoint (2026-10-18, §3.1) — mobile *thread* still open (M2)
- [ ] Dark-mode thread
- [x] Composer focus state (2026-10-18, §4.2)
- [x] New-task keycap on hover; paperclip/mic icon names (2026-10-18, §3.2, §4.2)
- [x] Pinned-row styling: separate "Pinned tasks" section (2026-10-18, §3.2); row menu values (§4.9)
- [ ] Files modal radius and empty state
- [ ] Credit rounding rules
