"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import clsx from "clsx";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { useAuth } from "@/components/auth/AuthProvider";

const LINKS = [
  { href: "/jobs", label: "Browse jobs" },
  { href: "/#how", label: "How it works" },
  { href: "/#features", label: "For companies" },
  { href: "/#faq", label: "FAQ" },
];

export default function Navbar({ active }: { active?: string }) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-mist/80 backdrop-blur-xl">
      <div className="container-page flex h-[72px] items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden gap-8 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx("text-[15px] font-medium transition hover:text-ink", active === l.href ? "font-bold text-ink" : "text-body")}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          {profile ? (
            <Link href="/dashboard" className="flex items-center gap-2 rounded-full border border-line-strong bg-white py-1 pr-4 pl-1 text-sm font-semibold hover:border-ink">
              <Avatar src={profile.photoURL} name={profile.name} size={34} />
              Dashboard
            </Link>
          ) : (
            <>
              <span className="hidden sm:contents">
                <Button href="/auth/login" variant="secondary">
                  Sign in
                </Button>
              </span>
              <Button href="/auth/register">Get started</Button>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid size-11 place-items-center rounded-xl border border-line-strong bg-white md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            aria-label="Mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-line bg-white md:hidden"
          >
            <div className="container-page flex flex-col py-3">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-3 text-base font-medium text-body">
                  {l.label}
                </Link>
              ))}
              {!profile && (
                <Link href="/auth/login" onClick={() => setOpen(false)} className="py-3 text-base font-semibold text-violet">
                  Sign in
                </Link>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
