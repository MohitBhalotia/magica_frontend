"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      // DESIGN §4.13 (observed): white card, top right, 14px semibold title + secondary description.
      position="top-right"
      closeButton
      toastOptions={{
        classNames: {
          // Room for the ✕, which the reference shows inside the card on the right.
          toast: "pr-space-09!",
          title: "text-small! font-semibold!",
          description: "text-small! text-text-secondary!",
          // Sonner pins it to the top-left corner as a bordered circle; move it right, centred.
          closeButton:
            "top-1/2! right-space-04! left-auto! transform-none! -translate-y-1/2! border-0! bg-transparent! text-icon-secondary! hover:text-icon-primary!",
        },
      }}
      style={
        {
          "--normal-bg": "var(--surface-main-background)",
          "--normal-text": "var(--text-primary)",
          "--normal-border": "var(--boarder-tertiary)",
          "--border-radius": "var(--radius-xxl)",
          fontSize: "var(--font-size-body)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
