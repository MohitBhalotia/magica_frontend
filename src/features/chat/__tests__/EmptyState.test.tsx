import { render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { EmptyState } from "@/features/chat/EmptyState";

afterEach(() => {
  vi.useRealTimers();
});

it("greets with the local time, a raised AM/PM, and the tagline", () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 18, 22, 19));
  render(<EmptyState />);

  const time = screen.getByLabelText("Local time");
  expect(time).toHaveTextContent(/^10:19\s?PM$/);
  expect(screen.getByRole("heading", { level: 1, name: "Your AI worker" })).toBeInTheDocument();
  expect(screen.getByText("Work at the speed of thought.")).toBeInTheDocument();
});
