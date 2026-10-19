import type { Attachment } from "@mohitbhalotia/magica-contracts";

/**
 * The files a user sent, above their bubble and in their order (DESIGN §4.5 [TBV]: "attachments
 * render above the bubble"). Images and videos open the file; audio plays in place.
 */
export function MessageAttachments({ attachments }: { attachments: Attachment[] }) {
  const shown = attachments.filter((attachment) => attachment.url);
  if (!shown.length) return null;
  return (
    <ul aria-label="Attached files" className="flex max-w-md flex-wrap justify-end gap-space-02">
      {shown.map((attachment) =>
        attachment.kind === "audio" ? (
          <li key={attachment.id}>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption -- user audio has no captions */}
            <audio
              controls
              src={attachment.url ?? undefined}
              aria-label={attachment.name}
              className="h-10 max-w-full"
            />
          </li>
        ) : (
          <li key={attachment.id}>
            <a
              href={attachment.url ?? undefined}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${attachment.name}`}
              className="block size-24 overflow-hidden rounded-xl border border-boarder-tertiary bg-surface-secondary"
            >
              {attachment.kind === "image" ? (
                // A signed link to a private file: not for the image optimiser.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attachment.url ?? undefined}
                  alt={attachment.name}
                  className="size-full object-cover"
                />
              ) : (
                <video
                  src={attachment.url ?? undefined}
                  muted
                  preload="metadata"
                  className="size-full object-cover"
                />
              )}
            </a>
          </li>
        ),
      )}
    </ul>
  );
}
