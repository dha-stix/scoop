"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import SectionHeading from "@/components/ui/SectionHeading";
import SegmentedControl from "@/components/ui/SegmentedControl";

type Audience = "company" | "candidate";

const STEPS: Record<Audience, { title: string; text: string }[]> = {
  company: [
    { title: "Post the role", text: "Title, salary range, location, requirements and screening questions — published in minutes." },
    { title: "Review & shortlist", text: "Read CVs inline, rate applicants, then shortlist, reject or archive in one click." },
    { title: "Interview live", text: "Send invites by email and meet in a built-in HD video room with chat and screen share." },
    { title: "Make the offer", text: "Send the offer, track acceptance and close the role — the candidate sees every step." },
  ],
  candidate: [
    { title: "Create your account", text: "Sign up in seconds with Google or your email and a password." },
    { title: "Apply with your CV", text: "Upload your CV, add an optional cover letter and apply to any role." },
    { title: "Track every step", text: "A live tracker shows when you’re reviewed, shortlisted or invited. No more silence." },
    { title: "Interview & get hired", text: "Join your interview from the browser and accept your offer right in Scoop." },
  ],
};

export default function HowItWorks() {
  const [audience, setAudience] = useState<Audience>("company");

  return (
    <section id="how" className="scroll-mt-20 py-20 sm:py-24">
      <div className="container-page">
        <SectionHeading eyebrow="How it works" title="From job post to signed offer, in four steps" className="mb-10">
          <SegmentedControl
            className="mt-6"
            label="Show steps for"
            layoutId="how-audience"
            value={audience}
            onChange={setAudience}
            options={[
              { value: "company", label: "For companies" },
              { value: "candidate", label: "For candidates" },
            ]}
          />
        </SectionHeading>

        <AnimatePresence mode="wait">
          <motion.ol
            key={audience}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {STEPS[audience].map((step, i) => {
              const last = i === STEPS[audience].length - 1;
              return (
                <motion.li
                  key={step.title}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className={clsx("card card-hover p-7", last && "border-ink bg-ink text-white")}
                >
                  <div className={clsx("font-display text-[44px] font-extrabold", last ? "text-lime" : "text-violet")}>0{i + 1}</div>
                  <h3 className="mt-3.5 mb-2 text-[22px] font-bold">{step.title}</h3>
                  <p className={clsx("leading-relaxed", last ? "text-[#c3c7d6]" : "text-muted")}>{step.text}</p>
                </motion.li>
              );
            })}
          </motion.ol>
        </AnimatePresence>
      </div>
    </section>
  );
}
