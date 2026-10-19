"use client";

import { motion, useReducedMotion } from "motion/react";
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

const ShimmerComponent = ({ children, className, duration = 2, spread = 2 }: TextShimmerProps) => {
  // DESIGN §2.8: the CSS reduced-motion rule can't reach a JS animation, so it's stopped here.
  const still = useReducedMotion() === true;
  return (
    <motion.p
      animate={still ? false : { backgroundPosition: "0% center" }}
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
};

export const Shimmer = memo(ShimmerComponent);
