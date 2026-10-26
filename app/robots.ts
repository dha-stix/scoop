import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Public pages are indexable; signed-in areas and auth plumbing are not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/interview", "/api", "/auth/callback", "/auth/reset"] },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
