import Image, { type StaticImageData } from "next/image";
import clsx from "clsx";
import { initials } from "@/lib/format";

const PALETTE = ["#E3DCFF", "#F1FBD0", "#FFE1CC", "#DDF0FF", "#FBE0EC", "#CDEFE0"];

type AvatarProps = { src?: string | StaticImageData | null; name?: string; size?: number; className?: string };

// Shows a photo when we have one, otherwise coloured initials.
export default function Avatar({ src, name = "", size = 40, className }: AvatarProps) {
  const style = { width: size, height: size };
  if (src) {
    return (
      <Image src={src} alt={name} width={size} height={size} className={clsx("shrink-0 rounded-full object-cover", className)} style={style} />
    );
  }
  const bg = PALETTE[(name.charCodeAt(0) || 0) % PALETTE.length];
  return (
    <span
      role="img"
      aria-label={name}
      className={clsx("grid shrink-0 place-items-center rounded-full font-semibold text-ink", className)}
      style={{ ...style, background: bg, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  );
}

type CompanyMarkProps = { name?: string; logoUrl?: string; size?: number; tone?: "dark" | "lime" | "violet"; className?: string };

const MARK_TONES = { dark: "bg-ink text-lime", lime: "bg-lime text-ink", violet: "bg-violet text-white" };

// Square company logo tile, falling back to the company's initial.
export function CompanyMark({ name = "", logoUrl, size = 56, tone = "dark", className }: CompanyMarkProps) {
  if (logoUrl) {
    return <Image src={logoUrl} alt={`${name} logo`} width={size} height={size} className={clsx("shrink-0 rounded-2xl object-cover", className)} />;
  }
  return (
    <span
      className={clsx("grid shrink-0 place-items-center rounded-2xl font-display font-extrabold", MARK_TONES[tone], className)}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {name.charAt(0).toUpperCase() || "?"}
    </span>
  );
}

// Picks a stable tile colour per company so lists look varied.
export function companyTone(name = ""): "dark" | "lime" | "violet" {
  return (["dark", "violet", "lime"] as const)[(name.charCodeAt(0) || 0) % 3];
}
