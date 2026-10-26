// Every read and write Scoop makes to Supabase lives here, so pages never talk
// to the database, auth or storage directly. Access control is enforced in the
// database by the row-level security policies and triggers in
// supabase/migrations — these helpers only shape the data.
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured, setRememberMe, CV_BUCKET } from "./supabase";
import type {
  Application,
  ApplicationStatus,
  CandidateDetails,
  ChatMessage,
  Company,
  Job,
  JobInput,
  JobStatus,
  Offer,
  Role,
  Scorecard,
  StreamCredentials,
  UserProfile,
} from "./types";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// An error whose message is already safe to show to the user.
export class ScoopError extends Error {}

function ensureConfigured() {
  if (!isSupabaseConfigured) {
    throw new ScoopError("Supabase isn't connected yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
  }
}

const ERRORS: Record<string, string> = {
  invalid_credentials: "That email and password don't match.",
  user_already_exists: "An account with this email already exists. Try signing in instead.",
  email_exists: "An account with this email already exists. Try signing in instead.",
  email_not_confirmed: "Please confirm your email first — check your inbox for the link.",
  weak_password: "Use a password with at least 8 characters.",
  over_request_rate_limit: "Too many attempts. Please wait a minute and try again.",
  over_email_send_rate_limit: "Too many emails sent. Please wait a minute and try again.",
  "23505": "That already exists.",
  "42501": "You don't have permission to do that.",
};

// Turns any thrown error into a sentence we can show the user.
export function friendlyError(err: unknown): string {
  if (err instanceof ScoopError) return err.message;
  const e = err as { code?: string; message?: string };
  return (e?.code && ERRORS[e.code]) || e?.message || "Something went wrong. Please try again.";
}

// Throws on a Supabase error, otherwise returns the data. (Lists and .single()
// always have data on success; .maybeSingle() can still be null, so callers check.)
function must<T>(result: { data: T | null; error: PostgrestError | null }, messages: Record<string, string> = {}): T {
  if (result.error) {
    const msg = messages[result.error.code];
    throw msg ? new ScoopError(msg) : result.error;
  }
  return result.data as T;
}

// The database uses snake_case; the app uses camelCase.
type Row = Record<string, unknown>;
const camel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const snake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const fromRow = <T>(row: Row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [camel(k), v])) as T;
const toRow = (obj: object) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined).map(([k, v]) => [snake(k), v]));

const siteUrl = () => window.location.origin;

