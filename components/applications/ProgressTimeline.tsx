import clsx from "clsx";
import { Check, X } from "lucide-react";
import type { TimelineStep } from "@/lib/pipeline";

// Vertical tracker: green ticks for finished steps, a pulsing dot for the
// current one, and empty rings for what's next. Used on the homepage demo
// and on the candidate's real application page.
export default function ProgressTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="flex flex-col">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={step.label} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <StepDot state={step.state} />
              {!last && <span className={clsx("h-9 w-0.5", step.state === "done" ? "bg-success" : "bg-line")} />}
            </div>
            <div className="pb-1">
              <div
                className={clsx(
                  "font-semibold",
                  step.state === "current" && "font-bold text-violet-dark",
                  step.state === "todo" && "text-subtle",
                  step.state === "closed" && "text-danger-ink",
                )}
              >
                {step.label}
              </div>
              {step.detail && <div className="text-[13px] text-muted">{step.detail}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StepDot({ state }: { state: TimelineStep["state"] }) {
  if (state === "done")
    return (
      <span className="grid size-6 place-items-center rounded-full bg-success">
        <Check className="size-3.5 text-white" strokeWidth={3} />
      </span>
    );
  if (state === "current") return <span className="size-6 animate-pulse-soft rounded-full bg-violet shadow-[0_0_0_6px_var(--color-violet-glow)]" />;
  if (state === "closed")
    return (
      <span className="grid size-6 place-items-center rounded-full bg-danger-soft">
        <X className="size-3.5 text-danger-ink" strokeWidth={3} />
      </span>
    );
  return <span className="size-6 rounded-full border-2 border-line-strong" />;
}

// Compact horizontal bar version for list rows.
export function ProgressBar({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="flex gap-1" aria-hidden="true">
      {steps.map((s) => (
        <span
          key={s.label}
          className={clsx(
            "h-1.5 flex-1 rounded-full",
            s.state === "done" && "bg-success",
            s.state === "current" && "bg-violet",
            s.state === "closed" && "bg-line-strong",
            s.state === "todo" && "bg-[#eef0f5]",
          )}
        />
      ))}
    </div>
  );
}
