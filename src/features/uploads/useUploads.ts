"use client";

import { useAuth } from "@clerk/nextjs";
import Uppy from "@uppy/core";
import Transloadit from "@uppy/transloadit";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  MAX_ATTACHMENTS,
  MAX_UPLOAD_BYTES,
  type Attachment,
} from "@mohitbhalotia/magica-contracts";

import { ApiError } from "@/services/http";
import { completeUpload, createUpload } from "@/services/uploads.service";

/** One file in the composer, from picking it to being ready to send. */
export type Chip = {
  /** Stable for the chip's life (the browser's id, sent as clientFileId). */
  key: string;
  name: string;
  kind: Attachment["kind"];
  /** A local preview while uploading, then the stored file's signed link. */
  previewUrl: string | null;
  status: "uploading" | "processing" | "ready" | "failed";
  /** 0–100 while the bytes go up. */
  progress: number;
  attachmentId?: string;
  error?: string;
};

const KINDS = ["image", "video", "audio"] as const;
const kindOf = (type: string) => KINDS.find((kind) => type.startsWith(`${kind}/`));
/** After the bytes arrive, Transloadit still stores the file: check back a few times. */
const SETTLE_DELAYS_MS = [1000, 2000, 3000, 5000, 8000, 13000];

/**
 * Composer uploads (PRD §5.10): each file goes Uppy → Transloadit (tus, resumable) → private R2 on
 * its own Uppy instance, so it can be cancelled or retried alone, and the order the user picked is
 * kept. Files from the library join as ready chips.
 */
export function useUploads() {
  const { getToken } = useAuth();
  const [chips, setChips] = useState<Chip[]>([]);
  const uploads = useRef(new Map<string, Uppy>());

  const update = useCallback((key: string, patch: Partial<Chip>) => {
    setChips((now) => now.map((chip) => (chip.key === key ? { ...chip, ...patch } : chip)));
  }, []);

  // Leaving the page cancels unfinished uploads.
  useEffect(() => {
    const running = uploads.current;
    return () => {
      for (const uppy of running.values()) uppy.destroy();
    };
  }, []);

  /** Transloadit stores the file after the bytes arrive: confirm with our API until it's done. */
  const settle = useCallback(
    async (key: string, attachmentId: string | undefined, assemblyId: string) => {
      if (!attachmentId) return;
      for (const delay of SETTLE_DELAYS_MS) {
        const attachment = await completeUpload(attachmentId, assemblyId, await getToken()).catch(
          () => null,
        );
        if (attachment?.status === "ready") {
          update(key, { status: "ready", previewUrl: attachment.url ?? null });
          return;
        }
        if (attachment?.status === "failed") {
          update(key, { status: "failed", error: attachment.error ?? "The upload failed." });
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      update(key, { status: "failed", error: "The upload is taking too long. Try again." });
    },
    [getToken, update],
  );

  /** Uploads one picked file; its chip follows along. */
  const start = useCallback(
    (key: string, file: File) => {
      const uppy = new Uppy({ id: key, autoProceed: false });
      let attachmentId: string | undefined;
      uppy.use(Transloadit, {
        // Asked once per upload: our API registers the file and signs this one job.
        async assemblyOptions() {
          const created = await createUpload(
            { clientFileId: key, name: file.name, mimeType: file.type, sizeBytes: file.size },
            await getToken(),
          );
          attachmentId = created.attachment.id;
          return created.assemblyOptions;
        },
      });
      uppy.on("upload-progress", (_file, progress) => {
        const percent = progress.bytesTotal
          ? (progress.bytesUploaded / progress.bytesTotal) * 100
          : 0;
        update(key, { progress: Math.round(percent) });
      });
      uppy.on("upload-error", (_file, error) => {
        const message = error instanceof ApiError ? error.message : "The upload failed. Try again.";
        update(key, { status: "failed", error: message });
      });
      uppy.on("transloadit:assembly-created", (assembly) => {
        const assemblyId = assembly.assembly_id;
        update(key, { attachmentId });
        uppy.once("complete", () => {
          update(key, { status: "processing", progress: 100 });
          if (assemblyId) void settle(key, attachmentId, assemblyId);
        });
      });
      uploads.current.set(key, uppy);
      uppy.addFile({ name: file.name, type: file.type, data: file });
      void uppy.upload();
    },
    [getToken, update, settle],
  );

  /** Adds picked files (up to the 10-file limit); anything unsupported says why. */
  const add = useCallback(
    (files: File[]) => {
      const room = MAX_ATTACHMENTS - chips.length;
      for (const file of files.slice(0, Math.max(0, room))) {
        const key = crypto.randomUUID();
        const kind = kindOf(file.type);
        const problem = !kind
          ? "Only images, videos and audio can be attached."
          : file.size > MAX_UPLOAD_BYTES
            ? "Files can be up to 512 MB."
            : undefined;
        setChips((now) => [
          ...now,
          {
            key,
            name: file.name,
            kind: kind ?? "image",
            previewUrl: kind === "image" ? URL.createObjectURL(file) : null,
            status: problem ? "failed" : "uploading",
            progress: 0,
            error: problem,
          },
        ]);
        if (!problem) start(key, file);
      }
      return files.length > room ? `You can attach up to ${String(MAX_ATTACHMENTS)} files.` : null;
    },
    [chips.length, start],
  );

  /** Files picked from the library are already uploaded. */
  const addExisting = useCallback((attachments: Attachment[]) => {
    setChips((now) => {
      const present = new Set(now.map((chip) => chip.attachmentId));
      const added = attachments
        .filter((attachment) => !present.has(attachment.id))
        .map((attachment): Chip => ({
          key: attachment.id,
          name: attachment.name,
          kind: attachment.kind,
          previewUrl: attachment.url,
          status: "ready",
          progress: 100,
          attachmentId: attachment.id,
        }));
      return [...now, ...added].slice(0, MAX_ATTACHMENTS);
    });
  }, []);

  /** Removing a chip cancels its upload (and its Transloadit job). */
  const remove = useCallback((key: string) => {
    uploads.current.get(key)?.cancelAll();
    uploads.current.get(key)?.destroy();
    uploads.current.delete(key);
    setChips((now) => now.filter((chip) => chip.key !== key));
  }, []);

  const retry = useCallback(
    (key: string) => {
      const uppy = uploads.current.get(key);
      if (!uppy) return;
      update(key, { status: "uploading", progress: 0, error: undefined });
      void uppy.retryAll();
    },
    [update],
  );

  /** After a send: start fresh (the files now belong to the message). */
  const clear = useCallback(() => {
    for (const uppy of uploads.current.values()) uppy.destroy();
    uploads.current.clear();
    setChips([]);
  }, []);

  return {
    chips,
    add,
    addExisting,
    remove,
    retry,
    clear,
    /** In the user's order, once every chip is ready. */
    attachmentIds: chips.flatMap((chip) => (chip.attachmentId ? [chip.attachmentId] : [])),
    ready: chips.every((chip) => chip.status === "ready"),
  };
}
