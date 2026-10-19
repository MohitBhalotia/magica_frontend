import { Download, ImagePlus } from "lucide-react";
import Image from "next/image";

import {
  MediaToolOutputSchema,
  TOOLS,
  type MediaAsset,
  type ToolBlock,
} from "@mohitbhalotia/magica-contracts";

import { Skeleton } from "@/components/ui/skeleton";
import { toolName } from "@/features/chat/ToolSteps";
import { notAvailable } from "@/features/shell/nav";
import { downloadFile } from "@/lib/download";

/** DESIGN §4.7: a 384px box (narrower on phones), radius 12, letterboxed on the primary surface. */
const BOX = "relative w-96 max-w-full overflow-hidden rounded-xl bg-surface-primary";
const OVERLAY_BUTTON =
  "flex size-8 items-center justify-center rounded-full bg-surface-overlay-control text-white hover:bg-surface-overlay-control-hover";

/** What the turn's media steps made, shown inline after the text; a running step shows a skeleton. */
export function GeneratedMedia({ steps, streaming }: { steps: ToolBlock[]; streaming: boolean }) {
  const media = steps.filter((step) => TOOLS[toolName(step)] === "media");
  const assets = media.flatMap(
    (step) => MediaToolOutputSchema.safeParse(step.output).data?.assets ?? [],
  );
  const running = streaming && media.some((step) => step.state.startsWith("input-"));
  if (!assets.length && !running) return null;

  return (
    <div className="mt-space-04 flex flex-col gap-space-03">
      {assets.map((asset) => (
        <Asset key={asset.url} asset={asset} />
      ))}
      {running && <Skeleton aria-label="Generating" className={`${BOX} aspect-square`} />}
    </div>
  );
}

function Asset({ asset }: { asset: MediaAsset }) {
  return (
    <div className={`group ${BOX}`}>
      {asset.kind === "image" ? (
        <Image
          src={asset.url}
          alt="Generated image"
          width={asset.width ?? 1024}
          height={asset.height ?? 1024}
          sizes="384px"
          className="h-auto w-full object-contain"
        />
      ) : (
        // eslint-disable-next-line jsx-a11y/media-has-caption -- generated videos come without captions
        <video src={asset.url} controls preload="metadata" className="w-full" />
      )}
      <div className="absolute top-space-02 right-space-02 flex gap-space-02 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <button
          type="button"
          aria-label="Use as reference"
          onClick={notAvailable}
          className={OVERLAY_BUTTON}
        >
          <ImagePlus className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Download"
          onClick={() => void downloadFile(asset.url)}
          className={OVERLAY_BUTTON}
        >
          <Download className="size-4" />
        </button>
      </div>
    </div>
  );
}
