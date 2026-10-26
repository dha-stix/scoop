"use client";

import { Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { Briefcase, LayoutGrid, LogOut, PlusCircle, Search, Settings, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Logo from "@/components/ui/Logo";
import Avatar from "@/components/ui/Avatar";
import HamburgerButton from "@/components/ui/HamburgerButton";
import { useProfile } from "@/components/auth/RequireAuth";
import { logOut } from "@/lib/supabase-actions";
import type { UserProfile } from "@/lib/types";
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

const DRAWER_ID = "dashboard-drawer";

function useSignOut() {
  const router = useRouter();
  return async () => {
    await logOut();
    router.replace("/");
  };
}

// Reads the pathname, so it lives in its own Suspense boundary (required on dynamic routes).
function NavLinks({ items, variant, onNavigate }: { items: NavItem[]; variant: "sidebar" | "top"; onNavigate?: () => void }) {
  const pathname = usePathname();
  return items.map(({ href, label, icon: Icon, exact }) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        onClick={onNavigate}
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

// Logo, links, the signed-in person and sign out — shared by the desktop sidebar and the mobile drawer.
function SidebarContent({ items, profile, subtitle, onNavigate }: { items: NavItem[]; profile: UserProfile; subtitle: string; onNavigate?: () => void }) {
  const signOut = useSignOut();
  return (
    <>
      <div className="mb-5">
        <Logo light size={30} href="/dashboard" />
      </div>
      <nav aria-label="Dashboard" className="flex flex-col gap-1">
        <Suspense>
          <NavLinks items={items} variant="sidebar" onNavigate={onNavigate} />
        </Suspense>
      </nav>
      <div className="mt-auto flex flex-col gap-2 pt-6">
        <div className="flex items-center gap-3 rounded-2xl bg-ink-3 p-3.5 text-white">
          <Avatar src={profile.photoURL} name={profile.name} size={38} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{profile.name}</div>
            <div className="truncate text-xs text-[#b8bdcf]">{subtitle}</div>
          </div>
        </div>
        <button type="button" onClick={signOut} className="flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium text-[#b8bdcf] hover:bg-ink-3 hover:text-white">
          <LogOut className="size-[18px]" /> Sign out
        </button>
      </div>
    </>
  );
}

// Off-canvas sidebar for small screens: slides in from the left over a dimmed backdrop.
function MobileDrawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.aside
            id={DRAWER_ID}
            aria-label="Dashboard menu"
            className="absolute inset-y-0 left-0 flex w-[min(300px,85vw)] flex-col overflow-y-auto bg-ink px-4 py-6 shadow-2xl"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
          >
            {children}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

// Slim top bar with the hamburger, shown below the lg breakpoint.
function MobileTopBar({ dark, open, onToggle, right }: { dark?: boolean; open: boolean; onToggle: () => void; right?: ReactNode }) {
  return (
    <header className={clsx("sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b px-4 lg:hidden", dark ? "border-ink-3 bg-ink" : "border-line bg-white/90 backdrop-blur-xl")}>
      <Logo light={dark} size={30} href="/dashboard" />
      <div className="flex items-center gap-2">
        {right}
        <HamburgerButton open={open} onToggle={onToggle} controls={DRAWER_ID} light={dark} />
      </div>
    </header>
  );
}

function useDrawer() {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  const close = useCallback(() => setOpen(false), []);
  return { open, toggle, close };
}

function HRShell({ children }: { children: ReactNode }) {
  const profile = useProfile();
  const drawer = useDrawer();
  const subtitle = `${profile.companyName ?? "Company"} · HR`;
  return (
    <div className="min-h-screen lg:flex">
      <MobileTopBar dark open={drawer.open} onToggle={drawer.toggle} />
      <MobileDrawer open={drawer.open} onClose={drawer.close}>
        <SidebarContent items={HR_NAV} profile={profile} subtitle={subtitle} onNavigate={drawer.close} />
      </MobileDrawer>
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col bg-ink px-4 py-6 lg:flex">
        <SidebarContent items={HR_NAV} profile={profile} subtitle={subtitle} />
      </aside>
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10">{children}</main>
    </div>
  );
}

function CandidateShell({ children }: { children: ReactNode }) {
  const profile = useProfile();
  const signOut = useSignOut();
  const drawer = useDrawer();
  return (
    <div className="flex min-h-screen flex-col">
      <MobileTopBar open={drawer.open} onToggle={drawer.toggle} right={<Avatar src={profile.photoURL} name={profile.name} size={36} />} />
      <MobileDrawer open={drawer.open} onClose={drawer.close}>
        <SidebarContent items={CANDIDATE_NAV} profile={profile} subtitle="Candidate" onNavigate={drawer.close} />
      </MobileDrawer>
      <header className="sticky top-0 z-30 hidden border-b border-line bg-white/90 backdrop-blur-xl lg:block">
        <div className="container-page flex h-[72px] items-center justify-between gap-4">
          <Logo href="/dashboard" />
          <nav aria-label="Dashboard" className="flex gap-7">
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
