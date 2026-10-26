"use client";

import { useSearchParams } from "next/navigation";
import { CalendarClock, FileText } from "lucide-react";
import Button from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { CompanyMark, companyTone } from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/Spinner";
import ProgressTimeline, { ProgressBar } from "@/components/applications/ProgressTimeline";
import { useCvUrl } from "@/components/applications/useCvUrl";
import { useProfile } from "@/components/auth/RequireAuth";
import PageHeader from "../PageHeader";
import OfferCard from "./OfferCard";
import { subscribeToApplication } from "@/lib/supabase-actions";
import { useSubscription } from "@/lib/use-async";
import { pipelineProgress } from "@/lib/pipeline";
import { formatDate, formatDateTime, toDate } from "@/lib/format";
import type { Application } from "@/lib/types";

// The room opens 10 minutes before the scheduled start.
function roomIsOpen(a: Application) {
  const start = toDate(a.interview?.scheduledAt);
  return !!start && Date.now() >= start.getTime() - 10 * 60000;
}

export default function ApplicationTracker({ id }: { id: string }) {
  const profile = useProfile();
  const justApplied = useSearchParams().get("applied") === "1";
  const { data: a, loading, error } = useSubscription<Application | null>((onData, onError) => subscribeToApplication(id, onData, onError), [id]);
  const cvUrl = useCvUrl(a?.cvPath);

  if (loading) return <PageLoader />;
  if (error) return <Alert>{error}</Alert>;
  if (!a || a.candidateId !== profile.id) return <EmptyState title="Application not found" actionHref="/dashboard" actionLabel="Back to dashboard" />;

  const { steps, current, total, closed } = pipelineProgress(a);

  return (
    <>
      <PageHeader backHref="/dashboard" backLabel="Back to applications" title={a.jobTitle} subtitle={`${a.companyName} · ${a.jobLocation}`} actions={<StatusBadge status={a.status} audience="candidate" />} />

      {justApplied && (
        <div className="mb-5">
          <Alert tone="success">Application sent! We’ve emailed you a confirmation — this page updates live as the hiring team reviews it.</Alert>
        </div>
      )}

      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-5">
          <section className="rounded-3xl bg-ink p-6 text-white">
            <div className="flex items-center gap-3">
              <CompanyMark name={a.companyName} tone={companyTone(a.companyName) === "dark" ? "lime" : companyTone(a.companyName)} size={48} />
              <div>
                <div className="font-bold">{a.jobTitle}</div>
                <div className="text-[13px] text-[#b8bdcf]">
                  {a.companyName} · {a.workMode}
                </div>
              </div>
            </div>
            <div className="mt-5 [&_span]:h-2">
              <ProgressBar steps={steps} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-[#b8bdcf]">
              <span>{closed ? "Application closed" : `Step ${current + 1} of ${total}`}</span>
              <span>Applied {formatDate(a.createdAt)}</span>
            </div>
          </section>

          {a.status === "interview" && a.interview && (
            <section className="card p-6">
              <div className="text-xs font-bold tracking-[0.08em] text-violet-dark uppercase">Up next</div>
              <h2 className="mt-1.5 text-2xl font-bold">Video interview</h2>
              <p className="mt-1 flex items-center gap-2 text-muted">
                <CalendarClock className="size-4" /> {formatDateTime(a.interview.scheduledAt)} · {a.interview.durationMins} min
              </p>
              {a.interview.message && <p className="mt-3 rounded-xl bg-mist p-3 text-sm whitespace-pre-line text-body">{a.interview.message}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button href={`/interview/${a.id}`}>Join interview room</Button>
                {!roomIsOpen(a) && <span className="text-[13px] text-muted">The room opens 10 minutes before — you can test your camera now.</span>}
              </div>
            </section>
          )}

          {a.status === "offer" && <OfferCard application={a} />}
          {a.status === "hired" && <Alert tone="success">You accepted the offer — congratulations! The team will be in touch about next steps.</Alert>}
          {a.status === "rejected" && (
            <section className="card p-6">
              <h2 className="text-xl font-bold">Thank you for applying</h2>
              <p className="mt-2 text-muted">The team decided to move forward with other candidates this time. Keep going — there are more roles waiting.</p>
              <Button href="/jobs" className="mt-4">
                Browse more jobs
              </Button>
            </section>
          )}

          <section className="card p-6">
            <h2 className="mb-4 text-xl font-bold">Progress</h2>
            <ProgressTimeline steps={steps} />
          </section>
        </div>

        <aside className="card flex flex-[1_1_280px] flex-col gap-3 p-5.5 text-sm">
          <h2 className="text-base font-bold">What you sent</h2>
          <a href={cvUrl ?? undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!cvUrl} className="flex items-center gap-3 rounded-xl border border-line p-3 font-semibold hover:border-violet">
            <FileText className="size-5 text-violet" />
            <span className="truncate">{a.cvName}</span>
          </a>
          {a.coverLetter && <p className="line-clamp-6 leading-relaxed whitespace-pre-line text-body">{a.coverLetter}</p>}
          <Button href={`/jobs/${a.jobId}`} variant="secondary" size="sm" className="mt-1 self-start">
            View job posting
          </Button>
        </aside>
      </div>
    </>
  );
}
