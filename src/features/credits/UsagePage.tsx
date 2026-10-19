"use client";

import {
  IconCalendar,
  IconChevronDown,
  IconCurrencyDollar,
  IconEye,
  IconListDetails,
  IconReceipt,
} from "@tabler/icons-react";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";

import type { ToolName, ToolUsage } from "@mohitbhalotia/magica-contracts";

import { useToolUsage, useUsage } from "@/features/credits/useCredits";
import { formatCredits } from "@/lib/credits";
import { cn } from "@/lib/utils";

/** How the reference names each tool on this page. */
const TOOL_LABELS: Partial<Record<ToolName, string>> = {
  gpt_image_2: "AI GPT Image 2",
  crop_image: "AI Crop Image",
  merge_videos: "AI Merge Videos",
};
const label = (tool: ToolName) => TOOL_LABELS[tool] ?? tool;

const CARD = "rounded-2xl border border-boarder-tertiary bg-surface-main-background";
const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const stamp = (iso: string) => new Date(iso).toLocaleString("en-US");

/** /usage (DESIGN §4.9, observed 2026-10-19): what the user's tools spent, per tool and per run. */
export function UsagePage() {
  const usage = useUsage();
  const [view, setView] = useState<"overview" | "detailed">("overview");
  const [tool, setTool] = useState<ToolName>();

  if (usage.isPending)
    return (
      <LoaderCircle aria-label="Loading usage" className="mx-auto mt-24 size-5 animate-spin" />
    );
  if (usage.isError)
    return (
      <p className="mt-24 text-center text-sm text-text-error">Couldn&apos;t load your usage.</p>
    );

  const { debitedMicro, executions, periodStart, periodEnd, tools } = usage.data;
  const period = `${day(periodStart)} - ${day(periodEnd)}`;
  const selected = tool ?? tools[0]?.tool;
  const open = (next: ToolName) => {
    setTool(next);
    setView("detailed");
  };

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-space-05 px-space-09 py-space-08">
      <header className="flex flex-col gap-space-02">
        <h1 className="text-[32px] leading-10 font-bold text-text-primary">AI Credits Overview</h1>
        <p className="text-lg text-text-primary">Track your AI usage and optimize credit spend</p>
      </header>

      <div className="grid grid-cols-2 gap-space-03 px-space-05 lg:grid-cols-4">
        <Stat
          icon={IconCurrencyDollar}
          label="Total debited"
          value={`${formatCredits(debitedMicro)} credits`}
        />
        <Stat icon={IconReceipt} label="Executions" value={String(executions)} />
        <Stat icon={IconListDetails} label="Categories" value={String(tools.length)} />
        <Stat icon={IconCalendar} label="Period" value={period} />
      </div>

      <div
        className={cn(
          CARD,
          "mx-space-05 flex flex-wrap items-center gap-space-03 p-space-04 text-sm",
        )}
      >
        {/* One view and one period in this build: shown as the reference does, not switchable. */}
        <span className="text-text-secondary">Show</span>
        <FixedSelect value="Debited Credits" />
        <span className="text-text-secondary">Period</span>
        <FixedSelect value="Current Period" />
        <span className="ml-auto text-text-secondary">{period}</span>
      </div>

      <div
        role="tablist"
        className="mx-space-05 grid grid-cols-2 rounded-full border border-boarder-tertiary bg-surface-main-background-2 p-0.5"
      >
        {(["overview", "detailed"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={view === tab}
            onClick={() => {
              setView(tab);
            }}
            className={cn(
              "h-9 rounded-full text-sm transition-colors",
              view === tab
                ? "border border-boarder-tertiary bg-surface-main-background text-text-primary"
                : "text-text-secondary",
            )}
          >
            {tab === "overview" ? "Overview" : "Detailed View"}
          </button>
        ))}
      </div>

      <div className="px-space-05">
        {view === "overview" ? (
          <Overview tools={tools} onOpen={open} />
        ) : selected ? (
          <Detailed tools={tools} tool={selected} onTool={setTool} />
        ) : (
          <p className="py-space-08 text-center text-sm text-text-secondary">No usage yet</p>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label: name,
  value,
}: {
  icon: typeof IconCalendar;
  label: string;
  value: string;
}) {
  return (
    <div className={cn(CARD, "flex items-center gap-space-04 p-space-04")}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-boarder-tertiary">
        <Icon className="size-5 text-icon-secondary" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-text-secondary uppercase">{name}</p>
        <p className="truncate text-lg font-bold text-text-primary">{value}</p>
      </div>
    </div>
  );
}

function FixedSelect({ value }: { value: string }) {
  return (
    <span className="flex h-9 w-48 items-center justify-between rounded-lg border border-boarder-tertiary px-space-04 text-text-primary">
      {value}
      <IconChevronDown className="size-4 text-icon-secondary" />
    </span>
  );
}

function Overview({ tools, onOpen }: { tools: ToolUsage[]; onOpen: (tool: ToolName) => void }) {
  if (!tools.length)
    return <p className="py-space-08 text-center text-sm text-text-secondary">No usage yet</p>;
  return (
    <div className={cn(CARD, "overflow-x-auto")}>
      <table className="w-full text-sm">
        <thead className="text-text-secondary">
          <tr className="border-b border-boarder-tertiary">
            <th className="px-space-05 py-space-04 text-left font-normal">Tool Name</th>
            <th className="px-space-05 py-space-04 text-right font-normal">Total Debited</th>
            <th className="px-space-05 py-space-04 text-right font-normal">Executions</th>
            <th className="px-space-05 py-space-04 text-left font-normal">Latest Usage</th>
            <th className="px-space-05 py-space-04 text-right font-normal">Action</th>
          </tr>
        </thead>
        <tbody>
          {tools.map((row) => (
            <tr key={row.tool} className="border-b border-boarder-tertiary last:border-0">
              <td className="px-space-05 py-space-05 text-text-primary">{label(row.tool)}</td>
              <td className="px-space-05 text-right font-bold tabular-nums">
                {formatCredits(row.debitedMicro)}
              </td>
              <td className="px-space-05 text-right tabular-nums">{row.executions}</td>
              <td className="px-space-05 text-text-primary">{stamp(row.latestAt)}</td>
              <td className="px-space-05 text-right">
                <button
                  type="button"
                  onClick={() => {
                    onOpen(row.tool);
                  }}
                  className="inline-flex h-7 items-center gap-space-02 rounded-lg border border-boarder-tertiary px-space-04 text-xs hover:bg-surface-secondary"
                >
                  <IconEye className="size-4" />
                  View details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Detailed({
  tools,
  tool,
  onTool,
}: {
  tools: ToolUsage[];
  tool: ToolName;
  onTool: (tool: ToolName) => void;
}) {
  const charges = useToolUsage(tool);
  const items = charges.data?.pages.flatMap((page) => page.items) ?? [];
  const summary = tools.find((row) => row.tool === tool);

  return (
    <div className="flex flex-col gap-space-04">
      <div
        className={cn(CARD, "flex flex-wrap items-center justify-between gap-space-03 p-space-04")}
      >
        <div>
          <p className="text-sm font-medium text-text-primary">Detailed records</p>
          <p className="text-sm text-text-secondary">
            Select a usage category, then open a record to inspect step costs.
          </p>
        </div>
        <select
          aria-label="Usage category"
          value={tool}
          onChange={(event) => {
            onTool(event.target.value as ToolName);
          }}
          className="h-10 w-64 rounded-lg border border-boarder-tertiary bg-surface-main-background px-space-04 text-sm"
        >
          {tools.map((row) => (
            <option key={row.tool} value={row.tool}>
              {`${label(row.tool)} - ${formatCredits(row.debitedMicro)}`}
            </option>
          ))}
        </select>
      </div>

      <div className={CARD}>
        <div className="flex items-start justify-between border-b border-boarder-tertiary px-space-07 py-space-06">
          <div>
            <h2 className="text-2xl text-text-primary">{label(tool)} usage executions</h2>
            <p className="text-sm text-text-secondary">
              {summary?.executions ?? 0} executions in the selected period
            </p>
          </div>
          <span className="rounded-md border border-boarder-tertiary px-space-03 py-0.5 text-xs font-medium">
            Debited
          </span>
        </div>
        <div className="px-space-04 pb-space-04">
          <div className="grid grid-cols-2 border-b border-boarder-tertiary px-space-04 py-space-05 text-sm text-text-secondary">
            <span>Credits Used</span>
            <span>Timestamp</span>
          </div>
          {items.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-2 border-b border-boarder-tertiary px-space-04 py-space-04 text-sm last:border-0"
            >
              <span className="font-bold tabular-nums">{formatCredits(entry.debitedMicro)}</span>
              <span>{stamp(entry.createdAt)}</span>
            </div>
          ))}
          {charges.hasNextPage && (
            <button
              type="button"
              disabled={charges.isFetchingNextPage}
              onClick={() => void charges.fetchNextPage()}
              className="mx-auto mt-space-03 block rounded-lg px-space-04 py-space-02 text-sm text-text-secondary hover:bg-surface-secondary"
            >
              Load more
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
