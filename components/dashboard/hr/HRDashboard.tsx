"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/Spinner";
import PageHeader from "../PageHeader";
import StatCard from "../StatCard";
import { Ring, Sparkline, dailyCounts } from "../charts";
import { getCompanyApplications, getCompanyJobs } from "@/lib/supabase-actions";
import { useAsync, useNow } from "@/lib/use-async";
import { firstName, formatDate, formatTime, timeAgo, toDate } from "@/lib/format";
import { STATUS } from "@/lib/constants";
import type { Application, Job, UserProfile } from "@/lib/types";

const ADVANCED = new Set(["shortlisted", "interview", "offer", "hired"]);

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function HRDashboard({ profile }: { profile: UserProfile }) {
  const { data, error, loading } = useAsync(
    () => Promise.all([getCompanyJobs(profile.companyId!), getCompanyApplications(profile.companyId!)]),
    [profile.companyId],
  );

  const now = useNow();

  if (loading) return <PageLoader label="Loading your workspace…" />;
  if (error) return <Alert>{error}</Alert>;
  const [jobs, applications] = data ?? [[], []];

  const weekAgo = now - 7 * 86400000;
  const newThisWeek = applications.filter((a) => (toDate(a.createdAt)?.getTime() ?? 0) > weekAgo).length;
  const shortlisted = applications.filter((a) => ADVANCED.has(a.status)).length;
  const offers = applications.filter((a) => a.status === "offer" || a.status === "hired");
  const hired = applications.filter((a) => a.status === "hired").length;
  const upcoming = applications
    .filter((a) => a.status === "interview" && a.interview && (toDate(a.interview.scheduledAt)?.getTime() ?? 0) > now - 2 * 3600000)
    .sort((a, b) => (toDate(a.interview!.scheduledAt)?.getTime() ?? 0) - (toDate(b.interview!.scheduledAt)?.getTime() ?? 0));

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName(profile.name)}`}
        subtitle={`You have ${newThisWeek} new applicant${newThisWeek === 1 ? "" : "s"} this week and ${upcoming.length} upcoming interview${upcoming.length === 1 ? "" : "s"}.`}
        actions={
          <Button href="/dashboard/jobs/new">
            <Plus className="size-4" strokeWidth={2.6} /> Post a new job
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open jobs" value={jobs.filter((j) => j.status === "open").length} note={`${jobs.length} total postings`} />
        <StatCard label="Total applicants" value={applications.length} note={`+${newThisWeek} this week`} noteTone="success">
          <Sparkline values={dailyCounts(applications.map((a) => toDate(a.createdAt)))} />
        </StatCard>
        <StatCard
          label="Shortlisted"
          value={shortlisted}
          note="across all roles"
          side={<Ring percent={applications.length ? (shortlisted / applications.length) * 100 : 0} />}
        />
        <StatCard label="Offers out" value={offers.length} note={`${hired} accepted`} highlight />
      </div>

      <div className="flex flex-wrap items-start gap-5">
        <JobsTable jobs={jobs} applications={applications} />
        <div className="flex flex-[1_1_300px] flex-col gap-5">
          <UpcomingInterviews items={upcoming} />
          <RecentActivity applications={applications} />
        </div>
      </div>
    </>
  );
}

function JobsTable({ jobs, applications }: { jobs: Job[]; applications: Application[] }) {
  return (
    <section className="card min-w-0 flex-[999_1_520px] overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <h2 className="text-xl font-bold">Your job postings</h2>
      </div>
      {jobs.length === 0 ? (
        <EmptyState title="No jobs posted yet" description="Post your first role and applicants will appear here." actionHref="/dashboard/jobs/new" actionLabel="Post a job" />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold tracking-[0.06em] text-subtle uppercase">
                  <th className="border-b border-[#eef0f5] px-4 py-3">Role</th>
                  <th className="border-b border-[#eef0f5] px-4 py-3">Applicants</th>
                  <th className="border-b border-[#eef0f5] px-4 py-3">Pipeline</th>
                  <th className="border-b border-[#eef0f5] px-4 py-3">Status</th>
                  <th className="border-b border-[#eef0f5] px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const apps = applications.filter((a) => a.jobId === job.id);
                  const pct = (s: string[]) => (apps.length ? (apps.filter((a) => s.includes(a.status)).length / apps.length) * 100 : 0);
                  return (
                    <tr key={job.id} className="hover:bg-[#fafafd]">
                      <td className="border-b border-[#eef0f5] px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold">{job.title}</div>
                        <div className="text-xs text-subtle">
                          {job.workMode} · {job.employmentType}
                        </div>
                      </td>
                      <td className="border-b border-[#eef0f5] px-4 py-3.5 font-semibold">{apps.length}</td>
                      <td className="border-b border-[#eef0f5] px-4 py-3.5">
                        <div className="flex h-2 w-[140px] overflow-hidden rounded-full bg-[#eef0f5]">
                          <span className="block h-full bg-[#c9c2ff]" style={{ width: `${pct(["applied", "reviewed"])}%` }} />
                          <span className="block h-full bg-violet" style={{ width: `${pct(["shortlisted"])}%` }} />
                          <span className="block h-full bg-[#1f1a66]" style={{ width: `${pct(["interview", "offer", "hired"])}%` }} />
                        </div>
                      </td>
                      <td className="border-b border-[#eef0f5] px-4 py-3.5">
                        <Badge tone={job.status === "open" ? "success" : "neutral"}>{job.status === "open" ? "Open" : job.status === "draft" ? "Draft" : "Closed"}</Badge>
                      </td>
                      <td className="border-b border-[#eef0f5] px-4 py-3.5 whitespace-nowrap">
                        <Link href={`/dashboard/jobs/${job.id}/applicants`} className="text-[13px] font-semibold text-violet hover:underline">
                          Review →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-4 px-5 py-3.5 text-xs text-muted">
            <Legend color="bg-[#c9c2ff]" label="New / reviewed" />
            <Legend color="bg-violet" label="Shortlisted" />
            <Legend color="bg-[#1f1a66]" label="Interview & beyond" />
          </div>
        </>
      )}
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2.5 rounded-[3px] ${color}`} />
      {label}
    </span>
  );
}

