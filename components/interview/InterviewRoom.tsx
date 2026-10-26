"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { LayoutGrid, MessageSquare, NotebookPen, PanelRightClose, Rows3, Users } from "lucide-react";
import {
  CallingState,
  CallParticipantsList,
  CallStatsButton,
  CancelCallButton,
  PaginatedGridLayout,
  ReactionsButton,
  RecordCallButton,
  ScreenShareButton,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  ToggleAudioPreviewButton,
  ToggleAudioPublishingButton,
  ToggleVideoPreviewButton,
  ToggleVideoPublishingButton,
  VideoPreview,
  useCallStateHooks,
  type Call,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "@/styles/stream-theme.css";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { LogoMark } from "@/components/ui/Logo";
import Spinner from "@/components/ui/Spinner";
import { useProfile } from "@/components/auth/RequireAuth";
import InterviewChat from "./InterviewChat";
import InterviewNotes from "./InterviewNotes";
import { friendlyError, getStreamCredentials, subscribeToApplication } from "@/lib/supabase-actions";
import { useSubscription } from "@/lib/use-async";
import { formatDateTime } from "@/lib/format";
import type { Application } from "@/lib/types";

type Panel = "chat" | "notes" | "people" | null;

export default function InterviewRoom({ applicationId }: { applicationId: string }) {
  const profile = useProfile();
  const { data: application, loading } = useSubscription<Application | null>((onData, onError) => subscribeToApplication(applicationId, onData, onError), [applicationId]);
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [error, setError] = useState("");

  // Fetch a Stream token from our API, then connect and prepare the call.
  useEffect(() => {
    let videoClient: StreamVideoClient | undefined;
    let videoCall: Call | undefined;
    let cancelled = false;
    getStreamCredentials(applicationId)
      .then(({ apiKey, token, user, callId }) => {
        if (cancelled) return;
        videoClient = new StreamVideoClient({ apiKey, token, user });
        videoCall = videoClient.call("default", callId);
        setClient(videoClient);
        setCall(videoCall);
      })
      .catch((err) => !cancelled && setError(friendlyError(err)));
    return () => {
      cancelled = true;
      videoCall?.leave().catch(() => {});
      videoClient?.disconnectUser().catch(() => {});
    };
  }, [applicationId]);

  if (error) return <RoomMessage title="Can’t open the interview room" text={error} />;
  if (loading || !client || !call || !application) return <RoomMessage loading title="Preparing your interview room…" />;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <StreamTheme className="scoop-call">
          <Room call={call} application={application} isHr={profile.role === "hr"} />
        </StreamTheme>
      </StreamCall>
    </StreamVideo>
  );
}

function Room({ call, application, isHr }: { call: Call; application: Application; isHr: boolean }) {
  const { useCallCallingState } = useCallStateHooks();
  const state = useCallCallingState();
  const [joining, setJoining] = useState(false);

  if (state === CallingState.JOINED) return <LiveCall application={application} isHr={isHr} />;
  if (state === CallingState.LEFT) return <RoomMessage title="You left the interview" text="Thanks for joining." action={{ href: "/dashboard", label: "Back to dashboard" }} />;

  return (
    <Lobby
      application={application}
      isHr={isHr}
      joining={joining || state === CallingState.JOINING}
      onJoin={async () => {
        setJoining(true);
        await call.join().catch(() => setJoining(false));
      }}
    />
  );
}

function Lobby({ application, isHr, joining, onJoin }: { application: Application; isHr: boolean; joining: boolean; onJoin: () => void }) {
  const other = isHr ? application.candidate.name : application.companyName;
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0d1a] px-4 py-10 text-white">
      <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="relative aspect-video overflow-hidden rounded-3xl bg-ink-2 ring-1 ring-ink-3 [&_video]:h-full [&_video]:w-full [&_video]:object-cover">
            <VideoPreview />
          </div>
          <div className="mt-4 flex justify-center gap-3">
            <ToggleAudioPreviewButton />
            <ToggleVideoPreviewButton />
          </div>
        </div>
        <div>
          <Badge tone="glow" pulse>
            Ready when you are
          </Badge>
          <h1 className="mt-4 text-4xl font-extrabold">{application.jobTitle}</h1>
          <p className="mt-2 text-[#b8bdcf]">
            Interview with {other}
            {application.interview && <> · {formatDateTime(application.interview.scheduledAt)}</>}
          </p>
          <ul className="mt-6 space-y-2 text-sm text-[#c3c7d6]">
            <li>• Check your camera and microphone on the left.</li>
            <li>• Use headphones to avoid echo.</li>
            <li>• Chat, screen sharing and reactions are available in the call.</li>
          </ul>
          <Button size="lg" variant="lime" className="mt-8 w-full sm:w-auto" loading={joining} onClick={onJoin}>
            Join interview
          </Button>
        </div>
      </div>
    </div>
  );
}

function CallTimer() {
  const { useCallStartedAt } = useCallStateHooks();
  const startedAt = useCallStartedAt();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const secs = startedAt ? Math.max(0, Math.floor((now - startedAt.getTime()) / 1000)) : 0;
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return <Badge tone="night">{`${mm}:${ss}`}</Badge>;
}

