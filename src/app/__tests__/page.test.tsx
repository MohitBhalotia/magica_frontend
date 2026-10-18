import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";

import Home from "@/app/page";

// Render as signed out without a real Clerk session.
vi.mock("@clerk/nextjs", () => ({
  Show: ({ when, children }: { when: string; children: ReactNode }) =>
    when === "signed-out" ? children : null,
  SignInButton: () => <button type="button">Sign in</button>,
  UserButton: () => null,
}));

it("shows the sign-in button when signed out", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { name: "Agent Chat" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
});
