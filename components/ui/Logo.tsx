import Link from "next/link";
import clsx from "clsx";

// The Scoopy mark: an ice-cream scoop on a violet tile.
export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
      <rect width="34" height="34" rx="10" fill="#5B3DF5" />
      <path d="M9 17a8 8 0 0 1 16 0z" fill="#fff" />
      <path d="M11 19h12l-6 8z" fill="#D7F75B" />
    </svg>
  );
}

export default function Logo({ href = "/", light = false, size = 34, className }: { href?: string; light?: boolean; size?: number; className?: string }) {
  return (
    <Link href={href} aria-label="Scoopy home" className={clsx("flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <span className={clsx("font-display text-2xl font-extrabold", light ? "text-white" : "text-ink")}>scoopy</span>
    </Link>
  );
}
