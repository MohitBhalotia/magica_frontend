"use client";

import {
  ChevronDown,
  CircleCheck,
  CircleX,
  LoaderCircle,
  Search,
  Sparkles,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import {
  MediaToolOutputSchema,
  type ToolBlock,
  type ToolName,
} from "@mohitbhalotia/magica-contracts";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type Input = Record<string, unknown>;

type StepLook = {
  icon: LucideIcon;
  iconClass: string;
  label: string;
  /** The detail card starts open (DESIGN §4.6: discovery steps). */
  open?: boolean;
  details: (input: Input) => [string, unknown][];
};

const mediaStep = (model: string): StepLook => ({
  icon: Sparkles,
  iconClass: "text-icon-primary",
  label: "AI Generation",
  details: (input) => [["Model", model], ...Object.entries(input)],
});

/** How each tool's step looks (DESIGN §4.6). Keyed by tool name, so a new tool must add its row. */
const STEPS: Record<ToolName, StepLook> = {
  load_skill: {
    icon: Zap,
    iconClass: "text-icon-warning",
    label: "Skill",
    details: (input) => [["Skill", input.name]],
  },
  read_skill_asset: {
    icon: Zap,
    iconClass: "text-icon-warning",
    label: "Skill",
    details: (input) => [
      ["Skill", input.skill],
      ["File", input.path],
    ],
  },
  search_models: {
    icon: Search,
    iconClass: "text-icon-primary",
    label: "Tool search",
    open: true,
    details: (input) => [["Query", input.query]],
  },
  get_model_schema: {
    icon: Wrench,
    iconClass: "text-icon-information",
    label: "Model schema",
    open: true,
    details: (input) => [["Model ID", input.modelId]],
  },
  crop_image: mediaStep("Crop Image"),
  gpt_image_2: mediaStep("GPT Image 2"),
  merge_videos: mediaStep("Merge Videos"),
};

/** A media card shows this many params before "View more" (DESIGN §4.6). */
const PARAMS_SHOWN = 3;

/** Microcredits as the reference shows them: `0.005M`, up to 3 decimals (DESIGN §6). */
const credits = (micro: number) => `${String(Number((micro / 1_000_000).toFixed(3)))}M`;
const show = (value: unknown) => (typeof value === "string" ? value : JSON.stringify(value));

export const toolName = (block: ToolBlock) => block.type.slice("tool-".length) as ToolName;

/**
 * The turn's tool calls as one collapsible group: "Working · N steps" while the turn runs, then
 * "Completed N steps", collapsed (DESIGN §4.6). A saved turn mounts fresh, so it starts collapsed.
 */
export function ToolSteps({ steps, streaming }: { steps: ToolBlock[]; streaming: boolean }) {
  const [open, setOpen] = useState(streaming);
  const count = `${String(steps.length)} step${steps.length === 1 ? "" : "s"}`;
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-space-04">
      <CollapsibleTrigger className="flex items-center gap-space-02 text-small text-text-secondary hover:text-text-primary">
        {streaming ? `Working · ${count}` : `Completed ${count}`}
        <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-space-02 flex flex-col">
        {steps.map((step) => (
          <StepRow key={step.toolCallId} step={step} streaming={streaming} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function StepRow({ step, streaming }: { step: ToolBlock; streaming: boolean }) {
  const look = STEPS[toolName(step)];
  const [open, setOpen] = useState(Boolean(look.open));
  const [allParams, setAllParams] = useState(false);
  const input = (step.input ?? {}) as Input;
  const rows = look.details(input).filter(([, value]) => value !== undefined);
  const shown = allParams ? rows : rows.slice(0, PARAMS_SHOWN + 1); // +1: the Model row
  const creditUsed = MediaToolOutputSchema.safeParse(step.output).data?.creditUsed;
  const Icon = look.icon;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex h-9 w-full items-center gap-space-02 text-small text-text-primary">
        <Icon className={cn("size-5 shrink-0 p-0.5", look.iconClass)} aria-hidden />
        {look.label}
        <StepStatus state={step.state} streaming={streaming} />
        {creditUsed !== undefined && creditUsed > 0 && (
          <span className="ml-auto font-mono text-caption text-text-secondary tabular-nums">
            {credits(creditUsed)}
          </span>
        )}
        <ChevronDown
          className={cn(
            "size-3 text-text-secondary transition-transform",
            !creditUsed && "ml-auto",
            open && "rotate-180",
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="mb-space-02 ml-7 rounded-lg border border-boarder-tertiary p-space-03 text-[13px]">
        <dl className="grid grid-cols-[88px_1fr] gap-x-space-03 gap-y-space-02">
          {shown.map(([key, value]) => (
            <div key={key} className="contents">
              <dt className="text-text-secondary">{key}</dt>
              <dd className="break-words text-text-primary">{show(value)}</dd>
            </div>
          ))}
        </dl>
        {rows.length > shown.length && (
          <button
            type="button"
            onClick={() => {
              setAllParams(true);
            }}
            className="mt-space-02 text-text-information hover:underline"
          >
            View more
          </button>
        )}
        {step.state === "output-error" && (
          <p role="alert" className="mt-space-02 text-text-error">
            {step.errorText ?? "This step failed."}
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Running: spinner. Done: green check. Failed: red ✕. Left unfinished by Stop: nothing. */
function StepStatus({ state, streaming }: { state: ToolBlock["state"]; streaming: boolean }) {
  if (state === "output-available")
    return <CircleCheck aria-label="Done" className="size-3 text-icon-success" />;
  if (state === "output-error")
    return <CircleX aria-label="Failed" className="size-3 text-icon-error" />;
  if (!streaming) return null;
  return <LoaderCircle aria-label="Running" className="size-3 animate-spin text-icon-secondary" />;
}
