"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import Field, { Alert } from "@/components/ui/Field";
import GoogleButton, { OrDivider } from "@/components/ui/GoogleButton";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { useAuth } from "./AuthProvider";
import { useRoleParam, nextPath, useRedirectIfSignedIn } from "./useAuthRedirect";
import { continueWithGoogle, friendlyError, resetPassword, signInWithEmail } from "@/lib/firebase-actions";
import type { Role } from "@/lib/types";

export default function LoginForm() {
  useRedirectIfSignedIn();
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [role, setRole] = useState<Role>(useRoleParam("candidate"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function run(kind: "email" | "google", action: () => Promise<unknown>) {
    setBusy(kind);
    setError("");
    setNotice("");
    try {
      await action();
      await refreshProfile();
      router.replace(nextPath());
    } catch (err) {
      setError(friendlyError(err));
      setBusy(null);
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    run("email", () => signInWithEmail({ email, password, role, remember }));
  };

  async function onForgot() {
    setError("");
    if (!email) return setError("Enter your email above first, then tap “Forgot?” again.");
    try {
      await resetPassword(email);
      setNotice(`We sent a reset link to ${email}.`);
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  const emailFields = (
    <>
      <Field label={role === "hr" ? "Work email" : "Email"} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={role === "hr" ? "you@company.com" : "you@example.com"} />
      <div className="relative">
        <Field label="Password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="button" onClick={onForgot} className="absolute top-0 right-0 text-[13px] font-semibold text-violet hover:underline">
          Forgot password?
        </button>
      </div>
    </>
  );

  return (
    <div className="w-full max-w-[420px]">
      <h1 className="mb-2.5 text-[44px] leading-[1.05] font-extrabold">Welcome back</h1>
      <p className="mb-6 text-[17px] leading-relaxed text-muted">Sign in to manage your hiring or check on your applications.</p>

      <SegmentedControl
        className="mb-6 flex w-full rounded-2xl [&>button]:rounded-xl [&_span]:rounded-xl"
        label="Account type"
        layoutId="login-role"
        value={role}
        onChange={(r) => {
          setRole(r);
          setError("");
        }}
        options={[
          { value: "candidate", label: "I’m a candidate" },
          { value: "hr", label: "I’m hiring (HR)" },
        ]}
      />

      <AnimatePresence mode="wait">
        <motion.form key={role} onSubmit={onSubmit} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="flex flex-col gap-3.5">
          {role === "candidate" && (
            <>
              <GoogleButton loading={busy === "google"} onClick={() => run("google", () => continueWithGoogle())} />
              <OrDivider />
            </>
          )}
          {emailFields}
          {role === "hr" && (
            <label className="flex min-h-8 items-center gap-2.5 text-sm text-body">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-[18px] accent-violet" />
              Keep me signed in
            </label>
          )}
          <Alert>{error}</Alert>
          <Alert tone="success">{notice}</Alert>
          <Button type="submit" shape="rounded" size="lg" loading={busy === "email"} className="mt-1.5 w-full">
            {role === "hr" ? "Sign in to company workspace" : "Sign in"}
          </Button>
          {role === "hr" && (
            <p className="mt-1 flex items-center gap-2 text-[13px] text-muted">
              <ShieldCheck className="size-4 text-violet" /> Company accounts use email &amp; password only.
            </p>
          )}
        </motion.form>
      </AnimatePresence>

      <p className="mt-8 text-[15px] text-muted">
        New to Scoop?{" "}
        <Link href={`/auth/register?role=${role}`} className="font-semibold text-violet hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
