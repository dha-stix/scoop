"use client";

import { getCvUrl } from "@/lib/supabase-actions";
import { useAsync } from "@/lib/use-async";

// CVs live in a private bucket; this fetches a short-lived signed link to one.
export function useCvUrl(cvPath: string | undefined) {
  const { data } = useAsync(async () => (cvPath ? getCvUrl(cvPath) : null), [cvPath]);
  return data;
}
