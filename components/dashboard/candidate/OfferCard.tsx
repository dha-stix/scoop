"use client";

import { useState } from "react";
import { PartyPopper } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Alert } from "@/components/ui/Field";
import { friendlyError, respondToOffer } from "@/lib/supabase-actions";
import { formatDate } from "@/lib/format";
import type { Application } from "@/lib/types";

// Lets the candidate accept or decline an offer. The live subscription updates the page after.
export default function OfferCard({ application: a }: { application: Application }) {
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState("");

  async function respond(accept: boolean) {
    setBusy(accept ? "accept" : "decline");
    setError("");
    try {
      await respondToOffer(a.id, accept);
    } catch (err) {
      setError(friendlyError(err));
      setBusy(null);
    }
  }

  return (
    <section className="card border-2 border-success p-5.5">
      <Badge tone="success">
        <PartyPopper className="size-3.5" /> Offer received
      </Badge>
      <h2 className="mt-3 mb-1 text-xl font-bold">
        {a.jobTitle} · {a.companyName}
      </h2>
      {a.offer && (
        <p className="text-sm text-muted">
          {a.offer.salary} · Start {formatDate(a.offer.startDate, { month: "short", day: "numeric", year: "numeric" })}
        </p>
      )}
      {a.offer?.message && <p className="mt-3 rounded-xl bg-mist p-3 text-sm leading-relaxed whitespace-pre-line text-body">{a.offer.message}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="success" loading={busy === "accept"} disabled={!!busy} onClick={() => respond(true)}>
          Accept offer
        </Button>
        <Button variant="secondary" loading={busy === "decline"} disabled={!!busy} onClick={() => respond(false)}>
          Decline
        </Button>
      </div>
      <div className="mt-3">
        <Alert>{error}</Alert>
      </div>
    </section>
  );
}
