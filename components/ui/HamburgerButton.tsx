"use client";

import clsx from "clsx";
import { motion } from "motion/react";

type Props = { open: boolean; onToggle: () => void; controls: string; light?: boolean; className?: string };

const LINE = "absolute left-0 block h-0.5 w-5 rounded-full bg-current";
const SPRING = { type: "spring", stiffness: 380, damping: 26 } as const;

// Three bars that morph into an X when open.
export default function HamburgerButton({ open, onToggle, controls, light, className }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      aria-controls={controls}
      className={clsx(
        "grid size-11 place-items-center rounded-xl border transition-colors",
        light ? "border-ink-4 bg-ink-3 text-white hover:bg-ink-4" : "border-line-strong bg-white text-ink hover:border-ink",
        className,
      )}
    >
      <span className="relative block h-3.5 w-5" aria-hidden="true">
        <motion.span className={clsx(LINE, "top-0")} animate={open ? { top: 6, rotate: 45 } : { top: 0, rotate: 0 }} transition={SPRING} />
        <motion.span className={clsx(LINE, "top-1.5")} animate={open ? { opacity: 0, scaleX: 0.2 } : { opacity: 1, scaleX: 1 }} transition={{ duration: 0.15 }} />
        <motion.span className={clsx(LINE, "top-3")} animate={open ? { top: 6, rotate: -45 } : { top: 12, rotate: 0 }} transition={SPRING} />
      </span>
    </button>
  );
}
