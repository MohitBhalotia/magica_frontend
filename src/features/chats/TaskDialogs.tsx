"use client";

import { Copy, X } from "lucide-react";
import { AlertDialog, Dialog } from "radix-ui";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

const PANEL =
  "fixed top-1/2 left-1/2 z-50 flex max-w-[calc(100vw-32px)] -translate-1/2 flex-col gap-space-05 rounded-radius-xxl border border-boarder-tertiary bg-surface-main-background p-space-07 shadow-lg";
const CANCEL =
  "border border-boarder-tertiary bg-surface-main-background font-medium text-text-primary outline-none transition-colors hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-boarder-action";

/** "Duplicate task" confirmation (observed 2026-10-18): copies the chat and all its messages. */
export function DuplicateTaskDialog({
  title,
  open,
  onOpenChange,
  onConfirm,
}: Props & { title: string }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 backdrop-blur-[3px]" />
        <Dialog.Content className={`${PANEL} w-[448px]`}>
          <div>
            <Dialog.Title className="text-small font-semibold">Duplicate task</Dialog.Title>
            <Dialog.Description className="mt-space-02 text-small wrap-anywhere text-text-secondary">
              Create an exact copy of the task “{title}” and all its messages.
            </Dialog.Description>
          </div>
          <div className="flex gap-space-04 rounded-radius-l border border-boarder-tertiary p-space-05">
            <Copy className="size-5 shrink-0" />
            <div>
              <p className="text-small font-semibold">Complete task copy</p>
              <p className="mt-space-02 text-small leading-relaxed text-text-secondary">
                All messages will be copied to a new task. The original task will remain unchanged.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-space-04">
            <Dialog.Close className={`h-[34px] rounded-radius-l px-space-05 text-small ${CANCEL}`}>
              Cancel
            </Dialog.Close>
            <button
              type="button"
              onClick={onConfirm}
              className="flex h-[34px] items-center gap-space-03 rounded-radius-l bg-(--magica-foundation-primary-bottom) px-space-05 text-small font-medium text-(--magica-foundation-action-foreground) outline-none focus-visible:ring-2 focus-visible:ring-boarder-action [&_svg]:size-4"
            >
              <Copy />
              Duplicate task
            </button>
          </div>
          <Dialog.Close
            aria-label="Close"
            className="absolute top-space-07 right-space-07 rounded-radius-l text-icon-primary outline-none focus-visible:ring-2 focus-visible:ring-boarder-action"
          >
            <X className="size-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** "Delete task?" alert (observed 2026-10-18): destructive, so Radix AlertDialog focuses Cancel. */
export function DeleteTaskDialog({ open, onOpenChange, onConfirm }: Props) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-surface-overlay-control backdrop-blur-[3px]" />
        <AlertDialog.Content className={`${PANEL} w-[512px]`}>
          <div>
            <AlertDialog.Title className="text-[18px] leading-7 font-semibold">
              Delete task?
            </AlertDialog.Title>
            <AlertDialog.Description className="text-small text-text-secondary">
              This task will be permanently deleted and cannot be recovered.
            </AlertDialog.Description>
          </div>
          <div className="flex justify-end gap-space-02">
            <AlertDialog.Cancel className={`h-9 rounded-radius-max px-[14px] text-small ${CANCEL}`}>
              Cancel
            </AlertDialog.Cancel>
            <AlertDialog.Action
              onClick={onConfirm}
              className="h-9 rounded-radius-max bg-(--magica-foundation-danger) px-[14px] text-small font-medium text-(--magica-foundation-action-foreground) shadow-[0_0_0_1px_var(--magica-foundation-danger),inset_0_1px_0_rgba(255,255,255,.14)] outline-none hover:bg-(--magica-foundation-danger-hover) focus-visible:ring-2 focus-visible:ring-boarder-action"
            >
              Delete
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
