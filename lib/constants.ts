// Shared domain constants: roles, application stages and job options.
import type { ApplicationStatus, Role } from "./types";

export const ROLES = { HR: "hr", CANDIDATE: "candidate" } as const satisfies Record<string, Role>;

export type Tone = "neutral" | "success" | "warning" | "violet" | "danger" | "lime" | "dark" | "outline" | "night" | "glow" | "live";

// The ordered steps every application moves through. Shown in trackers.
export const PIPELINE_STEPS: { id: ApplicationStatus; label: string }[] = [
  { id: "applied", label: "Applied" },
  { id: "reviewed", label: "Reviewed" },
  { id: "shortlisted", label: "Shortlisted" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
  { id: "hired", label: "Hired" },
];

// Every status an application can hold, with how HR sees it.
export const STATUS: Record<ApplicationStatus, { label: string; tone: Tone }> = {
  applied: { label: "New", tone: "neutral" },
  reviewed: { label: "Reviewed", tone: "warning" },
  shortlisted: { label: "Shortlisted", tone: "success" },
  interview: { label: "Interview", tone: "violet" },
  offer: { label: "Offer", tone: "warning" },
  hired: { label: "Hired", tone: "success" },
  rejected: { label: "Not selected", tone: "danger" },
  declined: { label: "Offer declined", tone: "neutral" },
  archived: { label: "Archived", tone: "neutral" },
};

// Candidate-facing wording. Archived reads as "In review" so it never feels like a silent rejection.
export const CANDIDATE_STATUS: Record<ApplicationStatus, { label: string; tone: Tone }> = {
  applied: { label: "Applied", tone: "neutral" },
  reviewed: { label: "In review", tone: "warning" },
  shortlisted: { label: "Shortlisted", tone: "success" },
  interview: { label: "Interview", tone: "violet" },
  offer: { label: "Offer received", tone: "success" },
  hired: { label: "Hired", tone: "success" },
  rejected: { label: "Not selected", tone: "neutral" },
  declined: { label: "Offer declined", tone: "neutral" },
  archived: { label: "In review", tone: "warning" },
};

export const CLOSED_STATUSES: ApplicationStatus[] = ["rejected", "declined", "archived"];

// Tabs on the HR applicants board.
export const APPLICANT_TABS: { id: ApplicationStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "applied", label: "New" },
  { id: "reviewed", label: "Reviewed" },
  { id: "shortlisted", label: "Shortlisted" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
  { id: "hired", label: "Hired" },
  { id: "rejected", label: "Rejected" },
  { id: "archived", label: "Archived" },
];

export const WORK_MODES = ["Remote", "Hybrid", "On-site"];
export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
export const EXPERIENCE_LEVELS = ["Entry level", "Mid level", "Senior", "Lead"];
export const DEPARTMENTS = ["Engineering", "Design", "Product", "Marketing", "Sales", "Operations", "Customer Success", "Finance", "Data", "People"];
export const CURRENCIES = ["USD", "GBP", "EUR", "NGN", "KES", "GHS", "ZAR", "CAD"];
export const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–1000", "1000+"];
export const YEARS_OF_EXPERIENCE = ["0–1", "1–3", "3–5", "5–10", "10+"];

export const CV_MAX_BYTES = 5 * 1024 * 1024;
export const CV_ACCEPT = ".pdf,.doc,.docx";
export const CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const AUTHOR = {
  name: "David Asaolu",
  url: "https://www.linkedin.com/in/david-asaolu234/",
};
