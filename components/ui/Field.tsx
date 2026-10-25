import clsx from "clsx";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type Common = { label: ReactNode; hint?: ReactNode; optional?: boolean; error?: string; className?: string; children?: ReactNode };

type FieldProps = Common &
  (
    | ({ as?: "input" } & InputHTMLAttributes<HTMLInputElement>)
    | ({ as: "textarea" } & TextareaHTMLAttributes<HTMLTextAreaElement>)
    | ({ as: "select"; options: readonly string[] } & SelectHTMLAttributes<HTMLSelectElement>)
  );

// A labelled form control. Pass `as="select" | "textarea"`, or custom children.
export default function Field(props: FieldProps) {
  const { label, hint, optional, error, className, children, ...rest } = props;
  const controlClass = clsx("input", error && "border-danger");

  let control = children;
  if (!control) {
    if (rest.as === "textarea") {
      const { as: _as, ...p } = rest;
      control = <textarea className={controlClass} {...p} />;
    } else if (rest.as === "select") {
      const { as: _as, options, ...p } = rest;
      control = (
        <select className={controlClass} {...p}>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    } else {
      const { as: _as, ...p } = rest;
      control = <input className={controlClass} {...p} />;
    }
  }

  return (
    <label className={clsx("flex flex-col gap-1.5 text-[13px] font-semibold text-[#2e3350]", className)}>
      <span className="flex items-baseline justify-between gap-2">
        <span>
          {label} {optional && <span className="font-medium text-subtle">(optional)</span>}
        </span>
        {hint && <span className="font-normal text-subtle">{hint}</span>}
      </span>
      {control}
      {error && <span className="text-xs font-medium text-danger-ink">{error}</span>}
    </label>
  );
}

export function FormSection({ title, description, children, className }: { title: ReactNode; description?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={clsx("card p-6 sm:p-7", className)}>
      <h2 className="text-[22px] font-bold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

// Pill-style single choice (work mode, employment type…).
export function ChoiceGroup({ label, name, options, value, onChange }: { label: string; name: string; options: readonly string[]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-[13px] font-semibold text-[#2e3350]">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label
            key={opt}
            className={clsx(
              "flex min-h-11 cursor-pointer items-center rounded-xl border px-4 text-sm transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-violet-glow",
              value === opt ? "border-violet bg-[#f3f0ff] font-semibold text-violet-dark" : "border-line-strong hover:border-ink",
            )}
          >
            <input type="radio" name={name} value={opt} checked={value === opt} onChange={() => onChange(opt)} className="sr-only" />
            {opt}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const ALERT_TONES = {
  danger: "bg-danger-soft text-danger-ink",
  success: "bg-success-soft text-success-ink",
  info: "bg-violet-soft text-violet-dark",
};

export function Alert({ tone = "danger", children }: { tone?: keyof typeof ALERT_TONES; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role={tone === "danger" ? "alert" : "status"} className={clsx("rounded-xl px-4 py-3 text-sm font-medium", ALERT_TONES[tone])}>
      {children}
    </p>
  );
}
