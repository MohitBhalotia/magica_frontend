import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { ThemeProvider } from "next-themes";
import { expect, it } from "vitest";

import { SidebarFooter } from "@/features/shell/SidebarFooter";

function renderFooter() {
  render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SidebarFooter />
    </ThemeProvider>,
  );
}

it("More expands inline to credits and theme, Less collapses it", async () => {
  renderFooter();
  expect(screen.queryByRole("button", { name: /Add Credits/ })).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "More" }));
  expect(screen.getByRole("button", { name: /Add Credits/ })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "System theme" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await userEvent.click(screen.getByRole("button", { name: "Less" }));
  expect(screen.queryByRole("tablist", { name: "Theme" })).not.toBeInTheDocument();
});

it("the theme tabs switch the theme", async () => {
  renderFooter();
  await userEvent.click(screen.getByRole("button", { name: "More" }));

  await userEvent.click(screen.getByRole("tab", { name: "Dark theme" }));
  expect(screen.getByRole("tab", { name: "Dark theme" })).toHaveAttribute("aria-selected", "true");
  expect(document.documentElement).toHaveClass("dark");
});

it("signed out, the footer shows the Magica 101 card and Sign in", () => {
  renderFooter();
  expect(screen.getByRole("button", { name: /Learn what Magica can do/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
});