// Fetches once, then refetches whenever a matching row changes (Supabase Realtime).
// Returns an unsubscribe function.
function liveQuery<T>(table: string, filter: string, load: () => Promise<T>, onChange: (value: T) => void, onError?: (err: Error) => void) {
  ensureConfigured();
  let active = true;
  const refresh = () => {
    load()
      .then((value) => active && onChange(value))
      .catch((err) => active && onError?.(err));
  };
  refresh();
  const channel = supabase
    .channel(`${table}:${filter}:${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "*", schema: "public", table, filter }, refresh)
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

/* ------------------------------------------------------------------ */
/* Row mappers                                                         */
/* ------------------------------------------------------------------ */

const PROFILE_SELECT = "*, company:companies(name)";
const APPLICATION_SELECT = "*, review:application_reviews(rating, notes, scorecard)";

function toProfile(row: Row): UserProfile {
  const company = row.company as { name?: string } | null;
  return {
    id: row.id as string,
    role: row.role as Role,
    name: row.name as string,
    email: row.email as string,
    photoURL: (row.photo_url as string) || "",
    companyId: (row.company_id as string) ?? undefined,
    companyName: company?.name,
    jobTitle: row.job_title as string,
    desiredRole: row.desired_role as string,
    location: row.location as string,
    phone: row.phone as string,
    createdAt: row.created_at as string,
  };
}

const toJob = (row: Row): Job => ({ ...fromRow<Job>(row), deadline: (row.deadline as string) ?? "" });

// Form values → columns. An empty deadline is stored as NULL.
function jobToRow(data: Partial<JobInput> & { status?: JobStatus }) {
  return toRow({ ...data, deadline: data.deadline === undefined ? undefined : data.deadline || null });
}

function toApplication(row: Row): Application {
  const { review, ...rest } = row as Row & { review: { rating: number; notes: string; scorecard: Scorecard | null } | null };
  return {
    ...fromRow<Application>(rest),
    rating: review?.rating ?? 0,
    notes: review?.notes ?? "",
    scorecard: review?.scorecard ?? undefined,
    interview: (rest.interview as Application["interview"]) ?? undefined,
    offer: (rest.offer as Application["offer"]) ?? undefined,
  };
}

const toMessage = (row: Row): ChatMessage => ({
  id: row.id as string,
  uid: row.sender_id as string,
  name: row.sender_name as string,
  text: row.body as string,
  createdAt: row.created_at as string,
});

/* ------------------------------------------------------------------ */
/* Users & auth                                                        */
/* ------------------------------------------------------------------ */

export async function getUserProfile(uid: string) {
  ensureConfigured();
  const row = must(await supabase.from("profiles").select(PROFILE_SELECT).eq("id", uid).maybeSingle());
  return row ? toProfile(row) : null;
}

export async function updateUserProfile(uid: string, data: Partial<Pick<UserProfile, "name" | "jobTitle" | "desiredRole" | "location" | "phone">>) {
  ensureConfigured();
  must(await supabase.from("profiles").update(toRow(data)).eq("id", uid));
}

export type SignUpResult = { profile: UserProfile | null; needsConfirmation: boolean };

// Supabase returns no session until the email is confirmed (when "Confirm email" is on),
// and a user with no identities when the email is already registered.
async function finishSignUp(result: Awaited<ReturnType<typeof supabase.auth.signUp>>): Promise<SignUpResult> {
  if (result.error) throw result.error;
  const { user, session } = result.data;
  if (user && user.identities?.length === 0) throw new ScoopError(ERRORS.user_already_exists);
  if (!session || !user) return { profile: null, needsConfirmation: true };
  return { profile: await getUserProfile(user.id), needsConfirmation: false };
}

export interface CompanySignUp {
  name: string;
  email: string;
  password: string;
  companyName: string;
  website: string;
  companySize: string;
  jobTitle: string;
}

// Company HR sign-up: email + password only. A database trigger creates the
// profile and the company from this metadata.
export async function registerCompany(input: CompanySignUp) {
  ensureConfigured();
  setRememberMe(true);
  return finishSignUp(
    await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: `${siteUrl()}/auth/callback?next=/dashboard/jobs/new`,
        data: { role: "hr", name: input.name, company_name: input.companyName, website: input.website, company_size: input.companySize, job_title: input.jobTitle },
      },
    }),
  );
}

export interface CandidateExtras {
  name?: string;
  desiredRole?: string;
  location?: string;
}

export async function registerCandidate(input: CandidateExtras & { email: string; password: string }) {
  ensureConfigured();
  setRememberMe(true);
  return finishSignUp(
    await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: `${siteUrl()}/auth/callback?next=/jobs`,
        data: { role: "candidate", name: input.name, desired_role: input.desiredRole, location: input.location },
      },
    }),
  );
}

const GOOGLE_EXTRAS_KEY = "scoop-google-extras";

// Google is for candidates only. Starts a redirect to Google; the user comes
// back to /auth/callback, which calls completeAuthRedirect().
export async function continueWithGoogle(extra: CandidateExtras = {}, next = "/dashboard") {
  ensureConfigured();
  setRememberMe(true);
  window.sessionStorage.setItem(GOOGLE_EXTRAS_KEY, JSON.stringify(extra));
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`, queryParams: { prompt: "select_account" } },
  });
  if (error) throw error;
  return "redirecting" as const;
}

