import { useAuth } from "@clerk/nextjs";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, it, vi } from "vitest";

import type { Waitpoint } from "@mohitbhalotia/magica-contracts";

import { WaitpointCard } from "@/features/chat/WaitpointCard";
import { server } from "@/mocks/server";
import { API, renderWithProviders } from "@/test/render";

const inMinutes = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();
/** An answer button once the card's click-through guard has passed. */
const armed = async (name: string) => {
  const button = screen.getByRole("button", { name });
  await waitFor(() => {
    expect(button).toBeEnabled();
  });
  return button;
};

let answers: unknown[];
beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    isSignedIn: true,
    userId: "user_1",
    getToken: () => Promise.resolve("token"),
  } as unknown as ReturnType<typeof useAuth>);
  answers = [];
  server.use(
    http.post(`${API}/waitpoints/:id/respond`, async ({ request }) => {
      const { response } = (await request.json()) as { response: unknown };
      answers.push(response);
      return HttpResponse.json({ ...waitpoint, status: "answered" });
    }),
  );
});

let waitpoint: Waitpoint;

it("credit approval: shows the estimate and the balance, and Approve answers yes", async () => {
  waitpoint = {
    id: "w1",
    type: "credit_approval",
    status: "pending",
    expiresAt: inMinutes(15),
    request: { tool: "gpt_image_2", estimateMicro: 273_936, balanceMicro: 979_712 },
  };
  renderWithProviders(<WaitpointCard waitpoint={waitpoint} />);

  expect(screen.getByText(/This will use ~0.27M credits/)).toBeInTheDocument();
  expect(screen.getByText("You have 0.98M.")).toBeInTheDocument();
  expect(screen.getByText(/Expires in 1[45]:/)).toBeInTheDocument();

  await userEvent.click(await armed("Approve"));

  await waitFor(() => {
    expect(answers).toEqual([{ approved: true }]);
  });
  // Answered: the card goes away while the run picks the answer up.
  await waitFor(() => {
    expect(screen.queryByRole("region", { name: "Approve credits" })).not.toBeInTheDocument();
  });
});

it("options: each option answers with that choice", async () => {
  waitpoint = {
    id: "w2",
    type: "options",
    status: "pending",
    expiresAt: inMinutes(15),
    request: { question: "Which style?", options: ["Photo", "Watercolor"] },
  };
  renderWithProviders(<WaitpointCard waitpoint={waitpoint} />);

  await userEvent.click(await armed("Watercolor"));

  await waitFor(() => {
    expect(answers).toEqual([{ choice: "Watercolor" }]);
  });
});

it("plan: Reject sends the user's feedback", async () => {
  waitpoint = {
    id: "w3",
    type: "plan_approval",
    status: "pending",
    expiresAt: inMinutes(15),
    request: { plan: "1. Generate\n2. Crop" },
  };
  renderWithProviders(<WaitpointCard waitpoint={waitpoint} />);

  await userEvent.type(screen.getByLabelText("Changes to the plan (optional)"), "Skip the crop");
  await userEvent.click(await armed("Reject"));

  await waitFor(() => {
    expect(answers).toEqual([{ approved: false, feedback: "Skip the crop" }]);
  });
});

it("ignores answers for a moment after it appears, then takes the keyboard", async () => {
  vi.useFakeTimers();
  waitpoint = {
    id: "w5",
    type: "options",
    status: "pending",
    expiresAt: inMinutes(15),
    request: { question: "Which style?", options: ["Photo", "Watercolor"] },
  };
  renderWithProviders(<WaitpointCard waitpoint={waitpoint} />);

  // A click already in flight as the card appears lands on a disabled button.
  const photo = screen.getByRole("button", { name: "Photo" });
  fireEvent.click(photo);
  expect(photo).toBeDisabled();
  act(() => {
    vi.advanceTimersByTime(600);
  });
  expect(photo).toBeEnabled();
  vi.useRealTimers();

  photo.focus();
  await userEvent.keyboard("{Enter}");
  await waitFor(() => {
    expect(answers).toEqual([{ choice: "Photo" }]);
  });
});

it("a browser clock behind the server's never shows more than 15:00", () => {
  waitpoint = {
    id: "w6",
    type: "options",
    status: "pending",
    expiresAt: inMinutes(15.05),
    request: { question: "Which style?", options: ["Photo"] },
  };
  renderWithProviders(<WaitpointCard waitpoint={waitpoint} />);

  expect(screen.getByText("Expires in 15:00")).toBeInTheDocument();
});

it("an expired question can't be answered and says how to continue", () => {
  waitpoint = {
    id: "w4",
    type: "options",
    status: "pending",
    expiresAt: inMinutes(-1),
    request: { question: "Which style?", options: ["Photo", "Watercolor"] },
  };
  renderWithProviders(<WaitpointCard waitpoint={waitpoint} />);

  expect(screen.getByText("This request expired. Reply to continue.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Photo" })).not.toBeInTheDocument();
});
