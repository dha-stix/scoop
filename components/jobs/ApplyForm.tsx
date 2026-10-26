"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Field, { Alert, FormSection } from "@/components/ui/Field";
import { CompanyMark, companyTone } from "@/components/ui/Avatar";
import { PageLoader } from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { useProfile } from "@/components/auth/RequireAuth";
import FileDrop from "./FileDrop";
import { applyToJob, friendlyError, getApplication, getJob, getMyApplicationForJob } from "@/lib/supabase-actions";
import { sendApplicationReceivedEmail } from "@/lib/email";
import { useAsync } from "@/lib/use-async";
import { YEARS_OF_EXPERIENCE } from "@/lib/constants";
import { formatSalary } from "@/lib/format";
import type { Job, UserProfile } from "@/lib/types";

export default function ApplyForm({ jobId }: { jobId: string }) {
  const profile = useProfile();
  const { data, loading, error } = useAsync(async () => {
    const [job, existing] = await Promise.all([getJob(jobId), getMyApplicationForJob(jobId, profile.id)]);
    return { job, existing };
  }, [jobId, profile.id]);

  if (loading) return <PageLoader />;
  if (error) return <div className="container-page py-10"><Alert>{error}</Alert></div>;
  if (!data?.job) return <EmptyState title="Job not found" description="It may have been removed." actionHref="/jobs" actionLabel="Browse jobs" />;
  if (data.existing) {
    return (
      <EmptyState title="You’ve already applied" description="Follow its progress from your dashboard." actionHref={`/dashboard/applications/${data.existing.id}`} actionLabel="View application" />
    );
  }
  if (data.job.status !== "open") return <EmptyState title="This role is closed" description="Applications are no longer being accepted." actionHref="/jobs" actionLabel="Browse open jobs" />;
  return <Form job={data.job} profile={profile} />;
}

function Form({ job, profile }: { job: Job; profile: UserProfile }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: profile.name,
    email: profile.email,
    phone: profile.phone ?? "",
    location: profile.location ?? "",
    linkedin: "",
    portfolio: "",
    experience: YEARS_OF_EXPERIENCE[1],
    startDate: "",
    coverLetter: "",
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [cv, setCv] = useState<File | null>(null);
  const [cvError, setCvError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!cv) {
      setCvError("Please attach your CV.");
      return document.getElementById("cv")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setSubmitting(true);
    setError("");
    try {
      const id = await applyToJob({
        job,
        user: profile,
        cvFile: cv,
        form: { ...form, answers: job.questions.map((q) => ({ prompt: q.prompt, answer: answers[q.id] ?? "" })) },
      });
      const application = await getApplication(id);
      if (application) await sendApplicationReceivedEmail(application).catch(() => {});
      router.push(`/dashboard/applications/${id}?applied=1`);
    } catch (err) {
      setError(friendlyError(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-8 pb-20 sm:px-6">
      <Link href={`/jobs/${job.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet hover:underline">
        <ArrowLeft className="size-4" /> Back to job
      </Link>
      <h1 className="mt-3.5 mb-1.5 text-[clamp(32px,4vw,44px)] font-extrabold">Apply for {job.title}</h1>
      <p className="mb-7 text-muted">
        {job.companyName} · {job.location}
      </p>

      <div className="flex flex-wrap items-start gap-6">
        <form onSubmit={onSubmit} className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
          <FormSection title="Personal information" description="Pre-filled from your profile — edit anything.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required autoComplete="name" value={form.name} onChange={set("name")} />
              <Field label="Email" type="email" required autoComplete="email" value={form.email} onChange={set("email")} />
              <Field label="Phone" type="tel" required autoComplete="tel" value={form.phone} onChange={set("phone")} placeholder="+234 800 000 0000" />
              <Field label="Location" required value={form.location} onChange={set("location")} placeholder="City, Country" />
              <Field label="LinkedIn" optional type="url" value={form.linkedin} onChange={set("linkedin")} placeholder="https://linkedin.com/in/…" />
              <Field label="Portfolio / GitHub" optional={!job.askPortfolio} required={job.askPortfolio} type="url" value={form.portfolio} onChange={set("portfolio")} placeholder="https://" />
              <Field label="Years of experience" as="select" options={YEARS_OF_EXPERIENCE} value={form.experience} onChange={set("experience")} />
              <Field label="Earliest start date" optional type="date" value={form.startDate} onChange={set("startDate")} />
            </div>
          </FormSection>

          <FormSection title="CV / Résumé">
            <div id="cv">
              <FileDrop file={cv} onChange={(f) => (setCv(f), setCvError(""))} error={cvError} />
            </div>
          </FormSection>

          <FormSection title={job.requireCoverLetter ? "Cover letter" : "Cover letter (optional)"}>
            <Field label={<span className="sr-only">Cover letter</span>} hint={`${form.coverLetter.length} / 2000`}>
              <textarea
                className="input min-h-36"
                required={job.requireCoverLetter}
                maxLength={2000}
                value={form.coverLetter}
                onChange={set("coverLetter")}
                placeholder="Tell the hiring team why you’re a great fit…"
              />
            </Field>
          </FormSection>

          {job.questions.length > 0 && (
            <FormSection title="Screening questions">
              <div className="flex flex-col gap-4">
                {job.questions.map((q) => (
                  <Field key={q.id} label={q.prompt} as="textarea" required rows={3} className="[&_textarea]:min-h-20" value={answers[q.id] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} />
                ))}
              </div>
            </FormSection>
          )}

          <Alert>{error}</Alert>
          <div className="flex justify-end">
            <Button type="submit" size="lg" loading={submitting}>
              {submitting ? "Submitting…" : "Submit application"}
            </Button>
          </div>
        </form>

        <aside className="flex flex-[1_1_280px] flex-col gap-4 lg:sticky lg:top-24">
          <div className="card p-5.5">
            <div className="flex items-center gap-3">
              <CompanyMark name={job.companyName} tone={companyTone(job.companyName)} size={48} />
              <div>
                <div className="font-bold">{job.title}</div>
                <div className="text-[13px] text-muted">{job.companyName}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 text-sm text-body">
              <span>{formatSalary(job)}</span>
              <span>
                {job.employmentType} · {job.workMode}
              </span>
            </div>
          </div>
          <div className="rounded-[20px] bg-lime-soft p-5 text-sm leading-relaxed text-[#2e3a10]">
            <b>What happens next?</b>
            <br />
            You’ll get an email confirmation, and you can follow every step from your dashboard.
          </div>
        </aside>
      </div>
    </div>
  );
}
