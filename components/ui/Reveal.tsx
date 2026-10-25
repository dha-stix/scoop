"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

type Props = { as?: "div" | "section" | "li" | "article"; delay?: number; y?: number; className?: string; id?: string; children: ReactNode };

// Fades and lifts its children into view once, as they scroll in.
export default function Reveal({ as = "div", delay = 0, y = 24, className, id, children }: Props) {
  const Tag = motion[as];
  return (
    <Tag
      id={id}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.2, 0.7, 0.2, 1] }}
      className={className}
    >
      {children}
    </Tag>
  );
}
