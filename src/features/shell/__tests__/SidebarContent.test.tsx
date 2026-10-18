import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { Toaster } from "@/components/ui/sonner";
import { SidebarContent } from "@/features/shell/SidebarContent";
import { router } from "@/test/router";

it("New task goes to /chat and tells the drawer to close", async () => {
  const onNavigate = vi.fn();
  render(<SidebarContent onClose={vi.fn()} onNavigate={onNavigate} />);

  await userEvent.click(screen.getByRole("button", { name: /New task/ }));
  expect(router.push).toHaveBeenCalledWith("/chat");
  expect(onNavigate).toHaveBeenCalledOnce();
});

it("out-of-scope nav items toast instead of navigating", async () => {
  render(
    <>
      <SidebarContent onClose={vi.fn()} />
      <Toaster />
    </>,
  );

  await userEvent.click(screen.getByRole("button", { name: "Library" }));
  expect(await screen.findByText("Not available in this build")).toBeInTheDocument();
  expect(router.push).not.toHaveBeenCalled();
});
