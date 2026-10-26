"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { ChevronDown, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Field";
import NotConnected from "@/components/auth/NotConnected";
import JobCard, { JobCardSkeleton } from "./JobCard";
import JobsHeroArt from "./JobsHeroArt";
import { getOpenJobs } from "@/lib/supabase-actions";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAsync, useNow } from "@/lib/use-async";
import { EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, WORK_MODES } from "@/lib/constants";
import { toDate } from "@/lib/format";
import type { Job } from "@/lib/types";

type Filters = { workMode: string[]; employmentType: string[]; experienceLevel: string[] };
const NO_FILTERS: Filters = { workMode: [], employmentType: [], experienceLevel: [] };

const GROUPS: { key: keyof Filters; label: string; options: string[] }[] = [
  { key: "workMode", label: "Work type", options: WORK_MODES },
  { key: "employmentType", label: "Employment", options: EMPLOYMENT_TYPES },
  { key: "experienceLevel", label: "Experience", options: EXPERIENCE_LEVELS },
];

// Collapsible on phones and tablets (tap "Filters" to open), always open beside the results on desktop.
function FilterPanel({ filters, onToggle, onClear }: { filters: Filters; onToggle: (key: keyof Filters, value: string) => void; onClear: () => void }) {
  const [open, setOpen] = useState(false);
  const active = Object.values(filters).reduce((n, list) => n + list.length, 0);

  return (
    <aside className="card w-full p-5.5 lg:sticky lg:top-24 lg:w-[260px] lg:shrink-0">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="job-filters"
          className="-m-2 flex min-h-11 flex-1 items-center gap-2.5 rounded-xl p-2 text-left lg:pointer-events-none"
        >
          <SlidersHorizontal className="size-[18px] text-violet" />
          <span className="font-bold">Filters</span>
          {active > 0 && <span className="rounded-full bg-violet px-2 py-0.5 text-xs font-semibold text-white">{active}</span>}
          <ChevronDown className={clsx("ml-auto size-5 text-muted transition-transform duration-300 lg:hidden", open && "rotate-180")} />
        </button>
        {active > 0 && (
          <button type="button" onClick={onClear} className="text-[13px] font-semibold text-violet hover:underline">
            Clear all
          </button>
        )}
      </div>

      {/* Grid-row trick: animates to the content's natural height without measuring it. */}
      <div
        id="job-filters"
        className={clsx("grid transition-[grid-template-rows] duration-300 ease-out lg:grid-rows-[1fr]", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
      >
        <div className={clsx("overflow-hidden", !open && "invisible lg:visible")}>
          <div className="flex flex-col gap-5.5 pt-5.5">
            {GROUPS.map((g) => (
              <fieldset key={g.key} className="flex flex-col gap-1">
                <legend className="mb-2 text-xs font-bold tracking-[0.08em] text-muted uppercase">{g.label}</legend>
                <div className="flex flex-wrap gap-x-5 lg:flex-col">
                  {g.options.map((opt) => (
                    <label key={opt} className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm font-medium text-[#2e3350]">
                      <input type="checkbox" checked={filters[g.key].includes(opt)} onChange={() => onToggle(g.key, opt)} className="size-[18px] accent-violet" />
                      {opt}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function matches(job: Job, text: string, place: string, filters: Filters) {
  const haystack = `${job.title} ${job.companyName} ${job.department} ${job.skills?.join(" ")}`.toLowerCase();
  if (text && !haystack.includes(text.toLowerCase())) return false;
  if (place && !`${job.location} ${job.workMode}`.toLowerCase().includes(place.toLowerCase())) return false;
  return (Object.keys(filters) as (keyof Filters)[]).every((k) => !filters[k].length || filters[k].includes(job[k]));
}

export default function JobBoard() {
  const { data: jobs, error, loading } = useAsync(() => getOpenJobs(), []);
  const [text, setText] = useState("");
  const [place, setPlace] = useState("");
  const [query, setQuery] = useState({ text: "", place: "" });
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [sort, setSort] = useState<"recent" | "salary">("recent");
  const now = useNow();

  const results = useMemo(() => {
    const list = (jobs ?? []).filter((j) => matches(j, query.text, query.place, filters));
    return sort === "salary"
      ? [...list].sort((a, b) => (b.salaryMax ?? 0) - (a.salaryMax ?? 0))
      : [...list].sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0));
  }, [jobs, query, filters, sort]);

  const toggle = (key: keyof Filters, value: string) =>
    setFilters((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value] }));

  return (
    <>
      <section className="relative overflow-hidden bg-ink pt-14 pb-[72px] text-white">
        <div className="pointer-events-none absolute -top-40 -right-24 size-[480px] rounded-full bg-violet opacity-50 blur-[120px]" />
        <JobsHeroArt />
        <div className="container-page relative">
          <h1 className="mb-2.5 text-[clamp(36px,5vw,56px)] font-extrabold">Find your next role</h1>
          <p className="mb-7 text-[17px] text-[#b8bdcf]">Open positions from companies hiring on Scoop.</p>
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery({ text, place });
            }}
            className="flex max-w-[860px] flex-wrap gap-2.5 rounded-[20px] bg-white p-2.5 text-ink"
          >
            <label className="flex min-h-13 flex-[2_1_260px] items-center gap-2.5 px-3.5">
              <Search className="size-5 text-muted" />
              <span className="sr-only">Job title or keyword</span>
              <input type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Job title, skill or company" className="w-full text-base outline-none" />
            </label>
            <label className="flex min-h-13 flex-[1_1_200px] items-center gap-2.5 border-line px-3.5 sm:border-l">
              <MapPin className="size-5 text-muted" />
              <span className="sr-only">Location</span>
              <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Location or Remote" className="w-full text-base outline-none" />
            </label>
            <Button type="submit" shape="rounded" size="lg" className="flex-auto sm:flex-none">
              Search jobs
            </Button>
          </form>
        </div>
      </section>

      <section className="container-page flex flex-col gap-5 pt-9 pb-[72px] lg:flex-row lg:items-start lg:gap-7">
        <FilterPanel filters={filters} onToggle={toggle} onClear={() => setFilters(NO_FILTERS)} />

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-muted" aria-live="polite">
              <b className="text-ink">{results.length}</b> {results.length === 1 ? "job matches" : "jobs match"} your filters
            </span>
            <label className="flex items-center gap-2 text-sm text-muted">
              Sort
              <select value={sort} onChange={(e) => setSort(e.target.value as "recent" | "salary")} className="min-h-10 rounded-[10px] border border-line-strong bg-white px-2.5 text-sm font-medium text-ink">
                <option value="recent">Most recent</option>
                <option value="salary">Salary: high to low</option>
              </select>
            </label>
          </div>

          {!isSupabaseConfigured ? (
            <NotConnected />
          ) : error ? (
            <Alert>{error}</Alert>
          ) : loading ? (
            <div className="flex flex-col gap-3.5">
              {[0, 1, 2, 3].map((i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length ? (
            <motion.div layout className="flex flex-col gap-3.5">
              <AnimatePresence initial={false}>
                {results.map((job) => (
                  <motion.div key={job.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}>
                    <JobCard job={job} now={now} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="card">
              <EmptyState title="No jobs match yet" description="Try clearing a filter or searching for something broader." />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
