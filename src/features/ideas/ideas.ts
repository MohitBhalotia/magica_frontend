/** Reference tab labels (DESIGN §4.4); "All" is added by the gallery. */
export const IDEA_CATEGORIES = [
  "Viral Video Formats",
  "Video Special Effects",
  "Content Creation",
  "Branding & Design",
  "Image & Editing",
] as const;

export type Idea = {
  title: string;
  category: (typeof IDEA_CATEGORIES)[number];
  /** Fills the composer on click; never sent automatically. */
  prompt: string;
  /** Thumbnail shape, so the masonry columns vary like the reference. */
  aspect: string;
  /** Placeholder thumbnail until we have our own media (generating it would spend credits). */
  gradient: string;
};

// [Decision] Our own ideas, each doable with our three tools: crop_image, gpt_image_2, merge_videos.
export const IDEAS: readonly Idea[] = [
  {
    title: "Before & After Reel",
    category: "Viral Video Formats",
    prompt: "Merge my before and after clips into one reel with a fade between them.",
    aspect: "16/9",
    gradient: "from-rose-200 to-orange-100",
  },
  {
    title: "Day-in-the-Life Montage",
    category: "Viral Video Formats",
    prompt: "Stitch my clips into a day-in-the-life montage, in the order I uploaded them.",
    aspect: "3/4",
    gradient: "from-sky-200 to-indigo-100",
  },
  {
    title: "Dissolve Transition Story",
    category: "Video Special Effects",
    prompt: "Join these clips into one story with a dissolve transition between each scene.",
    aspect: "1/1",
    gradient: "from-violet-200 to-fuchsia-100",
  },
  {
    title: "Cinematic Fade Sequence",
    category: "Video Special Effects",
    prompt: "Combine my clips into a cinematic sequence with slow fade transitions.",
    aspect: "16/9",
    gradient: "from-slate-300 to-slate-100",
  },
  {
    title: "Blog Header Illustration",
    category: "Content Creation",
    prompt:
      "Create a wide, minimal blog header illustration about remote work, soft pastel colours.",
    aspect: "16/9",
    gradient: "from-amber-200 to-yellow-50",
  },
  {
    title: "YouTube Thumbnail",
    category: "Content Creation",
    prompt:
      "Design a bold YouTube thumbnail for a video titled “5 Habits That Changed My Life”, then crop it to 16:9.",
    aspect: "4/3",
    gradient: "from-red-200 to-rose-100",
  },
  {
    title: "Carousel Cover Slide",
    category: "Content Creation",
    prompt: "Create a square Instagram carousel cover that says “Morning Routine” in clean type.",
    aspect: "1/1",
    gradient: "from-emerald-200 to-teal-50",
  },
  {
    title: "Minimal Bakery Logo",
    category: "Branding & Design",
    prompt:
      "Design a minimal logo for a neighbourhood bakery called “Crumb & Co.”, warm brown on cream.",
    aspect: "1/1",
    gradient: "from-orange-200 to-amber-50",
  },
  {
    title: "Brand Mood Board",
    category: "Branding & Design",
    prompt: "Create a mood board image for a calm, nature-inspired skincare brand.",
    aspect: "3/4",
    gradient: "from-lime-200 to-green-50",
  },
  {
    title: "Square Profile Photo",
    category: "Image & Editing",
    prompt: "Crop my photo to a centred square for a profile picture.",
    aspect: "3/4",
    gradient: "from-cyan-200 to-sky-50",
  },
  {
    title: "Photo to Watercolor",
    category: "Image & Editing",
    prompt: "Restyle my photo as a soft watercolor painting, keeping the composition.",
    aspect: "4/3",
    gradient: "from-blue-200 to-purple-100",
  },
  {
    title: "Studio Backdrop Swap",
    category: "Image & Editing",
    prompt: "Replace the background of my product photo with a clean white studio backdrop.",
    aspect: "1/1",
    gradient: "from-zinc-200 to-stone-50",
  },
];
