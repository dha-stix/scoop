import Image from "next/image";
import { Mic, Video, MonitorUp, Circle, Smile, PhoneOff } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import Badge from "@/components/ui/Badge";
import { people } from "@/images";

const CONTROLS = [
  { icon: Mic, label: "Mic" },
  { icon: Video, label: "Camera" },
  { icon: MonitorUp, label: "Share screen" },
  { icon: Circle, label: "Record" },
  { icon: Smile, label: "Reactions" },
];

export default function LiveInterview() {
  return (
    <section className="relative overflow-hidden bg-ink py-20 text-white sm:py-[104px]">
      <div className="pointer-events-none absolute top-[40%] left-1/2 size-[600px] -translate-1/2 rounded-full bg-violet opacity-35 blur-[140px]" />
      <div className="container-page relative">
        <SectionHeading
          light
          eyebrow="Live interviews"
          title="Meet candidates face to face — right inside Scoopy"
          description="Invites carry a secure room link. Both sides join from any device, on time, with nothing to install."
          className="mb-12 max-w-[720px]"
        />
        <Reveal className="rounded-3xl border border-ink-4 bg-ink-2 p-3.5 shadow-[0_60px_120px_-40px_rgba(0,0,0,0.6)]">
          <div className="flex flex-wrap gap-3.5">
            <div className="grid min-w-0 flex-[999_1_560px] gap-3 sm:grid-cols-2">
              <Tile src={people.sarahHr} name="Sarah · Host" alt="Sarah, the HR interviewer" />
              <Tile src={people.danielCandidate} name="Daniel · speaking" alt="Daniel, the candidate" speaking />
            </div>
            <div className="flex flex-[1_1_260px] flex-col gap-2.5 rounded-2xl bg-ink-3 p-4">
              <div className="text-sm font-bold">Chat</div>
              <div className="rounded-xl bg-[#2a3050] px-3 py-2.5 text-[13px] text-[#d6d9e6]">Sharing my portfolio now</div>
              <div className="self-end rounded-xl bg-violet px-3 py-2.5 text-[13px]">Perfect, go ahead</div>
              <div className="mt-auto rounded-xl border border-[#343a58] px-3 py-2.5 text-[13px] text-[#8e94ad]">Message…</div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5 pt-4.5 pb-1.5">
            {CONTROLS.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-2 rounded-full bg-[#262b44] px-4 py-2.5 text-xs font-semibold">
                <Icon className="size-4" /> {label}
              </span>
            ))}
            <span className="inline-flex items-center gap-2 rounded-full bg-danger px-4.5 py-2.5 text-xs font-semibold">
              <PhoneOff className="size-4" /> Leave
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Tile({ src, name, alt, speaking }: { src: typeof people.sarahHr; name: string; alt: string; speaking?: boolean }) {
  return (
    <div className={`relative h-[300px] overflow-hidden rounded-2xl sm:h-[340px] ${speaking ? "ring-3 ring-lime" : ""}`}>
      <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 400px, 90vw" className="object-cover" placeholder="blur" />
      <Badge tone="dark" className="absolute top-3.5 left-3.5">
        {speaking && (
          <span className="wave flex h-3.5 items-center" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
        )}
        {name}
      </Badge>
    </div>
  );
}
