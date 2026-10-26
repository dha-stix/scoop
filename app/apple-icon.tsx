import { ImageResponse } from "next/og";
import { OgLogo } from "@/lib/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Home-screen / iOS share icon: the lens mark on brand violet.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#5B3DF5" }}>
        <OgLogo size={180} />
      </div>
    ),
    size,
  );
}
