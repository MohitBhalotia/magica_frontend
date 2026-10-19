import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { expect, it } from "vitest";

import { AssistantParts } from "@/features/chat/AssistantTurn";
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
    <AssistantParts parts={[skill, generate(), { type: "text", text: "Here's your apple." }]} />,
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
