import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

/** The API base URL tests run against (vitest.config.ts env), for MSW handlers. */
export const API = "http://localhost:4000/api/v1";

/**
 * The app's client providers: a fresh QueryClient (no retries, so failures surface at once),
 * tooltips, toasts. Passed as `wrapper`, so `rerender` keeps them.
 */
export function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster />
    </QueryClientProvider>
  );
  return render(ui, { wrapper });
}
