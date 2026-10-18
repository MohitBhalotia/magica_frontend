import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { expect, it } from "vitest";

import { TopBar } from "@/features/shell/TopBar";

it("the model menu offers only OpenRouter Free and closes on pick", async () => {
  render(<TopBar />);

  await userEvent.click(screen.getByRole("button", { name: "OpenRouter Free" }));
  const dialog = screen.getByRole("dialog");
  const option = within(dialog).getByRole("button", { name: /OpenRouter Free/ });
  expect(option).toHaveTextContent("Picks an available free model for your task");

  await userEvent.click(option);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("signed out, it shows Magica 101 and offers Sign in and Sign up", () => {
  render(<TopBar />);
  expect(screen.getByRole("button", { name: "Magica 101" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sign up" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Open computer" })).not.toBeInTheDocument();
});
