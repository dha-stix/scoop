import { Plus } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";

const FAQS = [
  { q: "Is Scoopy free for candidates?", a: "Yes. Candidates create an account with Google or email, apply to roles and attend interviews at no cost." },
  { q: "How do companies sign in?", a: "Company HR accounts use a work email and password, with email verification on sign-up." },
  { q: "Do candidates need to install anything for interviews?", a: "No — interviews run in the browser on desktop or mobile. Just allow camera and microphone access." },
  { q: "What happens to candidates who aren’t shortlisted?", a: "HR can send a kind rejection email, archive the application, or delete it entirely." },
  { q: "Can I follow my application after applying?", a: "Yes. Every application has a live tracker on your dashboard, from Applied through to Hired." },
];

export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 pb-20 sm:pb-[104px]">
      <div className="container-page max-w-[860px]">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" className="mb-9" />
        <div className="flex flex-col gap-3">
          {FAQS.map((item, i) => (
            <Reveal key={item.q} delay={i * 0.05}>
              <details className="group card px-6 py-5" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <Plus className="size-6 shrink-0 text-violet transition-transform duration-300 group-open:rotate-45" />
                </summary>
                <p className="mt-3 leading-relaxed text-muted">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
