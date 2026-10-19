"use client";

import { Check, Copy, KeyRound, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useState } from "react";

import { useApiKeys, useCreateApiKey, useRevokeApiKey } from "@/features/apiKeys/useApiKeys";
import { useUiStore } from "@/stores/uiStore";

// Same look as the task dialogs (TaskDialogs.tsx): there is no reference screen for keys.
const PANEL =
  "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[512px] max-w-[calc(100vw-32px)] -translate-1/2 flex-col gap-space-05 overflow-y-auto rounded-radius-xxl border border-boarder-tertiary bg-surface-main-background p-space-07 shadow-lg";
const BUTTON =
  "flex h-[34px] shrink-0 items-center gap-space-03 rounded-radius-l px-space-05 text-small font-medium outline-none focus-visible:ring-2 focus-visible:ring-boarder-action disabled:opacity-50 [&_svg]:size-4";
const PRIMARY = `${BUTTON} bg-(--magica-foundation-primary-bottom) text-(--magica-foundation-action-foreground)`;
const SECONDARY = `${BUTTON} border border-boarder-tertiary bg-surface-main-background text-text-primary transition-colors hover:bg-surface-secondary`;

const day = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

/** The new key, shown once with Copy: it can't be read back later. */
function NewKey({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-space-03 rounded-radius-l border border-boarder-tertiary p-space-05">
      <p className="text-small font-semibold">Copy your key now: you won’t see it again.</p>
      <div className="flex items-center gap-space-03">
        <code className="min-w-0 flex-1 rounded-radius-m bg-surface-secondary px-space-03 py-space-02 font-mono text-caption break-all">
          {value}
        </code>
        <button
          type="button"
          className={SECONDARY}
          onClick={() => {
            void navigator.clipboard.writeText(value).then(() => {
              setCopied(true);
            });
          }}
        >
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

/** "API keys" (user menu): create, list and revoke the keys for the public API (PRD §6.8). */
export function ApiKeysDialog() {
  const open = useUiStore((s) => s.apiKeysOpen);
  const setOpen = useUiStore((s) => s.setApiKeysOpen);
  const keys = useApiKeys(open);
  const create = useCreateApiKey();
  const revoke = useRevokeApiKey();
  const [name, setName] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // The key is shown only once: closing the dialog forgets it.
        if (!next) create.reset();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 backdrop-blur-[3px]" />
        <Dialog.Content className={PANEL}>
          <div>
            <Dialog.Title className="text-small font-semibold">API keys</Dialog.Title>
            <Dialog.Description className="mt-space-02 text-small text-text-secondary">
              Use a key as <code className="font-mono">Authorization: Bearer ak_…</code> to call the
              Magica Agent API. Treat it like a password.
            </Dialog.Description>
          </div>

          <form
            className="flex gap-space-03"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate(name.trim(), {
                onSuccess: () => {
                  setName("");
                },
              });
            }}
          >
            <input
              aria-label="Key name"
              placeholder="Key name, e.g. CI"
              value={name}
              maxLength={60}
              onChange={(e) => {
                setName(e.target.value);
              }}
              className="h-[34px] min-w-0 flex-1 rounded-radius-l border border-boarder-tertiary bg-surface-main-background px-space-04 text-small text-text-primary outline-none placeholder:text-text-tertiary focus-visible:ring-2 focus-visible:ring-boarder-action"
            />
            <button
              type="submit"
              disabled={name.trim() === "" || create.isPending}
              className={PRIMARY}
            >
              <KeyRound />
              Create key
            </button>
          </form>

          {create.data && <NewKey value={create.data.key} />}

          {keys.isPending ? (
            <p className="text-small text-text-secondary">Loading keys…</p>
          ) : keys.data?.items.length ? (
            <ul aria-label="Your API keys" className="flex flex-col">
              {keys.data.items.map((k) => (
                <li
                  key={k.id}
                  className="flex items-center gap-space-04 border-t border-boarder-tertiary py-space-04 first:border-t-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-small font-medium text-text-primary">{k.name}</p>
                    <p className="text-caption text-text-secondary">
                      <span className="font-mono">{k.prefix}…</span> · Created {day(k.createdAt)} ·{" "}
                      {k.lastUsedAt ? `Last used ${day(k.lastUsedAt)}` : "Never used"}
                    </p>
                  </div>
                  {confirming === k.id ? (
                    <button
                      type="button"
                      className={`${BUTTON} bg-(--magica-foundation-danger) text-(--magica-foundation-action-foreground)`}
                      disabled={revoke.isPending}
                      onClick={() => {
                        revoke.mutate(k.id, {
                          onSettled: () => {
                            setConfirming(null);
                          },
                        });
                      }}
                    >
                      Revoke {k.name}?
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={SECONDARY}
                      onClick={() => {
                        setConfirming(k.id);
                      }}
                    >
                      Revoke
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-small text-text-secondary">No keys yet.</p>
          )}

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
