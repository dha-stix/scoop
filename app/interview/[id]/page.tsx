import type { Metadata } from "next";
import { Suspense } from "react";
import InterviewRoomLoader from "@/components/interview/InterviewRoomLoader";
import { PageLoader } from "@/components/ui/Spinner";

export const metadata: Metadata = { title: "Interview room" };

export default function InterviewPage({ params }: PageProps<"/interview/[id]">) {
  return (
    <Suspense fallback={<PageLoader label="Opening interview room…" />}>
      {params.then(({ id }) => <InterviewRoomLoader applicationId={id} />)}
    </Suspense>
  );
}
