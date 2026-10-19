import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** TESTING §9: no serious or critical axe violations (WCAG 2.1 A/AA) on the page as it is now. */
export async function expectNoSeriousViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const serious = violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => ({
      rule: v.id,
      nodes: v.nodes.map((n) => `${n.target.join(" ")}: ${n.failureSummary ?? ""}`),
    }));
  expect(serious).toEqual([]);
}
