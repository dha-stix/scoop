// Candidate emails sent with EmailJS (https://www.emailjs.com).
//
// One branded template (emails/scoop-notification.html) serves every email:
// Scoop fills in the subject, heading, body, details and button per email type.
// Point NEXT_PUBLIC_EMAILJS_TEMPLATE_ID at it, or give a type its own template
// with the per-type variables below. Setup guide: emails/README.md.
import emailjs from "@emailjs/browser";
import { formatDate, formatDateTime, toDate } from "./format";
import type { Application, DateValue, Offer } from "./types";

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
const SHARED_TEMPLATE = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;

const TEMPLATES = {
  applicationReceived: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_APPLICATION || SHARED_TEMPLATE,
  interviewInvite: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_INTERVIEW || SHARED_TEMPLATE,
  rejection: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_REJECTION || SHARED_TEMPLATE,
  offer: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_OFFER || SHARED_TEMPLATE,
};

type EmailType = keyof typeof TEMPLATES;
type EmailResult = { sent: true } | { skipped: true };

// Who is sending: shown as the sender name, and replies go to them.
export type Sender = { name: string; email?: string };

export const isEmailConfigured = Boolean(SERVICE_ID && PUBLIC_KEY && Object.values(TEMPLATES).some(Boolean));

const siteUrl = () => (typeof window !== "undefined" ? window.location.origin : "");

/* ------------------------------------------------------------------ */
/* Safe HTML building (the template inserts these with {{{triple}}} braces) */
/* ------------------------------------------------------------------ */

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// Plain text → paragraphs, keeping single line breaks.
const paragraphs = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3A4055;">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

// Label/value rows in a tinted box (interview time, offer salary…).
const detailsBox = (rows: [string, string][]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;background:#F6F7FB;border-radius:14px;">` +
  rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:12px 18px;font-size:13px;color:#5A6072;width:38%;">${escapeHtml(label)}</td>` +
        `<td style="padding:12px 18px;font-size:15px;font-weight:600;color:#0F1222;">${escapeHtml(value)}</td></tr>`,
    )
    .join("") +
  `</table>`;

// A personal note from the hiring team, quoted.
const noteBox = (note: string, from: string) =>
  note.trim()
    ? `<div style="margin:0 0 24px;padding:16px 18px;border-left:4px solid #D7F75B;background:#FBFDF2;border-radius:0 12px 12px 0;">` +
      `<div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#5A6072;margin-bottom:6px;">A note from ${escapeHtml(from)}</div>` +
      `<div style="font-size:15px;line-height:1.6;color:#0F1222;">${escapeHtml(note.trim()).replace(/\n/g, "<br>")}</div></div>`
    : "";

// Short time-zone label for a given moment (so a date across a DST change gets the right one).
function zoneName(value: DateValue) {
  const date = toDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat(undefined, { timeZoneName: "short" }).formatToParts(date).find((p) => p.type === "timeZoneName")?.value ?? "";
}

/* ------------------------------------------------------------------ */
/* Sending                                                             */
/* ------------------------------------------------------------------ */

type Content = {
  subject: string;
  preheader: string; // inbox preview text
  heading: string;
  body: string; // plain text; blank lines start new paragraphs
  details?: [string, string][];
  note?: string;
  buttonLabel: string;
  path: string;
  accent?: string;
};

async function send(type: EmailType, application: Application, content: Content, sender?: Sender): Promise<EmailResult> {
  const templateId = TEMPLATES[type];
  if (!SERVICE_ID || !PUBLIC_KEY || !templateId) {
    console.warn(`[Scoop] EmailJS not configured for "${type}" — email skipped.`);
    return { skipped: true };
  }
  const fromName = sender?.name ? `${sender.name} at ${application.companyName}` : application.companyName;

  await emailjs.send(
    SERVICE_ID,
    templateId,
    {
      // Addressing
      to_name: application.candidate.name,
      to_email: application.candidate.email,
      from_name: fromName,
      reply_to: sender?.email || "",
      // Content
      email_type: type,
      subject: content.subject,
      preheader: content.preheader,
      heading: content.heading,
      first_name: application.candidate.name.split(" ")[0] || "there",
      company_name: application.companyName,
      job_title: application.jobTitle,
      message: content.body, // plain-text copy, for text-only templates
      message_html: paragraphs(content.body),
      details_html: content.details?.length ? detailsBox(content.details) : "",
      note_html: noteBox(content.note ?? "", fromName),
      button_label: content.buttonLabel,
      action_url: `${siteUrl()}${content.path}`,
      accent_color: content.accent ?? "#5B3DF5",
      site_url: siteUrl(),
    },
    { publicKey: PUBLIC_KEY },
  );
  return { sent: true };
}

