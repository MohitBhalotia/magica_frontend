import { createCn } from "cn/config";

/**
 * Our reference type scale (`--text-*` in globals.css). Without this, `cn` reads `text-body` as a
 * colour and drops it next to `text-text-primary`. Keep in sync with the @theme block.
 */
const FONT_SIZES = [
  "display",
  "page-title",
  "page-subtitle",
  "lead",
  "heading-lg",
  "heading-md",
  "heading-sm",
  "heading-xs",
  "body",
  "copy",
  "small",
  "metadata",
  "tooltip",
  "tooltip-keycap",
  "search-label",
  "button",
  "caption",
  "caption-1",
  "caption-2",
];

/** Tailwind class merge that knows our custom text sizes. Import this, never the bare `cn` package. */
export const cn = createCn({ extend: { classGroups: { "font-size": [{ text: FONT_SIZES }] } } });
