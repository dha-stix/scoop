import clsx from "clsx";
import type { ReactNode } from "react";
import { CANDIDATE_STATUS, STATUS, type Tone } from "@/lib/constants";
import type { ApplicationStatus } from "@/lib/types";

const TONES: Record<Tone, string> = {
  neutral: "bg-[#f0f1f6] text-body",
  success: "bg-success-soft text-success-ink",
  warning: "bg-warning-soft text-warning-ink",
  violet: "bg-violet-soft text-violet-dark",
  danger: "bg-danger-soft text-danger-ink",
  lime: "bg-lime text-ink",
  dark: "bg-black/55 text-white",
  // For light pages
  outline: "border border-line bg-white text-body",
  // For dark surfaces
  night: "bg-ink-3 text-white",
  glow: "bg-lime/15 text-lime",
  live: "bg-[#2a1418] text-[#ff8a8f]",
};

// `pulseColor` sets the live dot's colour (defaults to the text colour).
export default function Badge({ tone = "neutral", pulse, pulseColor = "bg-current", className, children }: { tone?: Tone; pulse?: boolean; pulseColor?: string; className?: string; children: ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap", TONES[tone], className)}>
      {pulse && <span className={clsx("size-1.5 animate-pulse-soft rounded-full", pulseColor)} />}
      {children}
    </span>
  );
}

// `audience` picks HR wording ("New") or candidate wording ("Applied").
export function StatusBadge({ status, audience = "hr" }: { status: ApplicationStatus; audience?: "hr" | "candidate" }) {
  const meta = (audience === "hr" ? STATUS : CANDIDATE_STATUS)[status] ?? STATUS.applied;
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
