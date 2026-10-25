"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { Building2, UserRound } from "lucide-react";
import Button from "@/components/ui/Button";
import Field, { Alert } from "@/components/ui/Field";
import GoogleButton, { OrDivider } from "@/components/ui/GoogleButton";
import { useAuth } from "./AuthProvider";
import { useRoleParam, useRedirectIfSignedIn } from "./useAuthRedirect";
import { continueWithGoogle, friendlyError, registerCandidate, registerCompany } from "@/lib/firebase-actions";
import { COMPANY_SIZES } from "@/lib/constants";
import type { Role } from "@/lib/types";

const EMPTY = { name: "", email: "", password: "", confirm: "", companyName: "", website: "", companySize: COMPANY_SIZES[0], jobTitle: "", desiredRole: "", location: "" };

export default function RegisterForm() {
  useRedirectIfSignedIn();
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [role, setRole] = useState<Role>(useRoleParam("hr"));
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState("");

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function run(kind: "email" | "google", action: () => Promise<unknown>) {
    setBusy(kind);
    setError("");
    try {
      await action();
      await refreshProfile();
      router.replace(role === "hr" ? "/dashboard/jobs/new" : "/jobs");
    } catch (err) {
      setError(friendlyError(err));
      setBusy(null);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) return setError("Use a password with at least 8 characters.");
    if (role === "hr" && form.password !== form.confirm) return setError("Passwords don't match.");
    run("email", () => (role === "hr" ? registerCompany(form) : registerCandidate(form)));
  }

  return (
    <div className="w-full max-w-[760px]">
      <div className="grid gap-4 sm:grid-cols-2">
        <RoleCard active={role === "hr"} onClick={() => setRole("hr")} icon={<Building2 className="size-6 text-violet" />} iconBg="bg-violet-soft" title="I’m hiring" text="Company HR — post jobs, shortlist applicants and run interviews." />
        <RoleCard active={role === "candidate"} onClick={() => setRole("candidate")} icon={<UserRound className="size-6 text-[#3d5a06]" />} iconBg="bg-lime-soft" title="I’m looking for a job" text="Candidate — apply with your CV and track every application." />
      </div>

      <div className="card mt-5 rounded-3xl p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.form key={role} onSubmit={onSubmit} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {role === "candidate" && (
              <>
                <GoogleButton loading={busy === "google"} onClick={() => run("google", () => continueWithGoogle({ desiredRole: form.desiredRole, location: form.location }))}>
                  Sign up with Google
                </GoogleButton>
                <OrDivider />
              </>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {role === "hr" ? (
                <>
                  <Field label="Company name" required value={form.companyName} onChange={set("companyName")} placeholder="e.g. Northwind Labs" />
                  <Field label="Company website" optional type="url" value={form.website} onChange={set("website")} placeholder="https://" />
                  <Field label="Company size" as="select" options={COMPANY_SIZES} value={form.companySize} onChange={set("companySize")} />
                  <Field label="Your role" required value={form.jobTitle} onChange={set("jobTitle")} placeholder="e.g. Talent Lead" />
                  <Field label="Your full name" required autoComplete="name" value={form.name} onChange={set("name")} />
                  <Field label="Work email" required type="email" autoComplete="email" value={form.email} onChange={set("email")} placeholder="you@company.com" />
                  <Field label="Password" required type="password" autoComplete="new-password" value={form.password} onChange={set("password")} placeholder="At least 8 characters" />
                  <Field label="Confirm password" required type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} />
                </>
              ) : (
                <>
                  <Field label="Full name" required autoComplete="name" value={form.name} onChange={set("name")} />
                  <Field label="Email" required type="email" autoComplete="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
                  <Field label="Password" required type="password" autoComplete="new-password" value={form.password} onChange={set("password")} placeholder="At least 8 characters" />
                  <Field label="Desired role" optional value={form.desiredRole} onChange={set("desiredRole")} placeholder="e.g. Frontend Engineer" />
                </>
              )}
            </div>
            <div className="mt-5 flex flex-col gap-3">
              <Alert>{error}</Alert>
              <Button type="submit" shape="rounded" size="lg" loading={busy === "email"} className="w-full">
                {role === "hr" ? "Create company account" : "Create candidate account"}
              </Button>
              <p className="text-center text-[13px] text-muted">
                {role === "hr" ? "We’ll send a verification link to your work email." : "By signing up you agree to our Terms and Privacy Policy."}
              </p>
            </div>
          </motion.form>
        </AnimatePresence>
      </div>
    </div>
  );
}

function RoleCard({ active, onClick, icon, iconBg, title, text }: { active: boolean; onClick: () => void; icon: ReactNode; iconBg: string; title: string; text: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={clsx(
        "flex flex-col items-start gap-3 rounded-[20px] border-2 bg-white p-6 text-left transition duration-300 hover:-translate-y-0.5",
        active ? "border-violet shadow-[0_0_0_6px_var(--color-violet-glow)]" : "border-line hover:border-line-strong",
      )}
    >
      <span className={clsx("grid size-12 place-items-center rounded-[14px]", iconBg)}>{icon}</span>
      <span className="font-display text-[22px] font-bold">{title}</span>
      <span className="text-sm leading-normal text-muted">{text}</span>
    </button>
  );
}
