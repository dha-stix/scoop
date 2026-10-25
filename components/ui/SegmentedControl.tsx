"use client";

import clsx from "clsx";
import { motion } from "motion/react";

type Option<T extends string> = { value: T; label: string };
type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
  layoutId?: string;
};

// Pill toggle with a sliding highlight (e.g. "For companies / For candidates").
export default function SegmentedControl<T extends string>({ options, value, onChange, label, className, layoutId = "segment" }: Props<T>) {
  return (
    <div role="group" aria-label={label} className={clsx("inline-flex gap-1 rounded-full border border-line bg-white p-1.5", className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={clsx("relative min-h-11 flex-1 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors sm:px-5", active ? "text-white" : "text-body hover:text-ink")}
          >
            {active && <motion.span layoutId={layoutId} className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className="relative">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
