"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Field, { Alert, ChoiceGroup, FormSection } from "@/components/ui/Field";
import { CompanyMark, companyTone } from "@/components/ui/Avatar";
import PageHeader from "../PageHeader";
import { createJob, friendlyError, updateJob } from "@/lib/supabase-actions";
import { CURRENCIES, DEPARTMENTS, EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, WORK_MODES } from "@/lib/constants";
import { formatSalary, toLines } from "@/lib/format";
import type { Job, JobInput, JobStatus, ScreeningQuestion, UserProfile } from "@/lib/types";

const BLANK: JobInput = {
  title: "",
  department: DEPARTMENTS[0],
  location: "",
  workMode: WORK_MODES[0],
  employmentType: EMPLOYMENT_TYPES[0],
  experienceLevel: EXPERIENCE_LEVELS[1],
  currency: CURRENCIES[0],
  salaryMin: null,
  salaryMax: null,
  about: "",
  responsibilities: [],
  requirements: [],
  skills: [],
  benefits: [],
  requireCoverLetter: false,
  askPortfolio: false,
  questions: [],
  deadline: "",
  openings: 1,
};

// Keep only the editable fields when editing an existing job.
function pickInput(job: Job): JobInput {
  return Object.fromEntries(Object.keys(BLANK).map((k) => [k, job[k as keyof JobInput] ?? BLANK[k as keyof JobInput]])) as unknown as JobInput;
}

