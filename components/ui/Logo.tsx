import Link from "next/link";
import clsx from "clsx";

// The Scoop mark — the "hired lens": a magnifier with a lime tick on a violet tile.
// Drawn on a 34×34 grid so it can be embedded inside other SVGs with a transform.
export function LogoMarkShapes({ animated = false }: { animated?: boolean }) {
  return (
    <>
      <rect width="34" height="34" rx="10" fill="#5B3DF5" />
      <g>
        {animated && <animateTransform attributeName="transform" type="rotate" values="0 15.5 15.5;-8 15.5 15.5;0 15.5 15.5" dur="4s" repeatCount="indefinite" />}
        <circle cx="15.5" cy="15.5" r="7.5" fill="none" stroke="#fff" strokeWidth="3" />
        <path d="M21.2 21.2l4.6 4.6" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
      </g>
      <path
        d="M12.2 15.6l2.3 2.3 4.4-4.6"
        fill="none"
        stroke="#D7F75B"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...(animated && { strokeDasharray: 12, strokeDashoffset: 12 })}
      >
        {animated && <animate attributeName="stroke-dashoffset" values="12;12;0;0;12" keyTimes="0;0.2;0.45;0.9;1" dur="4s" repeatCount="indefinite" />}
      </path>
    </>
  );
}

export function LogoMark({ size = 34, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
      <LogoMarkShapes animated={animated} />
    </svg>
  );
}

export default function Logo({ href = "/", light = false, size = 34, className }: { href?: string; light?: boolean; size?: number; className?: string }) {
  return (
    <Link href={href} aria-label="Scoop home" className={clsx("flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <span className={clsx("font-display text-2xl font-extrabold tracking-[-0.03em]", light ? "text-white" : "text-ink")}>scoop</span>
    </Link>
  );
}
