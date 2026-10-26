"use client";

import Link from "next/link";
import Badge, { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { CompanyMark, companyTone } from "@/components/ui/Avatar";
import { Alert } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/Spinner";
import { ProgressBar } from "@/components/applications/ProgressTimeline";
import StatCard from "../StatCard";
import OfferCard from "./OfferCard";
import { subscribeToCandidateApplications } from "@/lib/supabase-actions";
import { useSubscription } from "@/lib/use-async";
import { pipelineProgress } from "@/lib/pipeline";
import { firstName, formatDate, formatDateTime, toDate } from "@/lib/format";
import { CANDIDATE_STATUS, CLOSED_STATUSES } from "@/lib/constants";
import type { Application, UserProfile } from "@/lib/types";

export default function CandidateDashboard({ profile }: { profile: UserProfile }) {
  const { data, loading, error } = useSubscription<Application[]>((onData, onError) => subscribeToCandidateApplications(profile.id, onData, onError), [profile.id]);

  if (loading) return <PageLoader label="Loading your applications…" />;
  if (error) return <Alert>{error}</Alert>;
  const apps = data ?? [];

  const nextInterview = apps
    .filter((a) => a.status === "interview" && a.interview)
    .sort((a, b) => (toDate(a.interview!.scheduledAt)?.getTime() ?? 0) - (toDate(b.interview!.scheduledAt)?.getTime() ?? 0))[0];
  const offers = apps.filter((a) => a.status === "offer");
  const active = apps.filter((a) => !CLOSED_STATUSES.includes(a.status));

  return (
    <>
      <h1 className="text-[clamp(28px,3.6vw,38px)] font-extrabold">
        {nextInterview ? `Hi ${firstName(profile.name)}, you have an interview coming up` : `Hi ${firstName(profile.name)}, here’s where things stand`}
      </h1>
      <p className="mt-1.5 mb-7 text-muted">Every update from hiring teams shows up here the moment it happens.</p>

      <div className="mb-6 flex flex-wrap items-stretch gap-5">
        {nextInterview ? (
          <section className="relative flex-[2_1_460px] overflow-hidden rounded-3xl bg-ink p-7 text-white">
            <div className="pointer-events-none absolute -top-28 -right-20 size-80 rounded-full bg-violet opacity-60 blur-[90px]" />
            <div className="relative">
              <Badge tone="glow" pulse>
                Upcoming interview
              </Badge>
              <h2 className="mt-3.5 mb-1.5 text-3xl font-bold">
                {nextInterview.jobTitle} · {nextInterview.companyName}
              </h2>
              <p className="mb-5.5 text-[#b8bdcf]">
                {formatDateTime(nextInterview.interview!.scheduledAt)} · {nextInterview.interview!.durationMins} minutes
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <Button href={`/interview/${nextInterview.id}`} variant="lime">
                  Join interview room
                </Button>
                <Button href={`/dashboard/applications/${nextInterview.id}`} variant="glass">
                  View details
                </Button>
              </div>
            </div>
          </section>
        ) : (
          <section className="flex flex-[2_1_460px] flex-col justify-center rounded-3xl bg-ink p-7 text-white">
            <h2 className="text-2xl font-bold">Find your next role</h2>
            <p className="mt-1.5 mb-5 text-[#b8bdcf]">New jobs are posted every day — apply in a few minutes with your CV.</p>
            <Button href="/jobs" variant="lime" className="self-start">
              Browse jobs
            </Button>
          </section>
        )}
        <div className="grid flex-[1_1_260px] grid-cols-2 gap-3">
          <MiniStat label="Applied" value={apps.length} />
          <MiniStat label="Active" value={active.length} />
          <MiniStat label="Interviews" value={apps.filter((a) => a.status === "interview").length} color="text-violet" />
          <MiniStat label="Offers" value={offers.length + apps.filter((a) => a.status === "hired").length} color="text-success-ink" />
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-5">
        <section className="card min-w-0 flex-[999_1_560px] overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-2.5">
            <h2 className="text-xl font-bold">My applications</h2>
            <Link href="/jobs" className="text-sm font-semibold text-violet hover:underline">
              Find more jobs
            </Link>
          </div>
          {apps.length === 0 ? (
            <EmptyState title="No applications yet" description="When you apply to a job, you’ll be able to follow every step here." actionHref="/jobs" actionLabel="Browse jobs" />
          ) : (
            <ul>
              {apps.map((a) => (
                <ApplicationRow key={a.id} application={a} />
              ))}
            </ul>
          )}
        </section>
        {offers.length > 0 && (
          <div className="flex flex-[1_1_300px] flex-col gap-5">
            {offers.map((a) => (
              <OfferCard key={a.id} application={a} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return <StatCard label={label} value={<span className={color}>{value}</span>} />;
}

function ApplicationRow({ application: a }: { application: Application }) {
  const { steps, current, closed, total } = pipelineProgress(a);
  return (
    <li>
      <Link href={`/dashboard/applications/${a.id}`} className="flex flex-wrap items-center gap-4 border-b border-[#eef0f5] px-5 py-4.5 transition hover:bg-[#fafafd]">
        <CompanyMark name={a.companyName} tone={companyTone(a.companyName)} size={48} />
        <div className="min-w-0 flex-[1_1_200px]">
          <div className="font-bold">{a.jobTitle}</div>
          <div className="text-[13px] text-muted">
            {a.companyName} · Applied {formatDate(a.createdAt)}
          </div>
        </div>
        <div className="min-w-[160px] flex-[1_1_200px]">
          <ProgressBar steps={steps} />
          <div className="mt-1.5 text-xs text-muted">{closed ? "Closed" : `Step ${current + 1} of ${total} · ${CANDIDATE_STATUS[a.status].label}`}</div>
        </div>
        <StatusBadge status={a.status} audience="candidate" />
      </Link>
    </li>
  );
}
