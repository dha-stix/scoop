import Link from "next/link";
import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import Spinner from "./Spinner";

const VARIANTS = {
  primary: "bg-violet text-white shadow-[0_8px_24px_-10px_rgba(91,61,245,0.7)] hover:bg-violet-dark",
  secondary: "border border-line-strong bg-white text-ink hover:border-ink",
  lime: "bg-lime text-ink hover:bg-lime-dark",
  dark: "bg-ink text-white hover:bg-ink-3",
  danger: "bg-danger-soft text-danger-ink hover:bg-[#ffe1e2]",
  success: "bg-success text-white hover:bg-success-ink",
  ghost: "bg-transparent text-body hover:bg-black/5",
  glass: "bg-ink-3 text-white hover:bg-ink-4",
};

const SIZES = {
  sm: "min-h-9 px-3.5 text-[13px]",
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-14 px-7 text-base",
};

type Props = {
  href?: string;
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  shape?: "pill" | "rounded";
  loading?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export default function Button({ href, variant = "primary", size = "md", shape = "pill", loading = false, className, children, ...props }: Props) {
  const classes = clsx(
    "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition duration-200 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50",
    shape === "pill" ? "rounded-full" : "rounded-xl",
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={props["aria-label"]}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" {...props} className={classes} disabled={loading || props.disabled}>
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}
