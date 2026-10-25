import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Reveal from "@/components/ui/Reveal";
import { CompanyMark } from "@/components/ui/Avatar";
import ProgressTimeline from "@/components/applications/ProgressTimeline";
import type { TimelineStep } from "@/lib/pipeline";

const DEMO_STEPS: TimelineStep[] = [
  { label: "Applied", detail: "Oct 2 · CV & cover letter received", state: "done" },
  { label: "Reviewed", detail: "Oct 4 · Viewed by hiring team", state: "done" },
  { label: "Shortlisted", detail: "Oct 6 · You made the shortlist", state: "done" },
  { label: "Interview — Thu Oct 10, 10:30", detail: "Video room opens 10 min before", state: "current" },
  { label: "Offer", state: "todo" },
];

export default function ProgressShowcase() {
  return (
    <section className="py-20 sm:py-[104px]">
      <div className="container-page grid items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <div className="eyebrow">For candidates</div>
          <h2 className="mt-3.5 mb-4 text-[clamp(34px,4.4vw,52px)] leading-[1.08] font-extrabold">Never wonder “did they see my application?” again</h2>
          <p className="mb-7 text-lg leading-relaxed text-[#4a5068]">
            Every application gets a live progress tracker, updated the moment the hiring team acts — through to the offer.
          </p>
          <Button href="/jobs">Browse open roles</Button>
        </Reveal>
        <Reveal delay={0.1} className="card p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CompanyMark name="Northwind Labs" size={44} />
              <div>
                <div className="font-bold">Frontend Engineer</div>
                <div className="text-[13px] text-muted">Northwind Labs · Remote</div>
              </div>
            </div>
            <Badge tone="violet">Interview stage</Badge>
          </div>
          <ProgressTimeline steps={DEMO_STEPS} />
        </Reveal>
      </div>
    </section>
  );
}
