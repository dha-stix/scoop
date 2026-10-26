import type { Metadata } from "next";
import Logo from "@/components/ui/Logo";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <div className="container-page py-8">
      <Logo />
      <main className="mx-auto max-w-[420px] py-16">
        <ResetPasswordForm />
      </main>
    </div>
  );
}
