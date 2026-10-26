import { ImageResponse } from "next/og";
import { OG_SIZE, OgFrame, OgPill, siteHost } from "@/lib/og";
import { SITE } from "@/lib/site";

export const alt = "Scoop — Hire faster. Interview live. Job posts, applications and video interviews in one place.";
export const size = OG_SIZE;
export const contentType = "image/png";

// The preview card shown when scoop's homepage (or any page without its own image) is shared.
export default function Image() {
  return new ImageResponse(
    (
      <OgFrame footer={siteHost(SITE.url)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 92, fontWeight: 800, lineHeight: 1.02, letterSpacing: -3 }}>
            <div style={{ display: "flex" }}>Hire faster.</div>
            <div style={{ display: "flex" }}>
              Interview live.{" "}
              <span style={{ marginLeft: 24, padding: "0 18px", borderRadius: 18, background: "#D7F75B", color: "#0F1222" }}>One scoop.</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <OgPill>Post jobs</OgPill>
            <OgPill>Shortlist</OgPill>
            <OgPill>Interview on video</OgPill>
            <OgPill tone="lime">Make the offer</OgPill>
          </div>
        </div>
      </OgFrame>
    ),
    size,
  );
}
