"use client";

import Link from "next/link";
import { useNow } from "@/lib/use-async";
import Logo from "@/components/ui/Logo";
import { AUTHOR } from "@/lib/constants";

const LINKS = [
  { href: "/jobs", label: "Jobs" },
  { href: "/#features", label: "Companies" },
  { href: "/#faq", label: "FAQ" },
  { href: "/auth/register", label: "Get started" },
];

export default function Footer() {
  const now = useNow();
  const year = now ? new Date(now).getFullYear() : null;
  return (
    <footer className="mt-auto border-t border-line py-10">
      <div className="container-page flex flex-col gap-6 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Logo size={26} className="[&_span]:text-lg" />
          <span>© {year} Scoop</span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-6">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <p>
          Built by:{" "}
          <a href={AUTHOR.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-violet underline-offset-4 hover:underline">
            {AUTHOR.name}
          </a>
        </p>
      </div>
    </footer>
  );
}
