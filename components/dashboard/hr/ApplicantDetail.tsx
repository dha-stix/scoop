"use client";

import { useState } from "react";
import { motion } from "motion/react";
import clsx from "clsx";
import { Archive, Check, Download, ExternalLink, Gift, Star, Trash2, Video } from "lucide-react";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import ProgressTimeline from "@/components/applications/ProgressTimeline";
import { useCvUrl } from "@/components/applications/useCvUrl";
import { ConfirmModal, OfferModal, ScheduleInterviewModal } from "./ActionModals";
import type { useApplicantActions } from "./useApplicantActions";
import { saveReview } from "@/lib/supabase-actions";
import { pipelineProgress } from "@/lib/pipeline";
import { formatDate, formatDateTime, safeHttpUrl } from "@/lib/format";
import type { Application, Job } from "@/lib/types";

type Actions = ReturnType<typeof useApplicantActions>;
type Dialog = "schedule" | "offer" | "reject" | "delete" | null;

const CAN_SHORTLIST = ["applied", "reviewed"];
const CAN_INTERVIEW = ["applied", "reviewed", "shortlisted", "interview"];
const CAN_OFFER = ["shortlisted", "interview"];
const CLOSED = ["rejected", "hired", "declined"];

export default function ApplicantDetail({ application: a, job, actions }: { application: Application; job: Job; actions: Actions }) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [notes, setNotes] = useState(a.notes ?? "");
  const [rating, setRating] = useState(a.rating ?? 0);
  const isPdf = a.cvName?.toLowerCase().endsWith(".pdf");
  const cvUrl = useCvUrl(a.cvPath);
  // Candidate-supplied links: only real http(s) URLs become clickable.
  const linkedin = safeHttpUrl(a.candidate.linkedin);
  const portfolio = safeHttpUrl(a.candidate.portfolio);
  const close = () => setDialog(null);

  const info = [
    ["Email", a.candidate.email],
    ["Phone", a.candidate.phone],
    ["Experience", `${a.candidate.experience} years`],
    ["Can start", a.candidate.startDate ? formatDate(a.candidate.startDate) : "Flexible"],
  ];

  return (
    <motion.section initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }} className="card min-w-0 flex-[999_1_560px] p-6 sm:p-7">
      <div className="flex flex-wrap items-center gap-4.5">
        <Avatar src={a.candidate.photoURL} name={a.candidate.name} size={72} />
        <div className="min-w-[200px] flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-[28px] font-bold">{a.candidate.name}</h2>
            <StatusBadge status={a.status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {a.candidate.location} · Applied {formatDate(a.createdAt)}
          </p>
        </div>
        <div className="flex" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => {
                setRating(n);
                saveReview(a, { rating: n });
              }}
              className="grid size-9 place-items-center transition hover:scale-110"
            >
              <Star className={clsx("size-5", n <= rating ? "fill-[#f5b301] text-[#f5b301]" : "text-line-strong")} />
            </button>
          ))}
        </div>
      </div>

      {a.interview && a.status === "interview" && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-violet-soft px-4 py-3.5 text-sm text-violet-dark">
          <Video className="size-5" />
          <span className="flex-1 font-semibold">Interview · {formatDateTime(a.interview.scheduledAt)} · {a.interview.durationMins} min</span>
          <Button href={`/interview/${a.id}`} size="sm">
            Join room
          </Button>
        </div>
      )}
      {a.offer && (a.status === "offer" || a.status === "hired") && (
        <div className="mt-5 rounded-2xl bg-success-soft px-4 py-3.5 text-sm text-success-ink">
          <b>{a.status === "hired" ? "Offer accepted" : "Offer sent"}</b> · {a.offer.salary} · starts {formatDate(a.offer.startDate)}
        </div>
      )}

      {!CLOSED.includes(a.status) && (
        <div className="my-5.5 flex flex-wrap gap-2 rounded-2xl bg-mist p-3.5">
          {CAN_SHORTLIST.includes(a.status) && (
            <Button shape="rounded" onClick={() => actions.shortlist([a])}>
              <Check className="size-4" strokeWidth={2.6} /> Shortlist
            </Button>
          )}
          {CAN_INTERVIEW.includes(a.status) && (
            <Button shape="rounded" variant={CAN_SHORTLIST.includes(a.status) ? "secondary" : "primary"} onClick={() => setDialog("schedule")}>
              <Video className="size-4" /> {a.status === "interview" ? "Reschedule" : "Schedule interview"}
            </Button>
          )}
          {CAN_OFFER.includes(a.status) && (
            <Button shape="rounded" variant="secondary" onClick={() => setDialog("offer")}>
              <Gift className="size-4" /> Make offer
            </Button>
          )}
          <span className="flex-1" />
          {a.status !== "archived" && (
            <Button shape="rounded" variant="secondary" onClick={() => actions.archive(a)}>
              <Archive className="size-4" /> Archive
            </Button>
          )}
          <Button shape="rounded" variant="danger" onClick={() => setDialog("reject")}>
            Reject &amp; email
          </Button>
          <Button shape="rounded" variant="danger" aria-label="Delete application" onClick={() => setDialog("delete")}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}

      <div className="my-5 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {info.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[#eef0f5] p-3.5">
            <div className="text-xs font-semibold text-subtle">{label}</div>
            <div className="mt-1 truncate text-sm font-semibold">{value || "—"}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="min-w-0 flex-[2_1_320px]">
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-[15px] font-bold">CV preview</h3>
            {cvUrl && (
              <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px] font-semibold text-violet hover:underline">
                <Download className="size-3.5" /> Download
              </a>
            )}
          </div>
          {!cvUrl ? (
            <div className="grid h-40 animate-pulse place-items-center rounded-2xl border border-line bg-[#fafafd] text-sm text-muted">Loading CV…</div>
          ) : isPdf ? (
            <iframe src={`${cvUrl}#view=FitH`} title={`${a.candidate.name}'s CV`} className="h-[440px] w-full rounded-2xl border border-line bg-[#fafafd]" />
          ) : (
            <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-[#fafafd] text-sm font-semibold text-violet">
              <ExternalLink className="size-5" /> Open {a.cvName}
            </a>
          )}
        </div>
        <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-4.5">
          {a.coverLetter && (
            <div>
              <h3 className="mb-2.5 text-[15px] font-bold">Cover letter</h3>
              <p className="max-h-56 overflow-y-auto rounded-2xl border border-line bg-[#fafafd] p-4 text-sm leading-relaxed whitespace-pre-line text-body">{a.coverLetter}</p>
            </div>
          )}
          {a.answers?.length > 0 && (
            <div>
              <h3 className="mb-2.5 text-[15px] font-bold">Screening answers</h3>
              <dl className="flex flex-col gap-2.5 text-sm">
                {a.answers.map((ans) => (
                  <div key={ans.prompt}>
                    <dt className="font-semibold">{ans.prompt}</dt>
                    <dd className="text-body">{ans.answer || "—"}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {(linkedin || portfolio) && (
            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              {linkedin && (
                <a href={linkedin} target="_blank" rel="noopener noreferrer" className="text-violet hover:underline">
                  LinkedIn
                </a>
              )}
              {portfolio && (
                <a href={portfolio} target="_blank" rel="noopener noreferrer" className="text-violet hover:underline">
                  Portfolio
                </a>
              )}
            </div>
          )}
          <label className="flex flex-col gap-2">
            <span className="text-[15px] font-bold">Private notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notes !== a.notes && saveReview(a, { notes })}
              placeholder="Only your team sees this"
              className="input min-h-24"
            />
          </label>
          {a.scorecard && (
            <div className="rounded-2xl border border-line p-4 text-sm">
              <div className="mb-2 font-bold">Interview scorecard</div>
              {Object.entries({ "Technical skills": a.scorecard.technical, Communication: a.scorecard.communication, "Culture add": a.scorecard.cultureAdd }).map(([k, v]) => (
                <div key={k} className="flex justify-between py-0.5">
                  <span>{k}</span>
                  <span className="font-semibold text-violet">{v}/5</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-[#eef0f5] pt-5">
        <h3 className="mb-3 text-[15px] font-bold">Progress the candidate sees</h3>
        <ProgressTimeline steps={pipelineProgress(a).steps} />
      </div>

      {dialog === "schedule" && (
        <ScheduleInterviewModal open onClose={close} application={a} onSubmit={async (v) => void ((await actions.schedule(a, v)) && close())} />
      )}
      {dialog === "offer" && <OfferModal open onClose={close} application={a} job={job} onSubmit={async (v) => void ((await actions.offer(a, v)) && close())} />}
      <ConfirmModal
        open={dialog === "reject"}
        onClose={close}
        title={`Reject ${a.candidate.name}?`}
        body="They’ll be marked “Not selected” and receive a kind rejection email."
        confirmLabel="Reject & send email"
        danger
        onConfirm={async () => {
          await actions.reject([a]);
          close();
        }}
      />
      <ConfirmModal
        open={dialog === "delete"}
        onClose={close}
        title="Delete this application?"
        body="This permanently removes the application and CV. The candidate won’t be notified."
        confirmLabel="Delete permanently"
        danger
        onConfirm={async () => {
          await actions.remove([a]);
          close();
        }}
      />
    </motion.section>
  );
}
