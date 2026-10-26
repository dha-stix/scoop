// Small display helpers shared across pages.
import type { DateValue, Job } from "./types";

const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", GBP: "£", EUR: "€", NGN: "₦", KES: "KSh ", GHS: "GH₵", ZAR: "R", CAD: "CA$" };

function compact(n: number) {
  return n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
}

export function formatSalary(job: Pick<Job, "salaryMin" | "salaryMax" | "currency">) {
  if (!job.salaryMin && !job.salaryMax) return "Salary not listed";
  const sym = CURRENCY_SYMBOL[job.currency] ?? `${job.currency} `;
  if (job.salaryMin && job.salaryMax) return `${sym}${compact(job.salaryMin)} – ${sym}${compact(job.salaryMax)}`;
  return `${sym}${compact((job.salaryMin || job.salaryMax) as number)}`;
}

// ISO strings (from Postgres) and Dates both become Dates.
export function toDate(value: DateValue): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export function formatDate(value: DateValue, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  return toDate(value)?.toLocaleDateString(undefined, opts) ?? "";
}

export function formatDateTime(value: DateValue) {
  return (
    toDate(value)?.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) ?? ""
  );
}

// A Date as the local "YYYY-MM-DD" string that <input type="date"> uses.
export function toDateInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// A Date as the local "YYYY-MM-DDTHH:mm" string that <input type="datetime-local"> uses.
export function toDateTimeInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${toDateInputValue(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatTime(value: DateValue) {
  return toDate(value)?.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) ?? "";
}

const UNITS: [string, number][] = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];

export function timeAgo(value: DateValue) {
  const d = toDate(value);
  if (!d) return "just now";
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  for (const [unit, secs] of UNITS) {
    const n = Math.floor(s / secs);
    if (n >= 1) return `${n} ${unit}${n > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

export function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "?";
}

export function firstName(name = "") {
  return name.split(" ")[0] || "there";
}

// Splits a textarea value into trimmed, non-empty lines.
export function toLines(text = "") {
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}
