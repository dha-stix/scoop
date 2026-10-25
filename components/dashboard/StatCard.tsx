import clsx from "clsx";
import type { ReactNode } from "react";

type Props = { label: string; value: ReactNode; note?: ReactNode; noteTone?: "muted" | "success"; highlight?: boolean; side?: ReactNode; children?: ReactNode };

export default function StatCard({ label, value, note, noteTone = "muted", highlight, side, children }: Props) {
  return (
    <div className={clsx("card card-hover p-5.5", highlight && "border-lime bg-lime")}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className={clsx("text-[13px] font-semibold", highlight ? "text-[#2e3a10]" : "text-muted")}>{label}</div>
          <div className="mt-1.5 font-display text-[40px] leading-none font-extrabold">{value}</div>
          {note && <div className={clsx("mt-1.5 text-[13px]", noteTone === "success" ? "font-semibold text-success-ink" : highlight ? "text-[#2e3a10]" : "text-muted")}>{note}</div>}
        </div>
        {side}
      </div>
      {children}
    </div>
  );
}
