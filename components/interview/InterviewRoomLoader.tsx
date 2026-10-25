"use client";

import dynamic from "next/dynamic";
import RequireAuth from "@/components/auth/RequireAuth";
import { PageLoader } from "@/components/ui/Spinner";

// The Stream SDK needs browser APIs (camera, WebRTC), so it only loads on the client.
const InterviewRoom = dynamic(() => import("./InterviewRoom"), { ssr: false, loading: () => <PageLoader label="Loading video…" /> });

export default function InterviewRoomLoader({ applicationId }: { applicationId: string }) {
  return (
    <RequireAuth>
      <InterviewRoom applicationId={applicationId} />
    </RequireAuth>
  );
}