export default function JobForm({ profile, job }: { profile: UserProfile; job?: Job }) {
  const router = useRouter();
  const [data, setData] = useState<JobInput>(job ? pickInput(job) : BLANK);
  // Multi-line lists are edited as plain text, one item per line.
  const [lists, setLists] = useState({
    responsibilities: data.responsibilities.join("\n"),
    requirements: data.requirements.join("\n"),
    benefits: data.benefits.join(", "),
  });
  const [skillDraft, setSkillDraft] = useState("");
  const [saving, setSaving] = useState<JobStatus | null>(null);
  const [error, setError] = useState("");

  const set = <K extends keyof JobInput>(key: K, value: JobInput[K]) => setData((d) => ({ ...d, [key]: value }));
  const num = (v: string) => (v === "" ? null : Number(v));

  function addSkill(e?: KeyboardEvent) {
    if (e && e.key !== "Enter" && e.key !== ",") return;
    e?.preventDefault();
    const skill = skillDraft.trim().replace(/,$/, "");
    if (skill && !data.skills.includes(skill)) set("skills", [...data.skills, skill]);
    setSkillDraft("");
  }

  function updateQuestion(id: string, prompt: string) {
    set("questions", data.questions.map((q) => (q.id === id ? { ...q, prompt } : q)));
  }

  async function save(status: JobStatus, e?: FormEvent) {
    e?.preventDefault();
    if (data.salaryMin && data.salaryMax && data.salaryMin > data.salaryMax) return setError("Minimum salary can’t be higher than the maximum.");
    setSaving(status);
    setError("");
    const payload: JobInput = {
      ...data,
      responsibilities: toLines(lists.responsibilities),
      requirements: toLines(lists.requirements),
      benefits: lists.benefits.split(",").map((b) => b.trim()).filter(Boolean),
      questions: data.questions.filter((q) => q.prompt.trim()),
    };
    try {
      if (job) {
        await updateJob(job.id, { ...payload, status: status === "draft" && job.status !== "draft" ? job.status : status });
        router.push(`/dashboard/jobs/${job.id}/applicants`);
      } else {
        await createJob(profile, payload, status);
        router.push("/dashboard");
      }
    } catch (err) {
      setError(friendlyError(err));
      setSaving(null);
    }
  }

  return (
    <form onSubmit={(e) => save("open", e)}>
      <PageHeader
        title={job ? "Edit job" : "Post a new job"}
        backHref={job ? `/dashboard/jobs/${job.id}/applicants` : "/dashboard"}
        backLabel="Back to dashboard"
        actions={
          <>
            {(!job || job.status === "draft") && (
              <Button variant="secondary" loading={saving === "draft"} onClick={() => save("draft")}>
                Save draft
              </Button>
            )}
            <Button type="submit" loading={saving === "open"}>
              {job && job.status !== "draft" ? "Save changes" : "Publish job"}
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
          <FormSection title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Job title" required className="sm:col-span-2" value={data.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Frontend Engineer" />
              <Field label="Department" as="select" options={DEPARTMENTS} value={data.department} onChange={(e) => set("department", e.target.value)} />
              <Field label="Location" required value={data.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Lagos, NG or Remote" />
            </div>
            <div className="mt-5 flex flex-col gap-5">
              <ChoiceGroup label="Work mode" name="workMode" options={WORK_MODES} value={data.workMode} onChange={(v) => set("workMode", v)} />
              <ChoiceGroup label="Employment type" name="employmentType" options={EMPLOYMENT_TYPES} value={data.employmentType} onChange={(v) => set("employmentType", v)} />
            </div>
          </FormSection>

          <FormSection title="Compensation">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Currency" as="select" options={CURRENCIES} value={data.currency} onChange={(e) => set("currency", e.target.value)} />
              <Field label="Minimum" type="number" min={0} value={data.salaryMin ?? ""} onChange={(e) => set("salaryMin", num(e.target.value))} />
              <Field label="Maximum" type="number" min={0} value={data.salaryMax ?? ""} onChange={(e) => set("salaryMax", num(e.target.value))} />
              <Field label="Experience level" as="select" options={EXPERIENCE_LEVELS} value={data.experienceLevel} onChange={(e) => set("experienceLevel", e.target.value)} />
            </div>
          </FormSection>

          <FormSection title="Description">
            <div className="flex flex-col gap-4">
              <Field label="About the role" as="textarea" required value={data.about} onChange={(e) => set("about", e.target.value)} placeholder="What the team does and why this role matters…" />
              <Field label="Responsibilities" hint="One per line" as="textarea" value={lists.responsibilities} onChange={(e) => setLists((l) => ({ ...l, responsibilities: e.target.value }))} />
              <Field label="Requirements" hint="One per line" as="textarea" value={lists.requirements} onChange={(e) => setLists((l) => ({ ...l, requirements: e.target.value }))} />
              <Field label="Skills" hint="Press Enter to add">
                <div className="input flex min-h-12 flex-wrap items-center gap-2 py-2">
                  {data.skills.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 rounded-full bg-[#f0f1f6] py-1 pr-1.5 pl-2.5 text-[13px] font-medium">
                      {s}
                      <button type="button" aria-label={`Remove ${s}`} onClick={() => set("skills", data.skills.filter((x) => x !== s))} className="grid size-5 place-items-center rounded-full hover:bg-line">
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  <input value={skillDraft} onChange={(e) => setSkillDraft(e.target.value)} onKeyDown={addSkill} onBlur={() => addSkill()} placeholder="Add skill…" aria-label="Add skill" className="min-w-[120px] flex-1 font-normal outline-none" />
                </div>
              </Field>
              <Field label="Benefits" hint="Comma separated" value={lists.benefits} onChange={(e) => setLists((l) => ({ ...l, benefits: e.target.value }))} placeholder="Health insurance, Learning budget, Equity" />
            </div>
          </FormSection>

          <FormSection title="Application settings" description="Choose what candidates must provide.">
            <div className="flex flex-col gap-3.5 text-[15px]">
              <label className="flex items-center gap-3 text-subtle">
                <input type="checkbox" checked disabled className="size-[18px] accent-violet" /> CV / résumé (always required)
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={data.requireCoverLetter} onChange={(e) => set("requireCoverLetter", e.target.checked)} className="size-[18px] accent-violet" /> Require cover letter
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={data.askPortfolio} onChange={(e) => set("askPortfolio", e.target.checked)} className="size-[18px] accent-violet" /> Require portfolio link
              </label>
            </div>
            <div className="mt-5.5 border-t border-[#eef0f5] pt-5">
              <div className="mb-2.5 text-[13px] font-semibold text-[#2e3350]">Screening questions</div>
              <div className="flex flex-col gap-2">
                {data.questions.map((q: ScreeningQuestion, i) => (
                  <div key={q.id} className="flex gap-2">
                    <input className="input" aria-label={`Question ${i + 1}`} value={q.prompt} onChange={(e) => updateQuestion(q.id, e.target.value)} placeholder="e.g. What’s your notice period?" />
                    <button type="button" aria-label="Remove question" onClick={() => set("questions", data.questions.filter((x) => x.id !== q.id))} className="grid size-12 shrink-0 place-items-center rounded-xl border border-line-strong hover:border-danger hover:text-danger-ink">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => set("questions", [...data.questions, { id: crypto.randomUUID(), prompt: "" }])}
                  className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#c9c2ff] bg-[#f7f5ff] text-sm font-semibold text-violet-dark hover:bg-violet-soft"
                >
                  <Plus className="size-4" /> Add question
                </button>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Application deadline" optional type="date" value={data.deadline} onChange={(e) => set("deadline", e.target.value)} />
              <Field label="Openings" type="number" min={1} value={data.openings} onChange={(e) => set("openings", Number(e.target.value) || 1)} />
            </div>
          </FormSection>
          <Alert>{error}</Alert>
        </div>

        <aside className="flex flex-[1_1_320px] flex-col gap-3 lg:sticky lg:top-8">
          <div className="text-xs font-bold tracking-[0.1em] text-muted uppercase">Live preview</div>
          <div className="card p-5.5">
            <div className="flex items-center gap-3.5">
              <CompanyMark name={profile.companyName} tone={companyTone(profile.companyName)} size={52} />
              <div className="min-w-0">
                <div className="truncate font-display text-[19px] font-bold">{data.title || "Job title"}</div>
                <div className="truncate text-[13px] text-muted">
                  {profile.companyName} · {data.location || "Location"}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {[data.employmentType, data.workMode, data.experienceLevel].map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
            <div className="mt-4 font-bold">{formatSalary(data)}</div>
          </div>
          <div className="rounded-[20px] bg-ink p-5 text-sm leading-relaxed">
            <b className="text-lime">Tip</b>
            <br />
            <span className="text-[#c3c7d6]">Posts with a salary range get noticeably more applicants.</span>
          </div>
        </aside>
      </div>
    </form>
  );
}
