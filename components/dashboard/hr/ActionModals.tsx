"use client";

import { useState, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Field, { Alert } from "@/components/ui/Field";
import { formatSalary, toDateTimeInputValue } from "@/lib/format";
import type { Application, Job } from "@/lib/types";

// datetime-local value for tomorrow at 10:00.
function defaultSlot() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return toDateTimeInputValue(d);
}

type ScheduleInput = { scheduledAt: string; durationMins: number; message: string };

export function ScheduleInterviewModal({ open, onClose, application, onSubmit }: { open: boolean; onClose: () => void; application: Application; onSubmit: (v: ScheduleInput) => Promise<void> }) {
  const [form, setForm] = useState<ScheduleInput>({ scheduledAt: defaultSlot(), durationMins: 45, message: "" });
  // Interviews run from now onwards: earlier today and past days can't be picked.
  const [earliest] = useState(() => toDateTimeInputValue(new Date()));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (new Date(form.scheduledAt).getTime() < Date.now()) return setError("Pick a time from now onwards.");
    setError("");
    setBusy(true);
    await onSubmit(form).finally(() => setBusy(false));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Invite ${application.candidate.name.split(" ")[0]} to interview`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="schedule-form" loading={busy}>
            Send invite
          </Button>
        </>
      }
    >
      <form id="schedule-form" onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date & time" hint="Now or later" type="datetime-local" required min={earliest} value={form.scheduledAt} onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))} />
          <Field label="Duration" as="select" options={["30", "45", "60", "90"]} value={String(form.durationMins)} onChange={(e) => setForm((f) => ({ ...f, durationMins: Number(e.target.value) }))} />
        </div>
        <Field label="Message to candidate" optional as="textarea" value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Anything they should prepare?" />
        <Alert>{error}</Alert>
        <p className="text-[13px] text-muted">They’ll get an email invite and the interview appears on their dashboard with a link to the video room.</p>
      </form>
    </Modal>
  );
}

type OfferInput = { salary: string; startDate: string; message: string };

export function OfferModal({ open, onClose, application, job, onSubmit }: { open: boolean; onClose: () => void; application: Application; job: Job; onSubmit: (v: OfferInput) => Promise<void> }) {
  const [form, setForm] = useState<OfferInput>({ salary: formatSalary(job).replace(" – ", " to "), startDate: "", message: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    await onSubmit(form).finally(() => setBusy(false));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Make an offer to ${application.candidate.name.split(" ")[0]}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="offer-form" variant="success" loading={busy}>
            Send offer
          </Button>
        </>
      }
    >
      <form id="offer-form" onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Salary" required value={form.salary} onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))} placeholder="$105,000 / year" />
          <Field label="Start date" type="date" required value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
        </div>
        <Field label="Note" optional as="textarea" value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="A personal note from the team…" />
      </form>
    </Modal>
  );
}

export function ConfirmModal({
  open,
  onClose,
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "primary"} loading={busy} onClick={() => (setBusy(true), onConfirm().finally(() => setBusy(false)))}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="leading-relaxed text-body">{body}</p>
    </Modal>
  );
}
