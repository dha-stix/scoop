// Site-wide identity used by metadata, link previews, robots and sitemap.

// Absolute base URL for links in previews. Order: an explicit override, then the
// production domain Vercel provides at build time, then the current Vercel
// deployment, then local dev.
function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production}`;
  const deployment = process.env.VERCEL_URL;
  if (deployment) return `https://${deployment}`;
  return "http://localhost:3000";
}

export const SITE = {
  name: "Scoop",
  url: resolveSiteUrl(),
  title: "Scoop — Hire faster. Interview live.",
  tagline: "Hire faster. Interview live.",
  description:
    "Scoop brings job posts, applications, shortlisting and in-app video interviews into one place — so companies hire with less back-and-forth and candidates always know where they stand.",
  keywords: ["jobs", "hiring", "recruitment", "applicant tracking", "video interviews", "job board", "careers"],
  themeColor: "#5B3DF5",
};
