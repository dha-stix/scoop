"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { ArrowRight, Mail } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import { GoogleIcon } from "@/components/ui/GoogleButton";
import { people, avatars } from "@/images";

const PIPELINE = [
  { name: "Amara O.", src: avatars.amara, label: "Shortlisted", tone: "success" as const },
  { name: "Lucas M.", src: avatars.lucas, label: "Interview", tone: "violet" as const },
  { name: "Priya K.", src: avatars.priya, label: "Review", tone: "warning" as const },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.7, ease: [0.2, 0.7, 0.2, 1] as const } }),
};

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-14 pb-10 sm:pt-[72px]">
      <div className="pointer-events-none absolute -top-20 -right-28 size-[520px] rounded-full bg-violet-glow opacity-70 blur-[90px]" />
      <div className="pointer-events-none absolute bottom-0 -left-28 size-[360px] rounded-full bg-[#eefbb9] opacity-80 blur-[90px]" />

      <div className="container-page relative grid items-center gap-14 lg:grid-cols-2">
        <motion.div initial="hidden" animate="show">
          <motion.div variants={fadeUp} custom={0}>
            <Badge tone="outline" pulse pulseColor="bg-success">
              Live video interviews, built in
            </Badge>
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="mt-5 mb-5 text-[clamp(44px,6vw,76px)] leading-[1.02] font-extrabold">
            Hire faster.
            <br />
            Interview live.
            <br />
            <span className="rounded-[14px] bg-lime px-3">One scoop.</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="max-w-[520px] text-[19px] leading-relaxed text-[#4a5068]">
            Scoopy brings job posts, applications, shortlisting and in-app video interviews into one place — so companies hire with less
            back-and-forth and candidates always know where they stand.
          </motion.p>
          <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-wrap gap-3">
            <Button href="/auth/register?role=hr" size="lg">
              Post a job — it’s free <ArrowRight className="size-[18px]" />
            </Button>
            <Button href="/jobs" size="lg" variant="secondary">
              Find a job
            </Button>
          </motion.div>
          <motion.p variants={fadeUp} custom={4} className="mt-7 flex items-center gap-3 text-sm text-muted">
            <GoogleIcon size={18} />
            Candidates sign in with Google or email · Companies use secure email login
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
          className="relative min-h-[460px] sm:min-h-[520px]"
        >
          <div className="card absolute inset-[20px_0_60px_0] overflow-hidden shadow-[0_40px_80px_-40px_rgba(15,18,34,0.35)] sm:right-10">
            <div className="flex items-center gap-2 border-b border-[#eef0f5] px-4 py-3.5">
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-3 truncate text-xs text-muted">Interview · Senior Product Designer</span>
              <Badge tone="danger" pulse className="ml-auto">
                REC 12:48
              </Badge>
            </div>
            <div className="grid h-[calc(100%-118px)] grid-cols-2 gap-2.5 p-3">
              <VideoTile src={people.sarahHr} label="Sarah · HR" />
              <VideoTile src={people.danielCandidate} label="Daniel · Candidate" speaking />
            </div>
            <div className="flex justify-center gap-2.5 pb-3.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-10 rounded-full bg-[#f0f1f6]" />
              ))}
              <span className="h-10 w-14 rounded-full bg-danger" />
            </div>
          </div>

          <div className="card absolute top-0 right-0 w-[250px] animate-float p-4 shadow-[0_24px_48px_-24px_rgba(15,18,34,0.3)]">
            <div className="mb-2.5 text-xs text-muted">Pipeline · 48 applicants</div>
            <div className="flex flex-col gap-2">
              {PIPELINE.map((p) => (
                <div key={p.name} className="flex items-center gap-2.5">
                  <Avatar src={p.src} name={p.name} size={30} />
                  <span className="flex-1 text-[13px] font-semibold">{p.name}</span>
                  <Badge tone={p.tone}>{p.label}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="card absolute bottom-0 -left-3 flex w-[290px] animate-float-slow items-center gap-3 p-4 shadow-[0_24px_48px_-24px_rgba(15,18,34,0.3)]">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-lime">
              <Mail className="size-5" />
            </span>
            <div>
              <div className="text-sm font-bold">Interview invite sent</div>
              <div className="text-xs text-muted">Thu, 10:30 · Video room ready</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function VideoTile({ src, label, speaking }: { src: typeof people.sarahHr; label: string; speaking?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl ${speaking ? "ring-3 ring-lime" : ""}`}>
      <Image src={src} alt={label} fill sizes="(min-width: 1024px) 260px, 45vw" className="object-cover" placeholder="blur" priority />
      <Badge tone="dark" className="absolute bottom-3 left-3">
        {speaking && (
          <span className="wave flex h-3.5 items-center" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        )}
        {label}
      </Badge>
    </div>
  );
}
