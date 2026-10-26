import type { ReactNode } from "react";
import DynamicMarker from "@/components/layout/DynamicMarker";

// Job pages (and /apply) build their link-preview metadata per job at request time.
export default function JobLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <DynamicMarker />
    </>
  );
}