export const sendApplicationReceivedEmail = (application: Application) =>
  send("applicationReceived", application, {
    subject: `We received your application for ${application.jobTitle}`,
    preheader: `Thanks for applying to ${application.companyName} — here's what happens next.`,
    heading: "Your application is in",
    body:
      `Thanks for applying for the ${application.jobTitle} role at ${application.companyName}. Your CV and details have reached the hiring team.\n\n` +
      `You can follow every step on Scoop — you'll see the moment your application is reviewed, shortlisted or moved to interview.`,
    details: [
      ["Role", application.jobTitle],
      ["Company", application.companyName],
      ["Status", "Applied"],
    ],
    buttonLabel: "Track your application",
    path: `/dashboard/applications/${application.id}`,
  });

export const sendInterviewInviteEmail = (
  application: Application,
  interview: { scheduledAt: DateValue; durationMins: number; message: string },
  sender?: Sender,
) =>
  send(
    "interviewInvite",
    application,
    {
      subject: `Interview invitation: ${application.jobTitle} at ${application.companyName}`,
      preheader: `You're invited to a video interview on ${formatDateTime(interview.scheduledAt)}.`,
      heading: "You're invited to interview",
      body:
        `Good news — the ${application.companyName} team would like to meet you for the ${application.jobTitle} role.\n\n` +
        `The interview happens on a video call right inside Scoop, so there's nothing to install. The room opens 10 minutes before the start time — use the button below to join, and allow camera and microphone access when asked.`,
      details: [
        ["When", `${formatDateTime(interview.scheduledAt)} ${zoneName(interview.scheduledAt)}`.trim()],
        ["Length", `${interview.durationMins} minutes`],
        ["Where", "Scoop video room (link below)"],
      ],
      note: interview.message,
      buttonLabel: "Join the interview room",
      path: `/interview/${application.id}`,
    },
    sender,
  );

export const sendRejectionEmail = (application: Application, sender?: Sender) =>
  send(
    "rejection",
    application,
    {
      subject: `Your application for ${application.jobTitle} at ${application.companyName}`,
      preheader: `An update on your ${application.jobTitle} application.`,
      heading: "Thank you for applying",
      body:
        `Thank you for your interest in the ${application.jobTitle} role at ${application.companyName}, and for the time you put into your application.\n\n` +
        `After careful review, the team has decided to move forward with other candidates for this position. This was a difficult decision, and it isn't a reflection of your potential.\n\n` +
        `We'd encourage you to keep an eye on new roles — there are more opportunities on Scoop every week.`,
      buttonLabel: "Browse open roles",
      path: "/jobs",
      accent: "#0F1222",
    },
    sender,
  );

export const sendOfferEmail = (application: Application, offer: Omit<Offer, "sentAt">, sender?: Sender) =>
  send(
    "offer",
    application,
    {
      subject: `Your job offer from ${application.companyName} 🎉`,
      preheader: `${application.companyName} would love you to join as ${application.jobTitle}.`,
      heading: "You've got an offer!",
      body:
        `Congratulations — ${application.companyName} would love you to join the team as ${application.jobTitle}.\n\n` +
        `Review the details below, then accept or decline the offer on Scoop. If you have any questions, just reply to this email.`,
      details: [
        ["Role", application.jobTitle],
        ["Salary", offer.salary],
        ["Start date", formatDate(offer.startDate, { weekday: "short", month: "long", day: "numeric", year: "numeric" })],
      ],
      note: offer.message,
      buttonLabel: "Review and accept your offer",
      path: `/dashboard/applications/${application.id}`,
      accent: "#1A9F5B",
    },
    sender,
  );
