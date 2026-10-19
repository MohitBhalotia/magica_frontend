"use client";

import {
  ChevronDown,
  CircleCheck,
  CircleMinus,
  CircleX,
  Clock,
  LoaderCircle,
  Search,
  Sparkles,
  Wrench,
  Zap,
  ListChecks,
  MessageCircleQuestion,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  MediaToolOutputSchema,
  type Message,
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
  crop_image: { ...mediaStep("Crop Image"), label: "Image crop" },
  gpt_image_2: mediaStep("GPT Image 2"),
  merge_videos: mediaStep("Merge Videos"),
  // Not observed on the reference (DESIGN §4.6 [TBV]): our own look for M4b's questions.
  ask_user: {
    icon: MessageCircleQuestion,
    iconClass: "text-icon-information",
    label: "Question",
    details: (input) => [
      ["Question", input.question],
      ["Options", input.options],
    ],
  },
  propose_plan: {
    icon: ListChecks,
    iconClass: "text-icon-information",
    label: "Plan",
    details: (input) => [["Plan", input.plan]],
  },
};

/** A media card shows this many params before "View more" (DESIGN §4.6). */
const PARAMS_SHOWN = 3;

/** Microcredits as the reference shows them: `0.005M`, up to 3 decimals (DESIGN §6). */
const credits = (micro: number) => `${String(Number((micro / 1_000_000).toFixed(3)))}M`;
/** A link as `host/…/file`: signed links are long, and their signature isn't for display. */
const compactLinks = (text: string) =>
  text.replace(/https?:\/\/[^\s"]+/g, (link) => {
    if (!URL.canParse(link)) return link;
    const { host, pathname } = new URL(link);
    const segments = pathname.split("/").filter(Boolean);
    return segments.length > 1 ? `${host}/…/${segments.at(-1) ?? ""}` : host + pathname;
  });
/** A detail value as text; a list (e.g. `video_urls`) shows one item per line. */
const show = (value: unknown): string =>
  Array.isArray(value)
    ? value.map(show).join("\n")
    : compactLinks(typeof value === "string" ? value : JSON.stringify(value));

/** A step's duration as the reference shows it: `193ms`, `2.2s`, `1m 05s` (DESIGN §4.6). */
export function duration(ms: number) {
  if (ms < 1000) return `${String(Math.round(ms))}ms`;
  if (ms < 59_950) return `${(ms / 1000).toFixed(1)}s`;
  const seconds = Math.round(ms / 1000);
  return `${String(Math.floor(seconds / 60))}m ${String(seconds % 60).padStart(2, "0")}s`;
}

export const toolName = (block: ToolBlock) => block.type.slice("tool-".length) as ToolName;

/**
 * The turn's tool calls as one collapsible group: "Working · N steps" while the turn runs, then
 * "Completed N steps" (or "Stopped/Failed after N steps"), collapsed (DESIGN §4.6). A saved turn
 * mounts fresh, so it starts collapsed.
 */
export function ToolSteps({
  steps,
  streaming,
  status,
  toolMs = {},
}: {
  steps: ToolBlock[];
  streaming: boolean;
  /** The saved message's status; absent while live. */
  status?: Message["status"];
  /** Each finished call's duration by `toolCallId` (message metadata). */
  toolMs?: Record<string, number>;
}) {
  const [open, setOpen] = useState(streaming);
  const count = `${String(steps.length)} step${steps.length === 1 ? "" : "s"}`;
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-space-04">
      <CollapsibleTrigger className="flex items-center gap-space-02 text-small text-text-secondary hover:text-text-primary">
        {streaming
          ? `Working · ${count}`
          : status === "cancelled"
            ? `Stopped after ${count}`
            : status === "failed"
              ? `Failed after ${count}`
              : `Completed ${count}`}
        <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-space-02 flex flex-col">
        {steps.map((step) => (
          <StepRow
            key={step.toolCallId}
            step={step}
            streaming={streaming}
            ms={toolMs[step.toolCallId]}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function StepRow({
  step,
  streaming,
  ms,
}: {
  step: ToolBlock;
  streaming: boolean;
  ms: number | undefined;
}) {
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
        {/* Billed steps show their credits instead of a duration, as on the reference. */}
        {streaming && step.state === "input-available" ? (
          <Elapsed />
        ) : (
          !creditUsed && ms !== undefined && <Duration ms={ms} />
        )}
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
        {/* minmax(0,…) and wrap-anywhere: a long unbroken value wraps instead of widening the page. */}
        <dl className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-space-03 gap-y-space-02">
          {shown.map(([key, value]) => (
            <div key={key} className="contents">
              <dt className="text-text-secondary">{key}</dt>
              <dd className="min-w-0 wrap-anywhere whitespace-pre-line text-text-primary">
                {show(value)}
              </dd>
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

function Duration({ ms }: { ms: number }) {
  return (
    <span className="flex items-center gap-0.5 font-mono text-caption text-text-secondary/40 tabular-nums">
      <Clock className="size-2.5" aria-hidden />
      {duration(ms)}
    </span>
  );
}

/** A running step's live time, counted from when this row first saw it running. */
function Elapsed() {
  const [startedAt] = useState(Date.now);
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 100);
    return () => {
      clearInterval(timer);
    };
  }, []);
  return <Duration ms={now - startedAt} />;
}

/** Running: spinner. Done: green check. Failed: red ✕. Left unfinished by Stop: grey minus. */
function StepStatus({ state, streaming }: { state: ToolBlock["state"]; streaming: boolean }) {
  if (state === "output-available")
    return <CircleCheck aria-label="Done" className="size-3 text-icon-success" />;
  if (state === "output-error")
    return <CircleX aria-label="Failed" className="size-3 text-icon-error" />;
  if (!streaming)
    return <CircleMinus aria-label="Stopped" className="size-3 text-icon-secondary" />;
  return <LoaderCircle aria-label="Running" className="size-3 animate-spin text-icon-secondary" />;
}
