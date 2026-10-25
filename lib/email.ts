// Candidate emails sent with EmailJS (https://www.emailjs.com).
// Each email type has its own template; every template receives the same
// variables: to_name, to_email, company_name, job_title, message, action_url, from_name.
import emailjs from "@emailjs/browser";
import { formatDateTime } from "./format";
import type { Application, DateValue, Offer } from "./types";

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

const TEMPLATES = {
  applicationReceived: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_APPLICATION,
  interviewInvite: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_INTERVIEW,
  rejection: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_REJECTION,
  offer: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_OFFER,
};

type EmailType = keyof typeof TEMPLATES;
type EmailResult = { sent: true } | { skipped: true };

export const isEmailConfigured = Boolean(SERVICE_ID && PUBLIC_KEY);

const siteUrl = () => (typeof window !== "undefined" ? window.location.origin : "");

async function send(type: EmailType, application: Application, opts: { message: string; path: string; fromName?: string }): Promise<EmailResult> {
  const templateId = TEMPLATES[type];
  if (!SERVICE_ID || !PUBLIC_KEY || !templateId) {
    console.warn(`[Scoopy] EmailJS not configured for "${type}" — email skipped.`);
    return { skipped: true };
  }
  await emailjs.send(
    SERVICE_ID,
    templateId,
    {
      to_name: application.candidate.name,
      to_email: application.candidate.email,
      company_name: application.companyName,
      job_title: application.jobTitle,
      message: opts.message,
      action_url: `${siteUrl()}${opts.path}`,
      from_name: opts.fromName || application.companyName,
    },
    { publicKey: PUBLIC_KEY },
  );
  return { sent: true };
}

export const sendApplicationReceivedEmail = (application: Application) =>
  send("applicationReceived", application, {
    message: `Thanks for applying for ${application.jobTitle} at ${application.companyName}. You can follow every step of your application on Scoopy.`,
    path: `/dashboard/applications/${application.id}`,
  });

export const sendInterviewInviteEmail = (
  application: Application,
  interview: { scheduledAt: DateValue; durationMins: number; message: string },
  fromName?: string,
) =>
  send("interviewInvite", application, {
    message:
      `You're invited to a video interview for ${application.jobTitle} on ${formatDateTime(interview.scheduledAt)} ` +
      `(${interview.durationMins} minutes). Join from your Scoopy dashboard — the room opens 10 minutes before.` +
      (interview.message ? `\n\n${interview.message}` : ""),
    path: `/interview/${application.id}`,
    fromName,
  });

export const sendRejectionEmail = (application: Application, fromName?: string) =>
  send("rejection", application, {
    message:
      `Thank you for your interest in the ${application.jobTitle} role and for the time you put into your application. ` +
      `After careful review, we've decided to move forward with other candidates. We wish you the very best in your search.`,
    path: "/jobs",
    fromName,
  });

export const sendOfferEmail = (application: Application, offer: Omit<Offer, "sentAt">, fromName?: string) =>
  send("offer", application, {
    message:
      `Great news — we'd love you to join us as ${application.jobTitle}. ` +
      `Offer: ${offer.salary}, starting ${offer.startDate}. Review and accept it on Scoopy.` +
      (offer.message ? `\n\n${offer.message}` : ""),
    path: `/dashboard/applications/${application.id}`,
    fromName,
  });
