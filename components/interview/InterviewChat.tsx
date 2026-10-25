"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import clsx from "clsx";
import { SendHorizontal } from "lucide-react";
import { sendInterviewMessage, subscribeToInterviewMessages } from "@/lib/firebase-actions";
import { formatTime } from "@/lib/format";
import type { ChatMessage, UserProfile } from "@/lib/types";

// Text chat stored beside the application, so it stays with the interview record.
export default function InterviewChat({ applicationId, me }: { applicationId: string; me: UserProfile }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeToInterviewMessages(applicationId, setMessages), [applicationId]);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [messages.length]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText("");
    await sendInterviewMessage(applicationId, me, value);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-4" aria-live="polite">
        {messages.length === 0 && <p className="m-auto text-center text-sm text-[#8e94ad]">Messages you send here are visible to everyone in the call.</p>}
        {messages.map((m) => {
          const mine = m.uid === me.id;
          return (
            <div key={m.id} className={clsx("flex max-w-[85%] flex-col gap-1", mine && "self-end items-end")}>
              <span className="text-[11px] text-[#8e94ad]">
                {mine ? "You" : m.name} · {formatTime(m.createdAt)}
              </span>
              <span className={clsx("rounded-2xl px-3 py-2.5 text-sm break-words whitespace-pre-wrap", mine ? "bg-violet" : "bg-ink-3")}>{m.text}</span>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-ink-3 p-3">
        <label className="flex-1">
          <span className="sr-only">Message</span>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Send a message…" className="min-h-11 w-full rounded-xl border border-[#343a58] bg-[#0a0d1a] px-3 text-sm text-white outline-none focus:border-violet" />
        </label>
        <button type="submit" aria-label="Send message" className="grid size-11 place-items-center rounded-xl bg-violet hover:bg-violet-dark">
          <SendHorizontal className="size-[18px]" />
        </button>
      </form>
    </div>
  );
}