// How the current session was created ("password", "oauth", "otp"…), from the JWT's amr claim.
function signInMethod(accessToken: string) {
  try {
    const payload = JSON.parse(atob(accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return (payload.amr?.[0]?.method as string) ?? "";
  } catch {
    return "";
  }
}

// Runs on /auth/callback after Google sign-in or an email confirmation link.
export async function completeAuthRedirect() {
  ensureConfigured();
  const params = new URLSearchParams(window.location.search);
  const failure = params.get("error_description");
  if (failure) throw new ScoopError(failure);

  // The client exchanges ?code= for a session on load; getSession waits for that.
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new ScoopError("This sign-in link is invalid or has expired. Please sign in again.");

  const profile = await getUserProfile(data.session.user.id);
  if (!profile) throw new ScoopError("We couldn't find a Scoop profile for this account. Please register first.");

  if (profile.role === "hr" && signInMethod(data.session.access_token) === "oauth") {
    await supabase.auth.signOut();
    throw new ScoopError("Company accounts sign in with email and password.");
  }

  // Details typed on the register form before choosing Google.
  const extras = JSON.parse(window.sessionStorage.getItem(GOOGLE_EXTRAS_KEY) ?? "{}") as CandidateExtras;
  window.sessionStorage.removeItem(GOOGLE_EXTRAS_KEY);
  if (profile.role === "candidate" && ((extras.desiredRole && !profile.desiredRole) || (extras.location && !profile.location))) {
    await updateUserProfile(profile.id, { desiredRole: profile.desiredRole || extras.desiredRole, location: profile.location || extras.location });
  }
  return profile;
}

// Signs in and checks the account matches the chosen tab (HR vs candidate).
// `remember: false` keeps the session only until the browser closes.
export async function signInWithEmail({ email, password, role, remember = true }: { email: string; password: string; role: Role; remember?: boolean }) {
  ensureConfigured();
  setRememberMe(remember);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const profile = await getUserProfile(data.user.id);
  if (!profile) {
    await supabase.auth.signOut();
    throw new ScoopError("We couldn't find a Scoop profile for this account. Please register first.");
  }
  if (profile.role !== role) {
    await supabase.auth.signOut();
    throw new ScoopError(
      profile.role === "hr" ? "This is a company account — switch to “I’m hiring (HR)”." : "This is a candidate account — switch to “I’m a candidate”.",
    );
  }
  return profile;
}

// Sends a reset link that opens /auth/reset.
export async function resetPassword(email: string) {
  ensureConfigured();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl()}/auth/reset` });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  ensureConfigured();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function logOut() {
  if (isSupabaseConfigured) await supabase.auth.signOut();
}

/* ------------------------------------------------------------------ */
/* Companies                                                           */
/* ------------------------------------------------------------------ */

export async function getCompany(companyId: string) {
  ensureConfigured();
  const row = must(await supabase.from("companies").select("*").eq("id", companyId).maybeSingle());
  return row ? fromRow<Company>(row) : null;
}

export async function updateCompany(companyId: string, data: Partial<Pick<Company, "name" | "website" | "size" | "description" | "logoUrl">>) {
  ensureConfigured();
  must(await supabase.from("companies").update(toRow(data)).eq("id", companyId));
}

/* ------------------------------------------------------------------ */
/* Jobs                                                                */
/* ------------------------------------------------------------------ */

export async function createJob(hr: UserProfile, data: JobInput, status: JobStatus = "open") {
  ensureConfigured();
  const row = must<{ id: string }>(
    await supabase
      .from("jobs")
      .insert({ ...jobToRow({ ...data, status }), hr_id: hr.id, company_id: hr.companyId, company_name: hr.companyName })
      .select("id")
      .single(),
  );
  return row.id;
}

export async function updateJob(jobId: string, data: Partial<JobInput> & { status?: JobStatus }) {
  ensureConfigured();
  must(await supabase.from("jobs").update(jobToRow(data)).eq("id", jobId));
}

export const setJobStatus = (jobId: string, status: JobStatus) => updateJob(jobId, { status });

export async function getJob(jobId: string) {
  ensureConfigured();
  const row = must(await supabase.from("jobs").select("*").eq("id", jobId).maybeSingle());
  return row ? toJob(row) : null;
}

export async function getOpenJobs(max = 100) {
  ensureConfigured();
  const rows = must(await supabase.from("jobs").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(max));
  return rows.map(toJob);
}

export async function getCompanyJobs(companyId: string) {
  ensureConfigured();
  const rows = must(await supabase.from("jobs").select("*").eq("company_id", companyId).order("created_at", { ascending: false }));
  return rows.map(toJob);
}

/* ------------------------------------------------------------------ */
/* Applications                                                        */
/* ------------------------------------------------------------------ */

export async function getMyApplicationForJob(jobId: string, uid: string) {
  ensureConfigured();
  const row = must(await supabase.from("applications").select(APPLICATION_SELECT).eq("job_id", jobId).eq("candidate_id", uid).maybeSingle());
  return row ? toApplication(row) : null;
}

export interface ApplicationForm extends Omit<CandidateDetails, "photoURL"> {
  coverLetter: string;
  answers: { prompt: string; answer: string }[];
}

// Uploads the CV to the private "cvs" bucket, then creates the application.
// Job, company and status fields are filled in by a database trigger.
export async function applyToJob({ job, user, form, cvFile }: { job: Job; user: UserProfile; form: ApplicationForm; cvFile: File }) {
  ensureConfigured();
  if (await getMyApplicationForJob(job.id, user.id)) throw new ScoopError("You've already applied to this job.");

  const cvPath = `${user.id}/${job.id}/${crypto.randomUUID()}_${cvFile.name.replace(/[^\w.\-]+/g, "_")}`;
  const upload = await supabase.storage.from(CV_BUCKET).upload(cvPath, cvFile, { contentType: cvFile.type, upsert: false });
  if (upload.error) throw upload.error;

  const { coverLetter, answers, ...details } = form;
  const result = await supabase
    .from("applications")
    .insert({
      job_id: job.id,
      candidate_id: user.id,
      candidate: { ...details, photoURL: user.photoURL || "" },
      cv_path: cvPath,
      cv_name: cvFile.name,
      cover_letter: coverLetter,
      answers,
    })
    .select("id")
    .single();

  if (result.error) await supabase.storage.from(CV_BUCKET).remove([cvPath]);
  return must(result, { "23505": "You've already applied to this job." }).id as string;
}

export async function getApplication(id: string) {
  ensureConfigured();
  const row = must(await supabase.from("applications").select(APPLICATION_SELECT).eq("id", id).maybeSingle());
  return row ? toApplication(row) : null;
}

async function listApplications(column: "job_id" | "candidate_id" | "company_id", value: string) {
  const rows = must(await supabase.from("applications").select(APPLICATION_SELECT).eq(column, value).order("created_at", { ascending: false }));
  return rows.map(toApplication);
}

type OnError = (err: Error) => void;

// Live updates for trackers and the HR board. Each returns an unsubscribe fn.
export const subscribeToApplication = (id: string, onChange: (a: Application | null) => void, onError?: OnError) =>
  liveQuery("applications", `id=eq.${id}`, () => getApplication(id), onChange, onError);

export const subscribeToJobApplications = (jobId: string, onChange: (a: Application[]) => void, onError?: OnError) =>
  liveQuery("applications", `job_id=eq.${jobId}`, () => listApplications("job_id", jobId), onChange, onError);

export const subscribeToCandidateApplications = (uid: string, onChange: (a: Application[]) => void, onError?: OnError) =>
  liveQuery("applications", `candidate_id=eq.${uid}`, () => listApplications("candidate_id", uid), onChange, onError);

export async function getCompanyApplications(companyId: string) {
  ensureConfigured();
  return listApplications("company_id", companyId);
}

// The database appends each status change to `history` and blocks changes the caller isn't allowed to make.
export async function updateApplicationStatus(id: string, status: ApplicationStatus, extra: { interview?: object; offer?: object } = {}) {
  ensureConfigured();
  const rows = must(await supabase.from("applications").update({ status, ...extra }).eq("id", id).select("id"));
  if (!rows.length) throw new ScoopError(ERRORS["42501"]);
}

// Opening an application moves it from "New" to "Reviewed" exactly once.
export async function markReviewed(application: Application) {
  if (application.status === "applied") await updateApplicationStatus(application.id, "reviewed");
}

// scheduledAt is the slot HR picked; the database adds invitedAt with its own clock.
export async function scheduleInterview(application: Application, input: { scheduledAt: string; durationMins: number; message: string }) {
  await updateApplicationStatus(application.id, "interview", {
    interview: {
      callId: application.id,
      scheduledAt: new Date(input.scheduledAt).toISOString(),
      durationMins: Number(input.durationMins),
      message: input.message,
    },
  });
}

// The database stamps sentAt with its own clock.
export async function sendOffer(application: Application, offer: Omit<Offer, "sentAt">) {
  await updateApplicationStatus(application.id, "offer", { offer });
}

export const shortlistApplication = (id: string) => updateApplicationStatus(id, "shortlisted");
export const rejectApplication = (id: string) => updateApplicationStatus(id, "rejected");
export const archiveApplication = (id: string) => updateApplicationStatus(id, "archived");

// Candidate accepts or declines an offer.
export const respondToOffer = (id: string, accept: boolean) => updateApplicationStatus(id, accept ? "hired" : "declined");

// HR-only rating, notes and scorecard (stored apart from what the candidate can read).
export async function saveReview(application: Application, data: { notes?: string; rating?: number; scorecard?: Scorecard }) {
  ensureConfigured();
  must(
    await supabase
      .from("application_reviews")
      .upsert({ application_id: application.id, company_id: application.companyId, ...data }, { onConflict: "application_id" }),
  );
}

export async function deleteApplication(application: Application) {
  ensureConfigured();
  // Remove the CV first: the storage policy checks the application still exists.
  if (application.cvPath) await supabase.storage.from(CV_BUCKET).remove([application.cvPath]);
  must(await supabase.from("applications").delete().eq("id", application.id));
}

// CVs are private, so links are short-lived signed URLs.
export async function getCvUrl(cvPath: string) {
  ensureConfigured();
  const { data, error } = await supabase.storage.from(CV_BUCKET).createSignedUrl(cvPath, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

/* ------------------------------------------------------------------ */
/* Interview chat                                                      */
/* ------------------------------------------------------------------ */

export async function sendInterviewMessage(applicationId: string, user: UserProfile, text: string) {
  ensureConfigured();
  must(await supabase.from("interview_messages").insert({ application_id: applicationId, sender_id: user.id, sender_name: user.name, body: text.slice(0, 2000) }));
}

export function subscribeToInterviewMessages(applicationId: string, onChange: (m: ChatMessage[]) => void) {
  return liveQuery(
    "interview_messages",
    `application_id=eq.${applicationId}`,
    async () => {
      const rows = must(await supabase.from("interview_messages").select("*").eq("application_id", applicationId).order("created_at").limit(200));
      return rows.map(toMessage);
    },
    onChange,
  );
}

/* ------------------------------------------------------------------ */
/* Stream video                                                        */
/* ------------------------------------------------------------------ */

// Asks our API route for a Stream token. The route checks the Supabase access
// token and that the caller belongs to this interview.
export async function getStreamCredentials(applicationId: string): Promise<StreamCredentials> {
  ensureConfigured();
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new ScoopError("Please sign in to join the interview.");
  const res = await fetch("/api/stream-token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ applicationId }),
  });
  const body = await res.json();
  if (!res.ok) throw new ScoopError(body.error || "Couldn't join the interview room.");
  return body;
}
