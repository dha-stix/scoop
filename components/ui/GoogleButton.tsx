import type { ButtonHTMLAttributes } from "react";
import Spinner from "./Spinner";

export function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.8A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2a11 11 0 0 0 0 9.8z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2 7.1l3.7 2.8C6.6 7.3 9.1 5.4 12 5.4z" />
    </svg>
  );
}

type Props = { loading?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>;

export default function GoogleButton({ children = "Continue with Google", loading, ...props }: Props) {
  return (
    <button
      type="button"
      {...props}
      disabled={loading || props.disabled}
      className="flex min-h-13 w-full items-center justify-center gap-3 rounded-2xl border border-line-strong bg-white text-[15px] font-semibold text-ink transition duration-200 hover:-translate-y-0.5 hover:border-ink hover:shadow-[0_12px_24px_-14px_rgba(15,18,34,0.4)] disabled:opacity-60"
    >
      {loading ? <Spinner className="size-5" /> : <GoogleIcon />}
      {children}
    </button>
  );
}

export function OrDivider({ label = "or with email" }: { label?: string }) {
  return (
    <div className="my-6 flex items-center gap-3 text-[13px] text-subtle">
      <span className="h-px flex-1 bg-line" />
      {label}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
