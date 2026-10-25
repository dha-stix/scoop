import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageLoader } from "@/components/ui/Spinner";
import Logo from "@/components/ui/Logo";
import LoginForm from "@/components/auth/LoginForm";
import AuthVisual from "@/components/auth/AuthVisual";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-wrap">
      <div className="flex min-h-screen flex-1 basis-[480px] flex-col px-6 py-8 sm:px-16">
        <Logo />
        <main className="my-auto flex justify-center py-10">
          <Suspense fallback={<PageLoader />}>
            <LoginForm />
          </Suspense>
        </main>
        <p className="text-xs text-subtle">
          By continuing you agree to our <Link href="/" className="text-violet">Terms</Link> and <Link href="/" className="text-violet">Privacy Policy</Link>.
        </p>
      </div>
      <AuthVisual />
    </div>
  );
}
