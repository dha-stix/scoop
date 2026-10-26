import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { getOpenJobIds } from "@/lib/public-jobs";

// Public pages plus every open job, so search engines can find listings.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = await getOpenJobIds();
  return [
    { url: SITE.url, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/jobs`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/auth/register`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE.url}/auth/login`, changeFrequency: "monthly", priority: 0.3 },
    ...jobs.map((j) => ({ url: `${SITE.url}/jobs/${j.id}`, lastModified: j.updatedAt, changeFrequency: "daily" as const, priority: 0.8 })),
  ];
}
