import { NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";
import { adminAuth, adminDb, isAdminConfigured } from "@/lib/firebase-admin";
import type { Application, ApplicationStatus, UserProfile } from "@/lib/types";

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const SECRET = process.env.STREAM_API_SECRET;
const JOINABLE: ApplicationStatus[] = ["interview", "offer", "hired"];

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

// Issues a Stream video token for one interview. The caller must send their
// Firebase ID token and be the HR owner or the candidate on the application.
export async function POST(request: Request) {
  if (!API_KEY || !SECRET || !isAdminConfigured) {
    return fail("Video interviews aren't configured yet. Add the Stream and Firebase Admin keys.", 503);
  }

  const idToken = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!idToken) return fail("Not signed in.", 401);

  let uid: string;
  try {
    ({ uid } = await adminAuth().verifyIdToken(idToken));
  } catch {
    return fail("Your session expired. Please sign in again.", 401);
  }

  const { applicationId } = (await request.json().catch(() => ({}))) as { applicationId?: string };
  if (!applicationId) return fail("Missing interview id.", 400);

  const snap = await adminDb().collection("applications").doc(applicationId).get();
  if (!snap.exists) return fail("Interview not found.", 404);
  const application = snap.data() as Application;

  if (uid !== application.hrId && uid !== application.candidateId) return fail("You're not part of this interview.", 403);
  if (!JOINABLE.includes(application.status)) return fail("This interview hasn't been scheduled.", 409);

  const hr = ((await adminDb().collection("users").doc(application.hrId).get()).data() ?? {}) as Partial<UserProfile>;
  const hrUser = { id: application.hrId, name: hr.name || application.companyName, image: hr.photoURL || undefined };
  const candidateUser = {
    id: application.candidateId,
    name: application.candidate.name,
    image: application.candidate.photoURL || undefined,
  };

  const client = new StreamClient(API_KEY, SECRET);
  await client.upsertUsers([hrUser, candidateUser]);
  await client.video.call("default", applicationId).getOrCreate({
    data: {
      created_by_id: application.hrId,
      members: [{ user_id: hrUser.id }, { user_id: candidateUser.id }],
      custom: { jobTitle: application.jobTitle, companyName: application.companyName },
    },
  });

  return NextResponse.json({
    apiKey: API_KEY,
    token: client.generateUserToken({ user_id: uid, validity_in_seconds: 60 * 60 * 4 }),
    user: uid === hrUser.id ? hrUser : candidateUser,
    callId: applicationId,
  });
}