function UpcomingInterviews({ items }: { items: Application[] }) {
  return (
    <section className="card p-5">
      <h2 className="mb-3.5 text-xl font-bold">Upcoming interviews</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted">No interviews scheduled. Shortlist candidates to invite them.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.slice(0, 5).map((a, i) => {
            const when = toDate(a.interview!.scheduledAt);
            return (
              <li key={a.id} className="flex items-center gap-3">
                <div className={`w-[52px] rounded-xl py-1.5 text-center ${i === 0 ? "bg-violet-soft" : "bg-[#f0f1f6]"}`}>
                  <div className={`text-[11px] font-bold ${i === 0 ? "text-violet-dark" : "text-muted"}`}>{formatDate(when, { weekday: "short" }).toUpperCase()}</div>
                  <div className="font-display text-xl font-extrabold">{when?.getDate()}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{a.candidate.name}</div>
                  <div className="truncate text-xs text-muted">
                    {a.jobTitle} · {formatTime(when)}
                  </div>
                </div>
                <Button href={`/interview/${a.id}`} size="sm" variant={i === 0 ? "primary" : "secondary"}>
                  Join
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const DOT: Record<string, string> = { success: "bg-success", violet: "bg-violet", warning: "bg-[#b25e09]", danger: "bg-danger", neutral: "bg-subtle" };

function RecentActivity({ applications }: { applications: Application[] }) {
  const events = applications
    .flatMap((a) => a.history.map((h) => ({ app: a, status: h.status, at: toDate(h.at) })))
    .sort((x, y) => (y.at?.getTime() ?? 0) - (x.at?.getTime() ?? 0))
    .slice(0, 6);

  return (
    <section className="card p-5">
      <h2 className="mb-3.5 text-xl font-bold">Recent activity</h2>
      {events.length === 0 ? (
        <p className="text-sm text-muted">Activity on your applications will show up here.</p>
      ) : (
        <ul className="flex flex-col gap-3.5 text-sm text-body">
          {events.map((e, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <span className={`size-2 shrink-0 rounded-full ${DOT[STATUS[e.status].tone] ?? "bg-subtle"}`} />
              <Avatar src={e.app.candidate.photoURL} name={e.app.candidate.name} size={28} />
              <span className="min-w-0 flex-1">
                <b>{e.app.candidate.name}</b> · {STATUS[e.status].label.toLowerCase()} for {e.app.jobTitle}
                <span className="text-subtle"> · {timeAgo(e.at)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
