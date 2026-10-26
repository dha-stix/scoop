"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Spinner";
import { useAuth } from "./AuthProvider";
import { nextPath } from "./useAuthRedirect";
import { completeAuthRedirect, friendlyError } from "@/lib/supabase-actions";

// Landing page after Google sign-in or an email confirmation link.
export default function AuthCallback() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    completeAuthRedirect()
      .then(async () => {
        await refreshProfile();
        router.replace(nextPath());
      })
      .catch((err) => setError(friendlyError(err)));
  }, [refreshProfile, router]);

  if (!error) return <PageLoader label="Signing you in…" />;
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <h1 className="text-3xl font-extrabold">We couldn’t sign you in</h1>
      <p className="mt-3 text-muted">{error}</p>
      <Button href="/auth/login" className="mt-6">
        Back to sign in
      </Button>
    </div>
  );
}
