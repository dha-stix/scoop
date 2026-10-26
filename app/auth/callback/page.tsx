import type { Metadata } from "next";
import Logo from "@/components/ui/Logo";
import AuthCallback from "@/components/auth/AuthCallback";

export const metadata: Metadata = { title: "Signing in" };

export default function AuthCallbackPage() {
  return (
    <div className="container-page py-8">
      <Logo />
      <AuthCallback />
    </div>
  );
}
