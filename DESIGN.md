# DESIGN.md — Agent Chat UI

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
- Map them in `tailwind.config.ts` (e.g. `bg-surface-primary`, `text-text-secondary`, `rounded-radius-l`).
- Keep the reference's misspelling `--boarder-*` so values can be diffed one to one against the reference.
- shadcn's HSL variables (`--background`, `--primary`, …) are also defined, so shadcn primitives inherit the theme.

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
- **Breakpoints [Decision]:** Tailwind defaults (`sm` 640, `md` 768, `lg` 1024). The sidebar becomes an off-canvas drawer below `lg` **[TBV] exact breakpoint and the drawer trigger**.

### 3.2 Sidebar [Observed]
- **Header (52):** logo (80×20), plus Search and Collapse icon buttons on the right (28px controls).
- **"New task" row:** 34px, radius 10, 14px weight 500 `--text-secondary`, padding `0 8px`, with a `Ctrl+Shift+O` keycap on the right that shows on hover **[TBV]**.
- **Nav rows:** same row spec, 16px icon with a 10px gap. Hover background `--surface-secondary`; hovered text becomes `--text-primary`.
- **"Recent tasks":**
  - Caption-size header (12px, `--text-tertiary`) with a chevron that appears on hover, and "View all" on the right.
  - Task rows: 34px, truncated, `pl-8 pr-8`; the right padding grows to 40 on hover to make room for the "…" button (24px, radius 4).
  - Active row: background `--surface-tertiary`, rounded, with `aria-current="page"`.
- **Empty list:** centred "No tasks yet" (14px, `--text-secondary`).
- **Loading:** grey skeleton bars, about 10 rows of varying widths.
- **Footer:** a divider, then "⋮ More", then the user button (avatar circle + name). Signed out, there is a "Magica 101" card, "Claim Offer" and "Sign in".

### 3.3 Top bar [Observed]
- **Left:** model selector button (28px), with a small black rounded-square logo, the model name (14px/500) and a chevron-down. It is **disabled and dimmed** while a run is active.
- **Right:**
  - Files button: 36px circle, `--surface-primary`, tabler folder-open.
  - Credits pill: 32px, radius max, sparkle icon and `29.95M` (14px/500).
- **Signed out:** a centre "Magica 101" pill, plus "Sign in" (ghost) and "Sign up" (black pill, h32, px12, `shadow-sm`).

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
  - No shadow and no border **[TBV] focus state**.
- **Textarea:** 14/24, transparent background, auto-grow up to 200px then scroll, placeholder colour `--text-tertiary`.
  - Empty state: "Assign a task or ask anything..."
  - In a thread: "Send a message..."
- **Action row:**
  - Left: Attach (paperclip) and Connect apps (plug rotated −45°), 32px ghost icon buttons.
  - Right: Dictation (mic) and the Send / Stop button (28px circle).
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
- **OpenRouter Free status [Decision]:** the model selector shows "OpenRouter Free" with a 6px status dot (green, amber or red) in the menu item's subtitle line, e.g. "Free models · Available". This keeps the reference's top-bar layout instead of adding new composer chrome.

### 4.3 Model selector menu [Observed]
- **Popover:** white, radius 16, `shadow-popover`, padding 8, width ~360.
- **Item:**
  - 20px black rounded-square logo, title (14px/500) and subtitle (13px `--text-secondary`).
  - Padding 12; hover and selected background `--surface-primary`, radius 8.
- **[Decision]** A single item: "OpenRouter Free" / "Free models router — picks an available free model". The reference lists Magica Auto, Fast, Flash, Max and Pro Max.

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
- **Data [Decision]:** a static JSON of ~12 ideas with our own thumbnails, all achievable with our 3 tools. The reference's video-template ideas need tools we don't have, so we mirror the layout, not the content.

### 4.5 Messages [Observed]
- **User message:**
  - Right-aligned; background `#f4f4f4` (dark `#1f1f20`); radius 16; padding 6×16; max width 448; 14/20; `whitespace-pre-wrap`; `break-words`.
  - Attachments render above the bubble **[TBV]**.
  - Hover shows the time ("12:39 PM") **[TBV] position**.
- **Assistant message:**
  - No bubble, full column width.
  - Prose 16/28, paragraph margin 16, lists at the same size, `**bold**` at 600–700.
  - Headings, code and tables **[TBV]**. Default: Tailwind Typography with tokens.
- **Turn footer** (after the final block, once complete):
  - `◎ 0.22M credits`: caption 12px, `--text-tertiary`, coin icon 12px.
  - Action row, 28px ghost icons: Copy, Fork chat (out of scope → toast), Good response, Bad response, then the time "12:40 PM" (caption).
- **Spacing:** ~24px between messages; 40px between a user message and the assistant turn **[Observed approx.]**.
- **Entry animation:** `chat-fade-in-up` at 200ms.

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

### 4.8 Files modal [Observed]
- **Dialog:** centred, 600px wide, max height ~600, radius ~20 **[TBV]**, `shadow-popover`, overlay `rgba(0,0,0,.4)`.
- **Header:** "All files in this task" (16px/500), then "Select all", "⤓ Download all" and ✕ (ghost buttons).
- **Filter chips:**
  - Copy: "All 2", "Documents", "Images 2", "Videos", "Audio", "Code files". The count is shown in `--text-tertiary`.
  - Selected chip: dark grey fill with white text. Others: `--surface-primary`, radius max, h32.
- **List:**
  - A day header ("Today", caption) groups the rows.
  - Row: 40px thumbnail (radius 8), filename (14/20), and meta "PNG · 12:40 PM · 1.1 MB" (caption, `--text-tertiary`).
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
  - About 180px wide, radius 12, `shadow-lg`, item h34 with radius 8, icon 14px.
  - Items: Pin to top, Rename, Duplicate, Add to project ›, Delete (danger).
- **Tooltip:** `#1b1b1b` background, white 10.5px text, radius 6, padding 4×8. Keycaps are 18px with radius 5 at `rgba(255,255,255,.15)` **[TBV]**.

### 4.10 Search dialog (⌘/Ctrl+K) [Observed sizes · TBV content]
- 512 × 370: header 44 (input with search icon), results 270, footer 48 (keycap hints such as `Esc` in a 29px keycap). Action gap 6.
- Result row and snippet highlight **[TBV]**.

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

### 4.13 Toasts [Decision]
- Use shadcn **Sonner**, bottom-right on desktop and top on mobile. Dark `#1b1b1b` surface, 14px. The reference has a "Notifications (F8)" region.
- Used for out-of-scope affordances ("Not available in this build"), copy confirmations and non-blocking errors.

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

The URL changes to `/chat/<id>` without a full reload, and the document title becomes `<title> | Magica`. **[Decision]** Ours is `<title> | Agent Chat`.

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
- [ ] Search dialog results UI
- [ ] Mobile thread, drawer trigger and breakpoint
- [ ] Dark-mode thread
- [ ] Composer focus state
- [ ] Files modal radius and empty state
- [ ] Credit rounding rules
