import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { expect, it } from "vitest";

import { AssistantParts } from "@/features/chat/AssistantTurn";
import { duration } from "@/features/chat/ToolSteps";
import { renderWithProviders } from "@/test/render";

const image = "https://g.tlcdn.com/gen/apple.png";
const skill = {
  type: "tool-load_skill",
  toolCallId: "c1",
  state: "output-available",
  input: { name: "image-generation" },
  output: { name: "image-generation", alreadyLoaded: false, instructions: "…" },
};
const generate = (patch: object = {}) => ({
  type: "tool-gpt_image_2",
  toolCallId: "c2",
  state: "output-available",
  input: { mode: "text", prompt: "a red apple", quality: "Low", size: "1024x1024", n: 1 },
  output: {
    assets: [{ kind: "image", url: image, mimeType: "image/png", width: 1024, height: 1024 }],
    creditUsed: 7644,
  },
  ...patch,
});

it("a finished turn: collapsed 'Completed N steps', the image inline after the text", async () => {
  const user = userEvent.setup();
  renderWithProviders(
    <AssistantParts
      parts={[skill, generate(), { type: "text", text: "Here's your apple." }]}
      metadata={{ toolMs: { c1: 193, c2: 2200 } }}
    />,
  );

  expect(screen.getByText("Completed 2 steps")).toBeInTheDocument();
  expect(screen.queryByText("AI Generation")).not.toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Generated image" })).toHaveAttribute(
    "src",
    expect.stringContaining(encodeURIComponent(image)),
  );

  await user.click(screen.getByText("Completed 2 steps"));
  expect(screen.getByText("Skill")).toBeInTheDocument();
  expect(screen.getByText("AI Generation")).toBeInTheDocument();
  expect(screen.getByText("0.008M")).toBeInTheDocument();
  expect(screen.getAllByLabelText("Done")).toHaveLength(2);
  // Each step's duration; a billed step shows its credits instead (as on the reference).
  expect(screen.getByText("193ms")).toBeInTheDocument();
  expect(screen.queryByText("2.2s")).not.toBeInTheDocument();
});

it("formats step durations like the reference", () => {
  expect(duration(193)).toBe("193ms");
  expect(duration(2240)).toBe("2.2s");
  expect(duration(25_500)).toBe("25.5s");
  expect(duration(59_960)).toBe("1m 00s");
  expect(duration(65_000)).toBe("1m 05s");
});

it("labels a crop step 'Image crop'", async () => {
  const user = userEvent.setup();
  renderWithProviders(
    <AssistantParts parts={[generate({ type: "tool-crop_image", output: undefined })]} />,
  );

  await user.click(screen.getByText("Completed 1 step"));
  expect(screen.getByText("Image crop")).toBeInTheDocument();
});

it("a media card shows the model and 3 params, then 'View more'", async () => {
  const user = userEvent.setup();
  renderWithProviders(<AssistantParts parts={[generate()]} />);

  await user.click(screen.getByText("Completed 1 step"));
  await user.click(screen.getByText("AI Generation"));
  expect(screen.getByText("GPT Image 2")).toBeInTheDocument();
  expect(screen.getByText("a red apple")).toBeInTheDocument();
  expect(screen.queryByText("1024x1024")).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "View more" }));
  expect(screen.getByText("1024x1024")).toBeInTheDocument();
});

it("while streaming: 'Working · N steps', a spinner, and a skeleton where the image will go", () => {
  renderWithProviders(
    <AssistantParts
      parts={[generate({ state: "input-available", output: undefined })]}
      streaming
    />,
  );

  expect(screen.getByText("Working · 1 step")).toBeInTheDocument();
  expect(screen.getByLabelText("Running")).toBeInTheDocument();
  expect(screen.getByText(/^\d+ms$/)).toBeInTheDocument(); // the live elapsed time
  expect(screen.getByLabelText("Generating")).toBeInTheDocument();
});

it("a failed step shows a red ✕ and its safe error", async () => {
  const user = userEvent.setup();
  renderWithProviders(
    <AssistantParts
      parts={[
        generate({
          state: "output-error",
          output: undefined,
          errorText: "Magica is taking too long.",
        }),
      ]}
    />,
  );

  await user.click(screen.getByText("Completed 1 step"));
  expect(screen.getByLabelText("Failed")).toBeInTheDocument();
  await user.click(screen.getByText("AI Generation"));
  expect(screen.getByRole("alert")).toHaveTextContent("Magica is taking too long.");
});

it("a stopped turn: 'Stopped after N steps', and the unfinished step shows a grey stop icon", async () => {
  const user = userEvent.setup();
  renderWithProviders(
    <AssistantParts
      parts={[skill, generate({ state: "input-available", output: undefined })]}
      status="cancelled"
    />,
  );

  await user.click(screen.getByText("Stopped after 2 steps"));
  expect(screen.getByLabelText("Done")).toBeInTheDocument();
  expect(screen.getByLabelText("Stopped")).toBeInTheDocument();
});

it("a failed turn: 'Failed after N steps'", () => {
  renderWithProviders(<AssistantParts parts={[skill]} status="failed" />);
  expect(screen.getByText("Failed after 1 step")).toBeInTheDocument();
});

it("shows links compactly, one per line, never with their signature", async () => {
  const user = userEvent.setup();
  const file = (id: string) =>
    `https://acc.r2.cloudflarestorage.com/magica/uploads/u1/${id}?X-Amz-Credential=AKIA&X-Amz-Signature=abc`;
  renderWithProviders(
    <AssistantParts
      parts={[
        generate({
          type: "tool-merge_videos",
          input: { video_urls: [file("a1"), file("a2")] },
        }),
      ]}
    />,
  );

  await user.click(screen.getByText("Completed 1 step"));
  await user.click(screen.getByText("AI Generation"));
  const value = screen.getByText(/acc\.r2\.cloudflarestorage\.com\/…\/a1/);
  expect(value.textContent).toBe(
    "acc.r2.cloudflarestorage.com/…/a1\nacc.r2.cloudflarestorage.com/…/a2",
  );
  expect(document.body.textContent).not.toContain("X-Amz");
});
