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
      // DESIGN §4.13: dark #1b1b1b toasts, 14px, in both themes (reference tokens, not shadcn's).
      style={
        {
          "--normal-bg": "var(--magica-tooltip-surface)",
          "--normal-text": "var(--text-on-inverse)",
          "--normal-border": "transparent",
          "--border-radius": "var(--radius-xl)",
          fontSize: "var(--font-size-body)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
