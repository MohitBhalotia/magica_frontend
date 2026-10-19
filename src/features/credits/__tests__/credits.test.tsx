import { useAuth } from "@clerk/nextjs";
import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, it, vi } from "vitest";

import type { UsageSummary } from "@mohitbhalotia/magica-contracts";

import { AssistantMessage } from "@/features/chat/AssistantTurn";
import { CreditsPill } from "@/features/credits/CreditsPill";
import { UsagePage } from "@/features/credits/UsagePage";
import { formatCredits } from "@/lib/credits";
import { server } from "@/mocks/server";
import { API, renderWithProviders } from "@/test/render";

const usage: UsageSummary = {
  debitedMicro: 20_288,
  executions: 3,
  periodStart: "2026-10-17T10:00:00.000Z",
  periodEnd: "2026-10-19T10:00:00.000Z",
  tools: [
    {
      tool: "gpt_image_2",
      debitedMicro: 15_288,
      executions: 2,
      latestAt: "2026-10-19T09:22:01.000Z",
    },
    {
      tool: "crop_image",
      debitedMicro: 5_000,
      executions: 1,
      latestAt: "2026-10-19T08:26:58.000Z",
    },
  ],
};

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    isSignedIn: true,
    userId: "user_1",
    getToken: () => Promise.resolve("token"),
  } as unknown as ReturnType<typeof useAuth>);
  server.use(
    http.get(`${API}/credits`, () => HttpResponse.json({ balanceMicro: 979_712 })),
    http.get(`${API}/credits/usage`, () => HttpResponse.json(usage)),
    http.get(`${API}/credits/usage/gpt_image_2`, () =>
      HttpResponse.json({
        items: [{ id: "l1", debitedMicro: 7_644, createdAt: "2026-10-19T09:22:01.000Z" }],
        nextCursor: null,
      }),
    ),
  );
});

it.each([
  [29_260_000, "29.26M"],
  [20_288, "0.02M"],
  [7_644, "0.0076M"],
  [5_000, "0.0050M"],
])("formats %i microcredits as %s, like the reference", (micro, shown) => {
  expect(formatCredits(micro)).toBe(shown);
});

it("a reply whose tools spent credits shows the total in its footer", () => {
  const at = "2026-10-19T10:00:00.000Z";
  renderWithProviders(
    <AssistantMessage
      chatId="c1"
      latest
      message={{
        id: "m",
        role: "assistant",
        status: "success",
        text: "Done",
        contentBlocks: [{ type: "text", text: "Done" }],
        metadata: { creditsUsedMicro: 12_644 },
        errorCode: null,
        errorMessage: null,
        createdAt: at,
        completedAt: at,
        runId: "r1",
      }}
    />,
  );

  expect(screen.getByText("0.01M credits")).toBeInTheDocument();
});

it("the pill shows the balance and opens the plan popover", async () => {
  const user = userEvent.setup();
  renderWithProviders(<CreditsPill />);

  const pill = await screen.findByRole("button", {
    name: "Credits available: 0.98M. Click for plan details.",
  });
  await user.click(pill);

  expect(screen.getByText("Hobby")).toBeInTheDocument();
  expect(screen.getByText("Available Credits")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "View usage" })).toHaveAttribute("href", "/usage");
});

it("/usage shows totals per tool, and a tool's runs in the detailed view", async () => {
  const user = userEvent.setup();
  renderWithProviders(<UsagePage />);

  expect(await screen.findByText("0.02M credits")).toBeInTheDocument();
  expect(screen.getByText("AI GPT Image 2")).toBeInTheDocument();
  expect(screen.getByText("AI Crop Image")).toBeInTheDocument();

  const [gptImage] = screen.getAllByRole("button", { name: "View details" });
  if (gptImage) await user.click(gptImage);

  expect(await screen.findByText("AI GPT Image 2 usage executions")).toBeInTheDocument();
  expect(screen.getByText("0.0076M")).toBeInTheDocument();
});
