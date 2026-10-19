import { useAuth } from "@clerk/nextjs";
import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SendMessageRequest } from "@mohitbhalotia/magica-contracts";

import { Composer } from "@/features/chat/Composer";
import { server } from "@/mocks/server";
import { NEW_CHAT, useComposerStore } from "@/stores/composerStore";
import { clerk } from "@/test/clerk";
import { API, renderWithProviders } from "@/test/render";
import { router } from "@/test/router";

const signIn = (signedIn: boolean) => {
  vi.mocked(useAuth).mockReturnValue({
    isSignedIn: signedIn,
    userId: signedIn ? "user_1" : null,
    getToken: () => Promise.resolve(signedIn ? "token" : null),
  } as unknown as ReturnType<typeof useAuth>);
};
const textbox = () => screen.getByRole("textbox", { name: "Message" });
const sendButton = () => screen.getByRole("button", { name: "Send message" });

let sent: SendMessageRequest[];
beforeEach(() => {
  sent = [];
  sessionStorage.clear();
  useComposerStore.setState({ drafts: {} });
  signIn(true);
  server.use(
    http.post(`${API}/chats`, async ({ request }) => {
      const body = (await request.json()) as SendMessageRequest;
      sent.push(body);
      return HttpResponse.json(
        {
          chatId: body.clientMessageId,
          userMessageId: "m1",
          assistantMessageId: "m2",
          run: { runId: "r1", status: "queued", triggerRunId: null, publicAccessToken: null },
        },
        { status: 201 },
      );
    }),
  );
});

it("starts empty: Send is disabled and explains why", () => {
  renderWithProviders(<Composer />);
  expect(textbox()).toHaveFocus();
  expect(sendButton()).toBeDisabled();
  expect(screen.getByLabelText("Add a message first")).toBeInTheDocument();
});

it("Enter sends the trimmed text, opens the new chat and clears the draft", async () => {
  renderWithProviders(<Composer />);
  await userEvent.type(textbox(), "  Make a logo  {Enter}");

  await waitFor(() => {
    expect(router.push).toHaveBeenCalledOnce();
  });
  expect(sent).toHaveLength(1);
  expect(sent[0]?.text).toBe("Make a logo");
  expect(router.push).toHaveBeenCalledWith(`/chat/${sent[0]?.clientMessageId ?? ""}`);
  expect(textbox()).toHaveValue("");
});

it("Shift+Enter adds a line instead of sending", async () => {
  renderWithProviders(<Composer />);
  await userEvent.type(textbox(), "one{Shift>}{Enter}{/Shift}two");
  expect(textbox()).toHaveValue("one\ntwo");
  expect(sent).toHaveLength(0);
});

it("signed out, Send asks to sign in and sends nothing", async () => {
  signIn(false);
  renderWithProviders(<Composer />);
  await userEvent.type(textbox(), "hello{Enter}");
  expect(clerk.openSignIn).toHaveBeenCalledOnce();
  expect(sent).toHaveLength(0);
});

it("on failure keeps the draft, shows the error, and a retry reuses the same message id", async () => {
  server.use(
    http.post(`${API}/chats`, async ({ request }) => {
      sent.push((await request.json()) as SendMessageRequest);
      return HttpResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Try again shortly.",
            traceId: "t",
          },
        },
        { status: 429 },
      );
    }),
  );
  renderWithProviders(<Composer />);
  await userEvent.type(textbox(), "hello{Enter}");
  expect(await screen.findByText("Too many requests. Try again shortly.")).toBeInTheDocument();
  expect(textbox()).toHaveValue("hello");

  await userEvent.click(sendButton());
  await waitFor(() => {
    expect(sent).toHaveLength(2);
  });
  expect(sent[1]?.clientMessageId).toBe(sent[0]?.clientMessageId);
  expect(router.push).not.toHaveBeenCalled();
});

describe("inside a chat", () => {
  const replied = (body: SendMessageRequest) =>
    HttpResponse.json(
      {
        chatId: "c1",
        userMessageId: body.clientMessageId,
        assistantMessageId: "m9",
        run: { runId: "r2", status: "queued", triggerRunId: null, publicAccessToken: null },
      },
      { status: 201 },
    );

  it("sends a follow-up to the chat, stays on the page and clears only this chat's draft", async () => {
    useComposerStore.setState({ drafts: { [NEW_CHAT]: "other draft" } });
    server.use(
      http.post(`${API}/chats/c1/messages`, async ({ request }) => {
        const body = (await request.json()) as SendMessageRequest;
        sent.push(body);
        return replied(body);
      }),
    );
    renderWithProviders(<Composer chatId="c1" />);
    expect(textbox()).toHaveAttribute("placeholder", "Send a message...");

    await userEvent.type(textbox(), "and a dark version{Enter}");

    await waitFor(() => {
      expect(textbox()).toHaveValue("");
    });
    expect(sent.map((b) => b.text)).toEqual(["and a dark version"]);
    expect(router.push).not.toHaveBeenCalled();
    expect(useComposerStore.getState().drafts).toEqual({ [NEW_CHAT]: "other draft" });
  });

  it("while a reply runs, Send becomes Stop; Enter doesn't send and Stop cancels the run", async () => {
    const cancelled: string[] = [];
    server.use(
      http.post(`${API}/runs/:runId/cancel`, ({ params }) => {
        cancelled.push(String(params.runId));
        return HttpResponse.json({
          runId: "r1",
          status: "stopping",
          triggerRunId: "run_1",
          publicAccessToken: "pk",
        });
      }),
    );
    const run = {
      runId: "r1",
      status: "working" as const,
      triggerRunId: "run_1",
      publicAccessToken: "pk",
      waitpoint: null,
    };
    renderWithProviders(<Composer chatId="c1" activeRun={run} />);
    expect(screen.queryByRole("button", { name: "Send message" })).not.toBeInTheDocument();

    await userEvent.type(textbox(), "next question{Enter}");
    expect(sent).toHaveLength(0);
    expect(textbox()).toHaveValue("next question"); // still editable

    await userEvent.click(screen.getByRole("button", { name: "Stop" }));
    await waitFor(() => {
      expect(cancelled).toEqual(["r1"]);
    });
  });

  it("a stopping run shows a busy Stop that can't be pressed again", () => {
    renderWithProviders(
      <Composer
        chatId="c1"
        activeRun={{
          runId: "r1",
          status: "stopping",
          triggerRunId: "t",
          publicAccessToken: "p",
          waitpoint: null,
        }}
      />,
    );
    expect(screen.getByRole("button", { name: "Stop" })).toBeDisabled();
  });

  it("a reply still in progress shows the API's message and keeps the draft", async () => {
    server.use(
      http.post(`${API}/chats/c1/messages`, () =>
        HttpResponse.json(
          {
            error: {
              code: "RUN_ACTIVE",
              message: "A reply is already in progress in this chat.",
              traceId: "t",
            },
          },
          { status: 409 },
        ),
      ),
    );
    renderWithProviders(<Composer chatId="c1" />);
    await userEvent.type(textbox(), "too soon{Enter}");

    expect(
      await screen.findByText("A reply is already in progress in this chat."),
    ).toBeInTheDocument();
    expect(textbox()).toHaveValue("too soon");
  });
});

it("keeps the draft in sessionStorage across reloads", async () => {
  renderWithProviders(<Composer />);
  await userEvent.type(textbox(), "half-written");
  expect(useComposerStore.getState().drafts[NEW_CHAT]).toBe("half-written");
  expect(sessionStorage.getItem("composer-drafts")).toContain("half-written");
});
