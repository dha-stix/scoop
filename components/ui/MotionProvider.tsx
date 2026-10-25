"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

// Honour the visitor's "reduce motion" setting for every Motion animation.
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
