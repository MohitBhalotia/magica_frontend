"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type {
  Waitpoint,
  WaitpointRequest,
  WaitpointResponse,
  WaitpointType,
} from "@mohitbhalotia/magica-contracts";

import { MessageResponse } from "@/components/ai-elements/message";
import { formatCredits } from "@/lib/credits";
import { cn } from "@/lib/utils";
import { ApiError } from "@/services/http";
import { respondWaitpoint } from "@/services/waitpoints.service";

type BodyProps<T extends WaitpointType> = {
  request: WaitpointRequest<T>;
  answer: (response: WaitpointResponse<T>) => void;
  disabled: boolean;
};

const PRIMARY =
  "h-8 rounded-radius-max bg-surface-primary-active px-space-04 text-small font-medium text-text-on-action transition-opacity hover:opacity-90 disabled:opacity-50";
const SECONDARY =
  "h-8 rounded-radius-max border border-boarder-secondary px-space-04 text-small font-medium text-text-primary transition-colors hover:bg-surface-main-background-2 disabled:opacity-50";

/** One body per waitpoint type (DESIGN §4.11); keyed by type, so a new type must add its own. */
const BODIES: { [T in WaitpointType]: (props: BodyProps<T>) => React.ReactNode } = {
  credit_approval: ({ request, answer, disabled }) => (
    <>
      <p className="text-small text-text-primary">
        {request.estimateMicro === null
          ? "Magica couldn't estimate what this will cost."
          : `This will use ~${formatCredits(request.estimateMicro)} credits.`}{" "}
        <span className="text-text-secondary">You have {formatCredits(request.balanceMicro)}.</span>
      </p>
      <div className="flex gap-space-03">
        <button
          type="button"
          className={PRIMARY}
          disabled={disabled}
          onClick={() => {
            answer({ approved: true });
          }}
        >
          Approve
        </button>
        <button
          type="button"
          className={SECONDARY}
          disabled={disabled}
          onClick={() => {
            answer({ approved: false });
          }}
        >
          Cancel
        </button>
      </div>
    </>
  ),

  options: ({ request, answer, disabled }) => (
    <>
      <p className="text-small font-medium text-text-primary">{request.question}</p>
      <div className="flex flex-wrap gap-space-03">
        {request.options.map((option) => (
          <button
            key={option}
            type="button"
            className={SECONDARY}
            disabled={disabled}
            onClick={() => {
              answer({ choice: option });
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </>
  ),

  plan_approval: function PlanBody({ request, answer, disabled }) {
    const [feedback, setFeedback] = useState("");
    return (
      <>
        <div className="text-small">
          <MessageResponse>{request.plan}</MessageResponse>
        </div>
        <textarea
          aria-label="Changes to the plan (optional)"
          placeholder="Changes to the plan (optional)"
          value={feedback}
          maxLength={1000}
          onChange={(event) => {
            setFeedback(event.target.value);
          }}
          className="min-h-16 w-full resize-none rounded-lg border border-boarder-tertiary bg-surface-main-background p-space-03 text-small outline-none focus-visible:ring-2 focus-visible:ring-boarder-action"
        />
        <div className="flex gap-space-03">
          <button
            type="button"
            className={PRIMARY}
            disabled={disabled}
            onClick={() => {
              answer({ approved: true });
            }}
          >
            Approve
          </button>
          <button
            type="button"
            className={SECONDARY}
            disabled={disabled}
            onClick={() => {
              answer({ approved: false, feedback: feedback.trim() || undefined });
            }}
          >
            Reject
          </button>
        </div>
      </>
    );
  },
};

const TITLES: Record<WaitpointType, string> = {
  credit_approval: "Approve credits",
  options: "Choose an option",
  plan_approval: "Review the plan",
};

/** Seconds left until `expiresAt`, ticking every second. */
function useSecondsLeft(expiresAt: string) {
  const left = () => Math.max(0, Math.ceil((Date.parse(expiresAt) - Date.now()) / 1000));
  const [seconds, setSeconds] = useState(left);
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(left());
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  });
  return seconds;
}

/**
 * The question a paused run is waiting on (PRD §5.8, DESIGN §4.11): above the composer, focused
 * and announced when it appears. Answering hides it at once; the run picks the answer up and goes on.
 */
export function WaitpointCard({ waitpoint }: { waitpoint: Waitpoint }) {
  const { getToken } = useAuth();
  const respond = useMutation({
    mutationFn: async (response: unknown) =>
      respondWaitpoint(waitpoint.id, response, await getToken()),
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Couldn't send your answer.");
    },
  });
  const seconds = useSecondsLeft(waitpoint.expiresAt);
  const card = useRef<HTMLDivElement>(null);
  useEffect(() => {
    card.current?.focus();
  }, [waitpoint.id]);

  if (respond.isSuccess) return null;
  const expired = seconds === 0;
  const Body = BODIES[waitpoint.type] as (props: BodyProps<WaitpointType>) => React.ReactNode;

  return (
    <div
      ref={card}
      tabIndex={-1}
      role="region"
      aria-label={TITLES[waitpoint.type]}
      aria-live="polite"
      className={cn(
        "mt-space-04 flex flex-col gap-space-03 rounded-2xl border border-boarder-tertiary bg-surface-main-background p-space-05 shadow-md outline-none",
        expired && "opacity-60",
      )}
    >
      <div className="flex items-center justify-between gap-space-03">
        <p className="text-small font-semibold text-text-primary">{TITLES[waitpoint.type]}</p>
        <span className="text-caption text-text-tertiary tabular-nums">
          {expired
            ? "Expired"
            : `Expires in ${String(Math.floor(seconds / 60))}:${String(seconds % 60).padStart(2, "0")}`}
        </span>
      </div>
      {expired ? (
        <p className="text-small text-text-secondary">This request expired. Reply to continue.</p>
      ) : (
        <Body
          request={waitpoint.request}
          answer={(response) => {
            respond.mutate(response);
          }}
          disabled={respond.isPending}
        />
      )}
    </div>
  );
}
