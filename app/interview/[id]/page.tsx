import type { Metadata } from "next";
import { Suspense } from "react";
import InterviewRoomLoader from "@/components/interview/InterviewRoomLoader";
import { PageLoader } from "@/components/ui/Spinner";
import DynamicMarker from "@/components/layout/DynamicMarker";

// Private room: keep it out of search results and link previews' indexes.
export const metadata: Metadata = { title: "Interview room", robots: { index: false, follow: false } };

export default function InterviewPage({ params }: PageProps<"/interview/[id]">) {
  return (
    <>
      <Suspense fallback={<PageLoader label="Opening interview room…" />}>
        {params.then(({ id }) => <InterviewRoomLoader applicationId={id} />)}
      </Suspense>
      <DynamicMarker />
    </>
  );
}
