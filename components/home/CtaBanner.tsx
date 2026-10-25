import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";

export default function CtaBanner() {
  return (
    <section className="pb-16">
      <div className="container-page">
        <Reveal className="relative flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-[32px] bg-lime p-[clamp(32px,6vw,80px)]">
          <svg className="pointer-events-none absolute -right-10 -bottom-16 opacity-25" width="360" height="360" viewBox="0 0 360 360" aria-hidden="true">
            <circle cx="180" cy="180" r="170" fill="none" stroke="#0F1222" strokeWidth="2" strokeDasharray="4 12">
              <animateTransform attributeName="transform" type="rotate" from="0 180 180" to="360 180 180" dur="40s" repeatCount="indefinite" />
            </circle>
            <circle cx="180" cy="180" r="110" fill="none" stroke="#0F1222" strokeWidth="2" strokeDasharray="2 10">
              <animateTransform attributeName="transform" type="rotate" from="360 180 180" to="0 180 180" dur="30s" repeatCount="indefinite" />
            </circle>
          </svg>
          <div className="relative max-w-[620px]">
            <h2 className="mb-3.5 text-[clamp(34px,5vw,60px)] leading-[1.02] font-extrabold">Your next great hire is one scoop away.</h2>
            <p className="text-lg text-[#2e3350]">Set up your company in under two minutes.</p>
          </div>
          <div className="relative flex flex-wrap gap-3">
            <Button href="/auth/register?role=hr" variant="dark" size="lg">
              Start hiring
            </Button>
            <Button href="/jobs" variant="secondary" size="lg">
              I’m job hunting
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
