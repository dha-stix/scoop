import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import AuthProvider from "@/components/auth/AuthProvider";
import MotionProvider from "@/components/ui/MotionProvider";
import { SITE } from "@/lib/site";
import { AUTHOR } from "@/lib/constants";
import "@/styles/globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", weight: ["500", "700", "800"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// Link previews: Open Graph covers Facebook, LinkedIn, WhatsApp, Slack, Discord,
// iMessage and Telegram; the Twitter card covers X. The images themselves come
// from app/opengraph-image.tsx and app/twitter-image.tsx (and per job).
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.title, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: SITE.keywords,
  authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
  creator: AUTHOR.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: SITE.themeColor };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${inter.variable}`} data-scroll-behavior="smooth">
      <body className="flex min-h-screen flex-col">
        <MotionProvider>
          <AuthProvider>{children}</AuthProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
