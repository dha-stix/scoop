import { ImageResponse } from "next/og";
import { OG_SIZE, OgFrame, OgPill, siteHost } from "@/lib/og";
import { getJobPreview } from "@/lib/public-jobs";
import { formatSalary } from "@/lib/format";
import { SITE } from "@/lib/site";

export const alt = "Job opening on Scoop";
export const size = OG_SIZE;
export const contentType = "image/png";

// Preview card for a shared job link: title, company, location and salary.
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJobPreview(id);
  // A closed or unknown job still gets a tidy card that points people to open roles.
  const title = job?.title ?? "Find your next role";
  const eyebrow = job ? `${job.companyName} is hiring` : "Open jobs on Scoop";
  const initial = (job?.companyName ?? "Scoop").charAt(0).toUpperCase();

  return new ImageResponse(
    (
      <OgFrame footer={`${siteHost(SITE.url)}/jobs`}>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 168,
              height: 168,
              borderRadius: 40,
              background: "#D7F75B",
              color: "#0F1222",
              fontSize: 96,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 820 }}>
            <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#B9A9FF", textTransform: "uppercase", letterSpacing: 3 }}>
              {eyebrow}
            </div>
            <div style={{ display: "flex", fontSize: title.length > 28 ? 64 : 80, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2 }}>{title}</div>
            {job && (
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {[job.location, job.workMode, job.employmentType].filter(Boolean).map((t) => (
                  <OgPill key={t}>{t}</OgPill>
                ))}
                {(job.salaryMin || job.salaryMax) && <OgPill tone="lime">{formatSalary(job)}</OgPill>}
              </div>
            )}
          </div>
        </div>
      </OgFrame>
    ),
    size,
  );
}
