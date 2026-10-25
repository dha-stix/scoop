import clsx from "clsx";
import type { ReactNode } from "react";
import Reveal from "./Reveal";

type Props = { eyebrow?: string; title: ReactNode; description?: ReactNode; center?: boolean; light?: boolean; className?: string; children?: ReactNode };

export default function SectionHeading({ eyebrow, title, description, center = true, light = false, className, children }: Props) {
  return (
    <Reveal className={clsx(center && "mx-auto text-center", "max-w-[700px]", className)}>
      {eyebrow && <div className={clsx("eyebrow", light && "text-lime")}>{eyebrow}</div>}
      <h2 className="mt-3.5 text-[clamp(34px,4.4vw,52px)] leading-[1.08] font-extrabold">{title}</h2>
      {description && <p className={clsx("mt-4 text-lg leading-relaxed", light ? "text-[#b8bdcf]" : "text-[#4a5068]")}>{description}</p>}
      {children}
    </Reveal>
  );
}
