"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { saveReview } from "@/lib/firebase-actions";
import type { Application, Scorecard } from "@/lib/types";

const CRITERIA: { key: keyof Scorecard; label: string }[] = [
  { key: "technical", label: "Technical skills" },
  { key: "communication", label: "Communication" },
  { key: "cultureAdd", label: "Culture add" },
];

// HR-only scorecard and notes. Saved on the application, never shown to the candidate.
export default function InterviewNotes({ application }: { application: Application }) {
  const [score, setScore] = useState<Scorecard>(application.scorecard ?? { technical: 0, communication: 0, cultureAdd: 0 });
  const [notes, setNotes] = useState(application.notes ?? "");
  const [saved, setSaved] = useState(false);

  async function persist(next: { scorecard?: Scorecard; notes?: string }) {
    await saveReview(application.id, next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
      <p className="text-xs text-[#9ea3ba]">Only visible to your hiring team {saved && <span className="text-lime">· Saved</span>}</p>
      {CRITERIA.map(({ key, label }) => (
        <fieldset key={key} className="flex items-center justify-between gap-2 text-sm">
          <legend className="sr-only">{label}</legend>
          <span>{label}</span>
          <span className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${label}: ${n} of 5`}
                aria-pressed={score[key] === n}
                onClick={() => {
                  const next = { ...score, [key]: n };
                  setScore(next);
                  persist({ scorecard: next });
                }}
                className={clsx("size-6 rounded-full transition hover:scale-110", n <= score[key] ? "bg-lime" : "bg-ink-4")}
              />
            ))}
          </span>
        </fieldset>
      ))}
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
        Notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== application.notes && persist({ notes })}
          className="min-h-36 rounded-xl border border-[#343a58] bg-[#0a0d1a] p-3 text-sm font-normal text-white outline-none focus:border-violet"
          placeholder="Strengths, concerns, follow-ups…"
        />
      </label>
      <Link href={`/dashboard/jobs/${application.jobId}/applicants`} className="mt-auto rounded-xl bg-success py-3 text-center text-sm font-semibold hover:bg-success-ink">
        Decide in pipeline after the call
      </Link>
    </div>
  );
}