function LiveCall({ application, isHr }: { application: Application; isHr: boolean }) {
  const profile = useProfile();
  const router = useRouter();
  const { useIsCallRecordingInProgress, useParticipantCount } = useCallStateHooks();
  const recording = useIsCallRecordingInProgress();
  const participants = useParticipantCount();
  const [layout, setLayout] = useState<"speaker" | "grid">("speaker");
  const [panel, setPanel] = useState<Panel>("chat");

  const toggle = (p: Panel) => setPanel((cur) => (cur === p ? null : p));
  const panelButton = (p: Exclude<Panel, null>, Icon: typeof Users, label: string) => (
    <button
      type="button"
      aria-label={label}
      aria-pressed={panel === p}
      onClick={() => toggle(p)}
      className={clsx("grid size-[52px] place-items-center rounded-2xl transition hover:-translate-y-0.5", panel === p ? "bg-violet" : "bg-ink-3")}
    >
      <Icon className="size-[22px]" />
    </button>
  );

  return (
    <div className="flex h-screen flex-col bg-[#0a0d1a] text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3.5">
          <LogoMark size={30} />
          <div className="min-w-0">
            <div className="truncate font-bold">Interview · {application.jobTitle}</div>
            <div className="truncate text-xs text-[#9ea3ba]">
              {application.companyName} · {application.candidate.name}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {recording && (
            <Badge tone="live" pulse>
              Recording
            </Badge>
          )}
          <CallTimer />
          <Badge tone="night">{participants} in call</Badge>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:px-6 lg:flex-row">
        <div className="min-h-[320px] min-w-0 flex-1">{layout === "speaker" ? <SpeakerLayout participantsBarPosition="bottom" /> : <PaginatedGridLayout />}</div>
        {panel && (
          <aside className="flex max-h-[45vh] min-h-[300px] w-full flex-col overflow-hidden rounded-[20px] border border-ink-3 bg-[#12162a] lg:max-h-none lg:w-[340px]">
            <div className="flex items-center border-b border-ink-3">
              {(["chat", ...(isHr ? ["notes"] : []), "people"] as Exclude<Panel, null>[]).map((p) => (
                <button key={p} type="button" onClick={() => setPanel(p)} className={clsx("min-h-12 flex-1 text-sm font-semibold capitalize", panel === p ? "text-white shadow-[inset_0_-2px_0_var(--color-lime)]" : "text-[#9ea3ba]")}>
                  {p === "notes" ? "Notes & scorecard" : p}
                </button>
              ))}
              <button type="button" aria-label="Close panel" onClick={() => setPanel(null)} className="grid size-12 place-items-center text-[#9ea3ba] hover:text-white">
                <PanelRightClose className="size-[18px]" />
              </button>
            </div>
            {panel === "chat" && <InterviewChat applicationId={application.id} me={profile} />}
            {panel === "notes" && isHr && <InterviewNotes application={application} />}
            {panel === "people" && (
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                <CallParticipantsList onClose={() => setPanel(null)} />
              </div>
            )}
          </aside>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-center gap-2.5 px-4 pt-2 pb-5">
        <ToggleAudioPublishingButton />
        <ToggleVideoPublishingButton />
        <ScreenShareButton />
        <ReactionsButton />
        {isHr && <RecordCallButton />}
        <CallStatsButton />
        <button
          type="button"
          aria-label={layout === "speaker" ? "Switch to grid layout" : "Switch to speaker layout"}
          onClick={() => setLayout((l) => (l === "speaker" ? "grid" : "speaker"))}
          className="grid size-[52px] place-items-center rounded-2xl bg-ink-3 transition hover:-translate-y-0.5"
        >
          {layout === "speaker" ? <LayoutGrid className="size-[22px]" /> : <Rows3 className="size-[22px]" />}
        </button>
        {panelButton("chat", MessageSquare, "Toggle chat")}
        {isHr && panelButton("notes", NotebookPen, "Toggle notes and scorecard")}
        {panelButton("people", Users, "Toggle participants")}
        <CancelCallButton onLeave={() => router.push(isHr ? `/dashboard/jobs/${application.jobId}/applicants` : `/dashboard/applications/${application.id}`)} />
      </footer>
    </div>
  );
}

function RoomMessage({ title, text, loading, action }: { title: string; text?: string; loading?: boolean; action?: { href: string; label: string } }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0d1a] px-6 text-center text-white">
      {loading ? <Spinner className="size-8 text-lime" /> : <LogoMark size={48} />}
      <h1 className="text-2xl font-bold">{title}</h1>
      {text && <p className="max-w-md text-[#b8bdcf]">{text}</p>}
      {!loading && (
        <Link href={action?.href ?? "/dashboard"} className="mt-2 rounded-full bg-lime px-6 py-3 text-sm font-semibold text-ink">
          {action?.label ?? "Back to dashboard"}
        </Link>
      )}
    </div>
  );
}
