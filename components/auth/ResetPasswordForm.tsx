"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Field, { Alert } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/Spinner";
import { useAuth } from "./AuthProvider";
import { friendlyError, updatePassword } from "@/lib/supabase-actions";

// Opened from the password reset email; the link signs the user in first.
export default function ResetPasswordForm() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("Use a password with at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    setError("");
    try {
      await updatePassword(password);
      router.replace("/dashboard");
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  if (loading) return <PageLoader />;
  if (!user) {
    return (
      <div className="text-center">
        <h1 className="text-3xl font-extrabold">This reset link has expired</h1>
        <p className="mt-3 text-muted">Request a new one from the sign-in page.</p>
        <Button href="/auth/login" className="mt-6">
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h1 className="text-[40px] leading-tight font-extrabold">Choose a new password</h1>
      <p className="text-muted">For {user.email}</p>
      <Field label="New password" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
      <Field label="Confirm new password" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      <Alert>{error}</Alert>
      <Button type="submit" shape="rounded" size="lg" loading={busy} className="w-full">
        Save new password
      </Button>
    </form>
  );
}
