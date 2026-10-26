"use client";

import {
  archiveApplication,
  deleteApplication,
  friendlyError,
  rejectApplication,
  scheduleInterview,
  sendOffer,
  shortlistApplication,
} from "@/lib/supabase-actions";
import { sendInterviewInviteEmail, sendOfferEmail, sendRejectionEmail, type Sender } from "@/lib/email";
import { firstName } from "@/lib/format";
import type { Application } from "@/lib/types";

type Toast = (message: string, tone?: "success" | "error") => void;

// Every pipeline action HR can take: database update + candidate email + feedback toast.
export function useApplicantActions(sender: Sender, showToast: Toast) {
  async function attempt(work: () => Promise<string>) {
    try {
      showToast(await work());
      return true;
    } catch (err) {
      showToast(friendlyError(err), "error");
      return false;
    }
  }

  const emailNote = (result: object) => ("skipped" in result ? " (email not configured, so none was sent)" : "");

  return {
    shortlist: (apps: Application[]) =>
      attempt(async () => {
        await Promise.all(apps.map((a) => shortlistApplication(a.id)));
        return apps.length === 1 ? `${firstName(apps[0].candidate.name)} shortlisted` : `${apps.length} applicants shortlisted`;
      }),

    reject: (apps: Application[]) =>
      attempt(async () => {
        let skipped = false;
        for (const a of apps) {
          await rejectApplication(a.id);
          const result = await sendRejectionEmail(a, sender).catch(() => ({ skipped: true as const }));
          if ("skipped" in result) skipped = true;
        }
        const who = apps.length === 1 ? firstName(apps[0].candidate.name) : `${apps.length} applicants`;
        return `Rejection sent to ${who}${skipped ? " (email not configured, so none was sent)" : ""}`;
      }),

    archive: (app: Application) =>
      attempt(async () => {
        await archiveApplication(app.id);
        return `${firstName(app.candidate.name)} archived`;
      }),

    remove: (apps: Application[]) =>
      attempt(async () => {
        await Promise.all(apps.map((a) => deleteApplication(a)));
        return apps.length === 1 ? "Application deleted" : `${apps.length} applications deleted`;
      }),

    schedule: (app: Application, input: { scheduledAt: string; durationMins: number; message: string }) =>
      attempt(async () => {
        await scheduleInterview(app, input);
        const result = await sendInterviewInviteEmail(app, { ...input, scheduledAt: new Date(input.scheduledAt) }, sender);
        return `Interview invite sent to ${firstName(app.candidate.name)}${emailNote(result)}`;
      }),

    offer: (app: Application, input: { salary: string; startDate: string; message: string }) =>
      attempt(async () => {
        await sendOffer(app, input);
        const result = await sendOfferEmail(app, input, sender);
        return `Offer sent to ${firstName(app.candidate.name)}${emailNote(result)}`;
      }),
  };
}
