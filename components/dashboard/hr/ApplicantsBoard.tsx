"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Search } from "lucide-react";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { useProfile } from "@/components/auth/RequireAuth";
import PageHeader from "../PageHeader";
import ApplicantDetail from "./ApplicantDetail";
import { ConfirmModal } from "./ActionModals";
import { useApplicantActions } from "./useApplicantActions";
import { getJob, markReviewed, setJobStatus, subscribeToJobApplications } from "@/lib/firebase-actions";
import { useAsync, useSubscription } from "@/lib/use-async";
import { APPLICANT_TABS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Application, ApplicationStatus } from "@/lib/types";

type Tab = ApplicationStatus | "all";

export default function ApplicantsBoard({ jobId }: { jobId: string }) {
  const profile = useProfile();
  const { toast, showToast } = useToast();
  const actions = useApplicantActions(profile.name, showToast);
  const { data: job, loading: jobLoading, error: jobError, setData: setJob } = useAsync(() => getJob(jobId), [jobId]);
  const { data: applications, loading, error } = useSubscription<Application[]>((onData, onError) => subscribeToJobApplications(jobId, onData, onError), [jobId]);

  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<"reject" | "delete" | null>(null);

  const all = useMemo(() => applications ?? [], [applications]);
  const visible = useMemo(
    () =>
      all.filter(
        (a) =>
          (tab === "all" ? a.status !== "archived" : a.status === tab) &&
          (!search || `${a.candidate.name} ${a.candidate.email} ${a.candidate.location}`.toLowerCase().includes(search.toLowerCase())),
      ),
    [all, tab, search],
  );
  const selected = all.find((a) => a.id === selectedId) ?? visible[0] ?? null;
  const bulk = all.filter((a) => checked.has(a.id));

  // Opening an application for the first time marks it reviewed (the candidate sees this).
  useEffect(() => {
    if (selected?.status === "applied") markReviewed(selected).catch(() => {});
  }, [selected]);

  if (jobLoading || (loading && !applications)) return <PageLoader label="Loading applicants…" />;
  if (jobError || error) return <Alert>{jobError || error}</Alert>;
  if (!job || job.companyId !== profile.companyId) return <EmptyState title="Job not found" actionHref="/dashboard" actionLabel="Back to dashboard" />;

  const count = (id: Tab) => (id === "all" ? all.filter((a) => a.status !== "archived").length : all.filter((a) => a.status === id).length);
  const toggleChecked = (id: string) =>
    setChecked((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  async function toggleJobStatus() {
    const next = job!.status === "open" ? "closed" : "open";
    await setJobStatus(job!.id, next);
    setJob({ ...job!, status: next });
    showToast(next === "open" ? "Job reopened" : "Job closed to new applicants");
  }

  return (
    <>
      <PageHeader
        backHref="/dashboard"
        backLabel="Back to dashboard"
        title={job.title}
        subtitle={`${all.length} applicant${all.length === 1 ? "" : "s"} · ${job.location} · ${job.status === "open" ? "Open" : "Closed"}`}
        actions={
          <>
            <Button href={`/jobs/${job.id}`} variant="secondary" shape="rounded">
              View posting
            </Button>
            <Button href={`/dashboard/jobs/${job.id}/edit`} variant="secondary" shape="rounded">
              Edit job
            </Button>
            <Button variant="secondary" shape="rounded" onClick={toggleJobStatus}>
              {job.status === "open" ? "Close job" : "Reopen job"}
            </Button>
          </>
        }
      />

      <nav aria-label="Pipeline stages" className="-mt-2 mb-5 flex gap-1 overflow-x-auto border-b border-line">
        {APPLICANT_TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={active}
              className={clsx("flex min-h-12 items-center gap-2 border-b-[3px] px-4 text-sm font-semibold whitespace-nowrap transition", active ? "border-violet text-ink" : "border-transparent text-muted hover:text-ink")}
            >
              {t.label}
              <span className={clsx("rounded-full px-2 py-0.5 text-xs", active ? "bg-violet text-white" : "bg-[#f0f1f6] text-body")}>{count(t.id)}</span>
            </button>
          );
        })}
      </nav>

      {all.length === 0 ? (
        <div className="card">
          <EmptyState title="No applicants yet" description="Share the job link — new applications appear here instantly." actionHref={`/jobs/${job.id}`} actionLabel="View posting" />
        </div>
      ) : (
        <div className="flex flex-wrap items-start gap-5">
          <section className="card min-w-0 flex-[1_1_360px] overflow-hidden">
            <div className="flex items-center gap-2.5 border-b border-[#eef0f5] p-3.5">
              <label className="flex min-h-10 flex-1 items-center gap-2 rounded-[10px] border border-line-strong px-3">
                <Search className="size-4 text-muted" />
                <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search applicants" aria-label="Search applicants" className="w-full text-sm outline-none" />
              </label>
            </div>
            {bulk.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-b border-[#eef0f5] bg-[#f7f5ff] px-4 py-2.5 text-[13px]">
                <span className="font-semibold text-violet-dark">{bulk.length} selected</span>
                <span className="flex-1" />
                <Button size="sm" variant="secondary" shape="rounded" onClick={async () => (await actions.shortlist(bulk)) && setChecked(new Set())}>
                  Shortlist
                </Button>
                <Button size="sm" variant="secondary" shape="rounded" onClick={() => setConfirm("reject")}>
                  Send rejection
                </Button>
                <Button size="sm" variant="danger" shape="rounded" onClick={() => setConfirm("delete")}>
                  Delete
                </Button>
              </div>
            )}
            {visible.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted">No applicants in this stage.</p>
            ) : (
              <ul>
                {visible.map((a) => {
                  const active = a.id === selected?.id;
                  return (
                    <li key={a.id} className={clsx("flex items-center gap-3.5 border-b border-[#eef0f5] px-4 py-3 transition", active ? "bg-[#f7f5ff] shadow-[inset_3px_0_0_var(--color-violet)]" : "hover:bg-[#fafafd]")}>
                      <input type="checkbox" aria-label={`Select ${a.candidate.name}`} checked={checked.has(a.id)} onChange={() => toggleChecked(a.id)} className="size-[18px] accent-violet" />
                      <button type="button" onClick={() => setSelectedId(a.id)} className="flex min-h-11 min-w-0 flex-1 items-center gap-3.5 text-left">
                        <Avatar src={a.candidate.photoURL} name={a.candidate.name} size={40} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{a.candidate.name}</span>
                          <span className="block truncate text-xs text-subtle">
                            {a.candidate.location} · {formatDate(a.createdAt)}
                          </span>
                        </span>
                        <StatusBadge status={a.status} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {selected && <ApplicantDetail key={selected.id} application={selected} job={job} actions={actions} />}
        </div>
      )}

      <ConfirmModal
        open={confirm === "reject"}
        onClose={() => setConfirm(null)}
        title={`Send rejection to ${bulk.length} applicant${bulk.length === 1 ? "" : "s"}?`}
        body="They’ll be marked “Not selected” and receive a kind rejection email."
        confirmLabel="Send rejection"
        danger
        onConfirm={async () => {
          if (await actions.reject(bulk)) setChecked(new Set());
          setConfirm(null);
        }}
      />
      <ConfirmModal
        open={confirm === "delete"}
        onClose={() => setConfirm(null)}
        title={`Delete ${bulk.length} application${bulk.length === 1 ? "" : "s"}?`}
        body="This permanently removes the applications and their CVs. Candidates won’t be notified."
        confirmLabel="Delete permanently"
        danger
        onConfirm={async () => {
          if (await actions.remove(bulk)) setChecked(new Set());
          setConfirm(null);
        }}
      />
      {toast}
    </>
  );
}
