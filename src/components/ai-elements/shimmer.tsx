"use client";

import { motion } from "motion/react";
import { memo, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

// Vercel AI Elements `shimmer` (DEC-053). Upstream picks the element via an `as` prop and creates
// a motion component per element at render time; we only ever render a <p>, so it's `motion.p`.

export type TextShimmerProps = {
  children: string;
  className?: string;
  duration?: number;
  spread?: number;
};

const ShimmerComponent = ({ children, className, duration = 2, spread = 2 }: TextShimmerProps) => (
  <motion.p
    animate={{ backgroundPosition: "0% center" }}
    className={cn(
      "relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent",
      "[background-repeat:no-repeat,padding-box] [--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--color-background),#0000_calc(50%+var(--spread)))]",
      className,
    )}
    initial={{ backgroundPosition: "100% center" }}
    style={
      {
        "--spread": `${String(children.length * spread)}px`,
        backgroundImage:
          "var(--bg), linear-gradient(var(--color-muted-foreground), var(--color-muted-foreground))",
      } as CSSProperties
    }
    transition={{ duration, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
  >
    {children}
  </motion.p>
);

export const Shimmer = memo(ShimmerComponent);
