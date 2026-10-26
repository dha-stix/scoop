import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { StreamClient } from "@stream-io/node-sdk";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const STREAM_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const STREAM_SECRET = process.env.STREAM_API_SECRET;
const JOINABLE = ["interview", "offer", "hired"];

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

// Issues a Stream video token for one interview. The caller sends their
// Supabase access token; we query as that user, so row-level security only
// returns the application if they are its candidate or on its hiring team.
export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !STREAM_KEY || !STREAM_SECRET) {
    return fail("Video interviews aren't configured yet. Add the Supabase and Stream keys.", 503);
  }

  const accessToken = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!accessToken) return fail("Not signed in.", 401);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: auth, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !auth.user) return fail("Your session expired. Please sign in again.", 401);
  const uid = auth.user.id;

  const { applicationId } = (await request.json().catch(() => ({}))) as { applicationId?: string };
  if (!applicationId) return fail("Missing interview id.", 400);

  const { data: application } = await supabase
    .from("applications")
    .select("id, hr_id, candidate_id, status, job_title, company_name, candidate")
    .eq("id", applicationId)
    .maybeSingle();
  if (!application) return fail("Interview not found, or you're not part of it.", 404);
  if (!JOINABLE.includes(application.status)) return fail("This interview hasn't been scheduled.", 409);

  const { data: me } = await supabase.from("profiles").select("name, photo_url").eq("id", uid).maybeSingle();
  const { data: hr } = await supabase.from("profiles").select("name, photo_url").eq("id", application.hr_id).maybeSingle();

  const candidate = application.candidate as { name: string; photoURL?: string };
  const people = new Map<string, { id: string; name: string; image?: string }>([
    [application.hr_id, { id: application.hr_id, name: hr?.name || application.company_name, image: hr?.photo_url || undefined }],
    [application.candidate_id, { id: application.candidate_id, name: candidate.name, image: candidate.photoURL || undefined }],
  ]);
  // A colleague of the hiring manager can join too.
  if (!people.has(uid)) people.set(uid, { id: uid, name: me?.name || "Hiring team", image: me?.photo_url || undefined });

  const stream = new StreamClient(STREAM_KEY, STREAM_SECRET);
  await stream.upsertUsers([...people.values()]);
  await stream.video.call("default", applicationId).getOrCreate({
    data: {
      created_by_id: application.hr_id,
      members: [...people.keys()].map((user_id) => ({ user_id })),
      custom: { jobTitle: application.job_title, companyName: application.company_name },
    },
  });

  return NextResponse.json({
    apiKey: STREAM_KEY,
    token: stream.generateUserToken({ user_id: uid, validity_in_seconds: 60 * 60 * 4 }),
    user: people.get(uid),
    callId: applicationId,
  });
}
