import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageLoader } from "@/components/ui/Spinner";
import Logo from "@/components/ui/Logo";
import RegisterForm from "@/components/auth/RegisterForm";
import OrbitIllustration from "@/components/auth/OrbitIllustration";

export const metadata: Metadata = { title: "Create your account" };

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-52 left-1/2 size-[560px] -translate-x-1/2 rounded-full bg-violet-glow blur-[110px]" />
      <header className="container-page relative flex items-center justify-between py-7">
        <Logo />
        <span className="text-sm text-muted">
          Have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-violet hover:underline">
            Sign in
          </Link>
        </span>
      </header>
      <main className="relative mx-auto flex max-w-[760px] flex-col items-center px-4 pt-4 pb-16 sm:px-6">
        <div className="mb-9 text-center">
          <OrbitIllustration />
          <h1 className="mb-2.5 text-[clamp(36px,5vw,52px)] leading-[1.05] font-extrabold">Create your Scoopy account</h1>
          <p className="text-[17px] text-muted">First, tell us how you’ll use Scoopy.</p>
        </div>
        <Suspense fallback={<PageLoader />}>
          <RegisterForm />
        </Suspense>
      </main>
    </div>
  );
}
