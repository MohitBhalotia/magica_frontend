import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("keeps a custom text size next to a text colour", () => {
    expect(cn("text-body text-text-primary")).toBe("text-body text-text-primary");
  });

  it("still lets a later size or colour win", () => {
    expect(cn("text-body", "text-caption")).toBe("text-caption");
    expect(cn("text-text-primary", "text-text-secondary")).toBe("text-text-secondary");
  });

  it("merges conditionals like clsx", () => {
    const hidden = Math.random() > 2; // runtime false, so the linter can't fold it
    expect(cn("px-2", hidden && "hidden", { "py-1": true })).toBe("px-2 py-1");
  });
});
