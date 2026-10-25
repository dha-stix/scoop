import Image from "next/image";
import { FileText, Columns3, Mail, ShieldCheck, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { people } from "@/images";

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: FileText, title: "Rich job posts", text: "Salary, location, work type, responsibilities, perks and screening questions — all structured and searchable." },
  { icon: Columns3, title: "Visual pipeline", text: "Move applicants from New → Shortlisted → Interview → Offer. Bulk actions for the rest." },
  { icon: Mail, title: "Automatic emails", text: "Interview invites, kind rejections and offer letters sent from ready-made templates." },
  { icon: ShieldCheck, title: "Secure by default", text: "Email or Google sign-in, role-based access and locked-down data rules — candidates only see their own data." },
];

export default function Features() {
  return (
    <section id="features" className="scroll-mt-20 pt-8 pb-20 sm:pb-24">
      <div className="container-page">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[620px]">
            <div className="eyebrow">Everything in one place</div>
            <h2 className="mt-3.5 text-[clamp(34px,4.4vw,52px)] leading-[1.08] font-extrabold">The whole hiring loop, without the tab juggling</h2>
          </div>
          <Button href="/auth/register?role=hr" variant="secondary">
            Create a company account
          </Button>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Reveal className="card card-hover flex flex-col gap-4 border-violet bg-violet p-8 text-white lg:row-span-2">
            <Video className="size-8 text-lime" />
            <h3 className="text-3xl font-bold">In-app video interviews</h3>
            <p className="leading-relaxed text-[#e2dcff]">
              HD video rooms powered by Stream — with live chat, screen sharing, reactions, recording and a pre-join lobby. No downloads, no
              external links.
            </p>
            <div className="mt-auto grid grid-cols-2 gap-2">
              {[people.sarahHr, people.amaraCandidate].map((src, i) => (
                <div key={i} className="relative h-36 overflow-hidden rounded-2xl">
                  <Image src={src} alt={i ? "Candidate on a video call" : "HR lead on a video call"} fill sizes="200px" className="object-cover" placeholder="blur" />
                </div>
              ))}
            </div>
          </Reveal>
          {FEATURES.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 0.06} className="card card-hover p-8">
              <Icon className="size-7 text-violet" />
              <h3 className="mt-4 mb-2 text-[22px] font-bold">{title}</h3>
              <p className="leading-relaxed text-muted">{text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
