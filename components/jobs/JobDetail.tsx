"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Bookmark } from "lucide-react";
import { notFound } from "next/navigation";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Reveal from "@/components/ui/Reveal";
import { CompanyMark, companyTone } from "@/components/ui/Avatar";
import { PageLoader } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Field";
import NotConnected from "@/components/auth/NotConnected";
import { useAuth } from "@/components/auth/AuthProvider";
import { getCompany, getJob, getMyApplicationForJob } from "@/lib/supabase-actions";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAsync } from "@/lib/use-async";
import { formatDate, formatSalary, timeAgo } from "@/lib/format";
import { scenes } from "@/images";
import type { Job, UserProfile } from "@/lib/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-2xl font-bold">{title}</h2>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 leading-relaxed text-body marker:text-violet">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function JobDetail({ id }: { id: string }) {
  const { profile } = useAuth();
  const { data, error, loading } = useAsync(async () => {
    const job = await getJob(id);
    if (!job) return null;
    const company = await getCompany(job.companyId).catch(() => null);
    return { job, company };
  }, [id]);

  if (!isSupabaseConfigured) return <NotConnected />;
  if (loading) return <PageLoader label="Loading job…" />;
  if (error) return <div className="container-page py-10"><Alert>{error}</Alert></div>;
  if (!data) notFound();

  const { job, company } = data;
  const meta = [
    ["Salary", formatSalary(job)],
    ["Type", job.employmentType],
    ["Work mode", job.workMode],
    ["Experience", job.experienceLevel],
    ["Applicants", String(job.applicantCount ?? 0)],
    ["Closes", job.deadline ? formatDate(job.deadline) : "Open until filled"],
  ];

  return (
    <div className="pb-20">
      <div className="container-page pt-6">
        <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet hover:underline">
          <ArrowLeft className="size-4" /> All jobs
        </Link>
      </div>

      <Reveal className="container-page pt-5">
        <div className="card overflow-hidden rounded-[28px]">
          <div className="relative h-[200px] sm:h-[240px]">
            <Image src={scenes.teamOffice} alt={`The ${job.companyName} team`} fill sizes="1200px" className="object-cover" placeholder="blur" priority />
          </div>
          <div className="flex flex-wrap items-end justify-between gap-6 px-6 pb-8 sm:px-8">
            <div className="flex flex-wrap items-end gap-5">
              <CompanyMark name={job.companyName} logoUrl={company?.logoUrl} tone={companyTone(job.companyName)} size={96} className="-mt-12 border-[6px] border-white" />
              <div className="pt-4">
                <h1 className="text-[clamp(30px,4vw,44px)] font-extrabold">{job.title}</h1>
                <p className="mt-1.5 text-muted">
                  {job.companyName} · {job.location} · Posted {timeAgo(job.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Button variant="secondary" aria-label="Save job">
                <Bookmark className="size-[18px]" /> Save
              </Button>
              <ApplyAction job={job} profile={profile} />
            </div>
          </div>
        </div>
      </Reveal>

      <section className="container-page flex flex-wrap items-start gap-6 pt-6">
        <Reveal as="article" className="card flex min-w-0 flex-[999_1_560px] flex-col gap-8 p-6 sm:p-8">
          <Section title="About the role">
            <p className="leading-relaxed whitespace-pre-line text-body">{job.about}</p>
          </Section>
          {job.responsibilities?.length > 0 && (
            <Section title="Responsibilities">
              <BulletList items={job.responsibilities} />
            </Section>
          )}
          {job.requirements?.length > 0 && (
            <Section title="Requirements">
              <BulletList items={job.requirements} />
            </Section>
          )}
          {job.skills?.length > 0 && (
            <Section title="Skills">
              <div className="flex flex-wrap gap-2">
                {job.skills.map((s) => (
                  <Badge key={s} tone="violet">{s}</Badge>
                ))}
              </div>
            </Section>
          )}
          {job.benefits?.length > 0 && (
            <Section title="Benefits">
              <div className="flex flex-wrap gap-2">
                {job.benefits.map((b) => (
                  <Badge key={b}>{b}</Badge>
                ))}
              </div>
            </Section>
          )}
        </Reveal>

        <aside className="flex flex-[1_1_300px] flex-col gap-4 lg:sticky lg:top-24">
          <div className="card grid grid-cols-2 gap-4.5 p-6">
            {meta.map(([label, value]) => (
              <div key={label}>
                <div className="text-xs font-semibold tracking-[0.06em] text-subtle uppercase">{label}</div>
                <div className="font-semibold">{value}</div>
              </div>
            ))}
          </div>
          {job.status === "open" && (
            <div className="rounded-3xl bg-ink p-6 text-white">
              <div className="mb-2 font-display text-[22px] font-bold">Ready to apply?</div>
              <p className="mb-4.5 text-sm leading-relaxed text-[#b8bdcf]">It takes about 3 minutes. You’ll be able to track your application in real time.</p>
              <ApplyAction job={job} profile={profile} block />
            </div>
          )}
          <div className="card p-6">
            <div className="mb-2 font-bold">About {job.companyName}</div>
            <p className="text-sm leading-relaxed text-muted">{company?.description || "This company hasn’t added a description yet."}</p>
            {company?.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-violet hover:underline">
                Visit website
              </a>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}

// The main call to action changes with who is looking at the job.
function ApplyAction({ job, profile, block }: { job: Job; profile: UserProfile | null; block?: boolean }) {
  const { data: existing } = useAsync(async () => (profile?.role === "candidate" ? getMyApplicationForJob(job.id, profile.id) : null), [job.id, profile?.id]);
  const cls = block ? "w-full" : undefined;

  if (profile?.role === "hr") {
    return profile.companyId === job.companyId ? (
      <Button href={`/dashboard/jobs/${job.id}/applicants`} className={cls} variant={block ? "lime" : "primary"}>
        Manage applicants
      </Button>
    ) : null;
  }
  if (existing) {
    return (
      <Button href={`/dashboard/applications/${existing.id}`} className={cls} variant={block ? "lime" : "primary"}>
        View your application
      </Button>
    );
  }
  if (job.status !== "open") return <Badge>This role is closed</Badge>;
  return (
    <Button href={`/jobs/${job.id}/apply`} className={cls} variant={block ? "lime" : "primary"}>
      Apply now
    </Button>
  );
}
