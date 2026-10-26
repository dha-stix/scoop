import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import AuthProvider from "@/components/auth/AuthProvider";
import MotionProvider from "@/components/ui/MotionProvider";
import "@/styles/globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", weight: ["500", "700", "800"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "Scoop — Hire faster. Interview live.", template: "%s · Scoop" },
  description:
    "Scoop brings job posts, applications, shortlisting and in-app video interviews into one place — so companies hire with less back-and-forth and candidates always know where they stand.",
};

export const viewport: Viewport = { themeColor: "#5B3DF5" };

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
