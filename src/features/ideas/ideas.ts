import { z } from "zod";

import raw from "@/features/ideas/ideas.json";

/** Reference tab labels (DESIGN §4.4); "All" is added by the gallery. */
export const IDEA_CATEGORIES = [
  "Viral Video Formats",
  "Video Special Effects",
  "Content Creation",
  "Branding & Design",
  "Image & Editing",
] as const;

const IdeaSchema = z.object({
  title: z.string(),
  categories: z.array(z.enum(IDEA_CATEGORIES)),
  /** Fills the composer on click; never sent automatically. */
  prompt: z.string(),
  /** Either a looping preview video with its poster, or a still image (reference CDN). */
  video: z.url().optional(),
  poster: z.url().optional(),
  image: z.url().optional(),
  /** Display size in the reference's 3-column grid; sets the card's aspect ratio. */
  width: z.number(),
  height: z.number(),
});
export type Idea = z.infer<typeof IdeaSchema>;

/**
 * The reference's own "All" ideas (user call, 2026-10-18), captured read-only from
 * app.magica.com into ideas.json. Parsed once so a bad edit fails loudly, not as a blank card.
 */
export const IDEAS: readonly Idea[] = z.array(IdeaSchema).parse(raw);
