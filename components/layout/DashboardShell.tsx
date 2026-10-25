"use client";

import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { Briefcase, LayoutGrid, LogOut, PlusCircle, Search, Settings, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Logo from "@/components/ui/Logo";
import Avatar from "@/components/ui/Avatar";
import { useProfile } from "@/components/auth/RequireAuth";
import { logOut } from "@/lib/firebase-actions";
import Footer from "./Footer";

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

const HR_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/dashboard/jobs/new", label: "Post a job", icon: PlusCircle },
  { href: "/dashboard/profile", label: "Company profile", icon: Settings },
];

const CANDIDATE_NAV: NavItem[] = [
  { href: "/dashboard", label: "My applications", icon: Briefcase, exact: true },
  { href: "/jobs", label: "Find jobs", icon: Search },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
];

function useSignOut() {
  const router = useRouter();
  return async () => {
    await logOut();
    router.replace("/");
  };
}

// Reads the pathname, so it lives in its own Suspense boundary (required on dynamic routes).
function NavLinks({ items, variant }: { items: NavItem[]; variant: "sidebar" | "top" }) {
  const pathname = usePathname();
  return items.map(({ href, label, icon: Icon, exact }) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={clsx(
          variant === "sidebar"
            ? ["flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition", active ? "bg-violet text-white" : "text-[#b8bdcf] hover:bg-ink-3 hover:text-white"]
            : ["flex items-center gap-2 border-b-2 py-2 text-[15px] transition", active ? "border-violet font-bold text-ink" : "border-transparent text-body hover:text-ink"],
        )}
      >
        <Icon className="size-[18px]" /> {label}
      </Link>
    );
  });
}

function HRShell({ children }: { children: ReactNode }) {
  const profile = useProfile();
  const signOut = useSignOut();
  return (
    <div className="flex min-h-screen flex-wrap">
      <aside className="flex w-full flex-col gap-1 bg-ink px-4 py-5 lg:sticky lg:top-0 lg:h-screen lg:w-[248px] lg:py-6">
        <div className="mb-3 flex items-center justify-between lg:mb-5">
          <Logo light size={30} href="/dashboard" />
          <button type="button" onClick={signOut} aria-label="Sign out" className="grid size-10 place-items-center rounded-xl text-[#b8bdcf] hover:bg-ink-3 lg:hidden">
            <LogOut className="size-[18px]" />
          </button>
        </div>
        <nav aria-label="Dashboard" className="flex gap-1 overflow-x-auto lg:flex-col">
          <Suspense>
            <NavLinks items={HR_NAV} variant="sidebar" />
          </Suspense>
        </nav>
        <div className="mt-auto hidden flex-col gap-2 lg:flex">
          <div className="flex items-center gap-3 rounded-2xl bg-ink-3 p-3.5 text-white">
            <Avatar src={profile.photoURL} name={profile.name} size={38} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{profile.name}</div>
              <div className="truncate text-xs text-[#b8bdcf]">{profile.companyName} · HR</div>
            </div>
          </div>
          <button type="button" onClick={signOut} className="flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium text-[#b8bdcf] hover:bg-ink-3 hover:text-white">
            <LogOut className="size-[18px]" /> Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-[999_1_640px] px-4 py-8 sm:px-8 lg:px-10">{children}</main>
    </div>
  );
}

function CandidateShell({ children }: { children: ReactNode }) {
  const profile = useProfile();
  const signOut = useSignOut();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-xl">
        <div className="container-page flex h-[72px] items-center justify-between gap-4">
          <Logo href="/dashboard" />
          <nav aria-label="Dashboard" className="hidden gap-7 md:flex">
            <Suspense>
              <NavLinks items={CANDIDATE_NAV} variant="top" />
            </Suspense>
          </nav>
          <div className="flex items-center gap-2">
            <Avatar src={profile.photoURL} name={profile.name} size={38} />
            <button type="button" onClick={signOut} aria-label="Sign out" className="grid size-11 place-items-center rounded-xl border border-line-strong hover:border-ink">
              <LogOut className="size-[18px]" />
            </button>
          </div>
        </div>
        <nav aria-label="Dashboard mobile" className="container-page flex gap-6 overflow-x-auto pb-2 md:hidden">
          <Suspense>
            <NavLinks items={CANDIDATE_NAV} variant="top" />
          </Suspense>
        </nav>
      </header>
      <main className="container-page flex-1 pt-8 pb-16">{children}</main>
      <Footer />
    </div>
  );
}

export default function DashboardShell({ children }: { children: ReactNode }) {
  const profile = useProfile();
  return profile.role === "hr" ? <HRShell>{children}</HRShell> : <CandidateShell>{children}</CandidateShell>;
}
