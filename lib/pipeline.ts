// Turns an application's status + history into tracker steps.
import { CLOSED_STATUSES, PIPELINE_STEPS } from "./constants";
import { formatDate } from "./format";
import type { Application } from "./types";

export type StepState = "done" | "current" | "todo" | "closed";
export type TimelineStep = { label: string; detail?: string; state: StepState };

export function pipelineProgress(application: Pick<Application, "status" | "history">) {
  const reachedAt = new Map(application.history.map((h) => [h.status, h.at]));
  const closed = CLOSED_STATUSES.includes(application.status);

  // For a closed application, progress stops at the furthest pipeline step reached.
  let current = PIPELINE_STEPS.findIndex((s) => s.id === application.status);
  if (current === -1) {
    current = PIPELINE_STEPS.reduce((max, s, i) => (reachedAt.has(s.id) ? i : max), 0);
  }

  const steps: TimelineStep[] = PIPELINE_STEPS.map((s, i) => ({
    label: s.label,
    detail: reachedAt.has(s.id) ? formatDate(reachedAt.get(s.id)) : undefined,
    state: i < current ? "done" : i === current ? (closed ? "closed" : application.status === "hired" ? "done" : "current") : "todo",
  }));

  return { steps, current, closed, total: PIPELINE_STEPS.length };
}
