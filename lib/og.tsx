// Shared pieces for generated link-preview images (rendered by next/og).
// next/og lays out with flexbox only: every element with several children needs display:flex.
import type { ReactNode } from "react";

export const OG_SIZE = { width: 1200, height: 630 };

const INK = "#0F1222";
const VIOLET = "#5B3DF5";
const LIME = "#D7F75B";

// The Scoop "hired lens" mark.
export function OgLogo({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34">
      <rect width="34" height="34" rx="10" fill={VIOLET} />
      <circle cx="15.5" cy="15.5" r="7.5" fill="none" stroke="#fff" strokeWidth="3" />
      <path d="M21.2 21.2l4.6 4.6" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M12.2 15.6l2.3 2.3 4.4-4.6" fill="none" stroke={LIME} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Dark branded canvas with the logo top-left and the site address bottom-left.
export function OgFrame({ children, footer }: { children: ReactNode; footer: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background: INK,
        backgroundImage: "radial-gradient(circle at 85% 10%, rgba(91,61,245,0.55), transparent 45%), radial-gradient(circle at 5% 100%, rgba(215,247,91,0.18), transparent 40%)",
        color: "#fff",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <OgLogo />
        <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>scoop</div>
      </div>
      {children}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 24, color: "#B8BDCF" }}>
        <div style={{ display: "flex" }}>{footer}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: LIME }} />
          Live video interviews
        </div>
      </div>
    </div>
  );
}

export function OgPill({ children, tone = "dark" }: { children: ReactNode; tone?: "dark" | "lime" }) {
  return (
    <div
      style={{
        display: "flex",
        padding: "10px 22px",
        borderRadius: 999,
        fontSize: 26,
        fontWeight: 600,
        background: tone === "lime" ? LIME : "rgba(255,255,255,0.1)",
        color: tone === "lime" ? INK : "#fff",
      }}
    >
      {children}
    </div>
  );
}

export const siteHost = (url: string) => url.replace(/^https?:\/\//, "");
