import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = { title: ReactNode; subtitle?: ReactNode; backHref?: string; backLabel?: string; actions?: ReactNode };

export default function PageHeader({ title, subtitle, backHref, backLabel = "Back", actions }: Props) {
  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        {backHref && (
          <Link href={backHref} aria-label={backLabel} className="grid size-11 shrink-0 place-items-center rounded-xl border border-line-strong bg-white hover:border-ink">
            <ArrowLeft className="size-[18px]" />
          </Link>
        )}
        <div>
          <h1 className="text-[clamp(26px,3vw,34px)] leading-tight font-extrabold">{title}</h1>
          {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
