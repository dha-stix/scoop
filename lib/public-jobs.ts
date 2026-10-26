// Server-side reads of public job data for link previews and the sitemap.
// Uses the public anon key, so row-level security only ever returns open jobs.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function client() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type JobPreview = {
  id: string;
  title: string;
  companyName: string;
  location: string;
  workMode: string;
  employmentType: string;
  currency: string;
  salaryMin: number | null;
  salaryMax: number | null;
  about: string;
  updatedAt: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getJobPreview(id: string): Promise<JobPreview | null> {
  const supabase = client();
  if (!supabase || !UUID.test(id)) return null;
  const { data } = await supabase
    .from("jobs")
    .select("id, title, company_name, location, work_mode, employment_type, currency, salary_min, salary_max, about, updated_at")
    .eq("id", id)
    .eq("status", "open")
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    title: data.title,
    companyName: data.company_name,
    location: data.location,
    workMode: data.work_mode,
    employmentType: data.employment_type,
    currency: data.currency,
    salaryMin: data.salary_min,
    salaryMax: data.salary_max,
    about: data.about,
    updatedAt: data.updated_at,
  };
}

export async function getOpenJobIds(): Promise<{ id: string; updatedAt: string }[]> {
  const supabase = client();
  if (!supabase) return [];
  const { data } = await supabase.from("jobs").select("id, updated_at").eq("status", "open").order("updated_at", { ascending: false }).limit(1000);
  return (data ?? []).map((j) => ({ id: j.id, updatedAt: j.updated_at }));
}
