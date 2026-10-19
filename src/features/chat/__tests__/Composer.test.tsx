import { useAuth } from "@clerk/nextjs";
import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, it, vi } from "vitest";

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

it("keeps the draft in sessionStorage across reloads", async () => {
  renderWithProviders(<Composer />);
  await userEvent.type(textbox(), "half-written");
  expect(useComposerStore.getState().drafts[NEW_CHAT]).toBe("half-written");
  expect(sessionStorage.getItem("composer-drafts")).toContain("half-written");
});
