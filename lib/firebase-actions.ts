// Every read and write Scoopy makes to Firebase lives here, so pages never talk
// to Firestore/Auth/Storage directly. Access control is enforced server-side by
// firestore.rules and storage.rules — these helpers only shape the data.
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  writeBatch,
  Timestamp,
  type DocumentSnapshot,
  type QuerySnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { auth, db, storage, googleProvider, isFirebaseConfigured } from "./firebase";
import { ROLES } from "./constants";
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
export class ScoopyError extends Error {}

function ensureConfigured() {
  if (!isFirebaseConfigured) {
    throw new ScoopyError("Firebase isn't connected yet. Add your NEXT_PUBLIC_FIREBASE_* keys to .env.local.");
  }
}

const withId = <T>(snap: DocumentSnapshot) => ({ id: snap.id, ...snap.data() }) as T;
const listOf = <T>(snap: QuerySnapshot) => snap.docs.map((d) => withId<T>(d));

const AUTH_ERRORS: Record<string, string> = {
  "auth/email-already-in-use": "An account with this email already exists. Try signing in instead.",
  "auth/invalid-credential": "That email and password don't match.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/weak-password": "Use a password with at least 8 characters.",
  "auth/user-not-found": "No account found with that email.",
  "auth/wrong-password": "That email and password don't match.",
  "auth/too-many-requests": "Too many attempts. Please wait a minute and try again.",
  "auth/popup-closed-by-user": "The Google window was closed before signing in.",
  "auth/network-request-failed": "Network error — check your connection.",
  "permission-denied": "You don't have permission to do that.",
};

// Turns any thrown error into a sentence we can show the user.
export function friendlyError(err: unknown): string {
  if (err instanceof ScoopyError) return err.message;
  const e = err as { code?: string; message?: string };
  return (e?.code && AUTH_ERRORS[e.code]) || e?.message || "Something went wrong. Please try again.";
}

/* ------------------------------------------------------------------ */
/* Users & auth                                                        */
/* ------------------------------------------------------------------ */

export async function getUserProfile(uid: string) {
  ensureConfigured();
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? withId<UserProfile>(snap) : null;
}

export async function updateUserProfile(uid: string, data: Partial<Omit<UserProfile, "id" | "role">>) {
  ensureConfigured();
  await updateDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() });
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

// Company HR sign-up: email + password only, and creates the company too.
export async function registerCompany(input: CompanySignUp) {
  ensureConfigured();
  const { user } = await createUserWithEmailAndPassword(auth, input.email, input.password);
  await updateProfile(user, { displayName: input.name });

  const companyRef = doc(collection(db, "companies"));
  const batch = writeBatch(db);
  batch.set(companyRef, {
    name: input.companyName,
    website: input.website,
    size: input.companySize,
    description: "",
    ownerId: user.uid,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, "users", user.uid), {
    role: ROLES.HR,
    name: input.name,
    email: input.email,
    jobTitle: input.jobTitle,
    companyId: companyRef.id,
    companyName: input.companyName,
    photoURL: "",
    createdAt: serverTimestamp(),
  });
  await batch.commit();
  await sendEmailVerification(user).catch(() => {});
  return getUserProfile(user.uid);
}

export interface CandidateExtras {
  name?: string;
  desiredRole?: string;
  location?: string;
}

function candidateProfile(user: User, extra: CandidateExtras) {
  return {
    role: ROLES.CANDIDATE,
    name: extra.name || user.displayName || "",
    email: user.email,
    photoURL: user.photoURL || "",
    desiredRole: extra.desiredRole || "",
    location: extra.location || "",
    phone: "",
    createdAt: serverTimestamp(),
  };
}

export async function registerCandidate(input: CandidateExtras & { email: string; password: string }) {
  ensureConfigured();
  const { user } = await createUserWithEmailAndPassword(auth, input.email, input.password);
  await updateProfile(user, { displayName: input.name });
  await setDoc(doc(db, "users", user.uid), candidateProfile(user, input));
  await sendEmailVerification(user).catch(() => {});
  return getUserProfile(user.uid);
}

// Google is for candidates only. A company account trying it is signed out again.
export async function continueWithGoogle(extra: CandidateExtras = {}) {
  ensureConfigured();
  const { user } = await signInWithPopup(auth, googleProvider);
  const existing = await getUserProfile(user.uid);
  if (existing?.role === ROLES.HR) {
    await signOut(auth);
    throw new ScoopyError("Company accounts sign in with email and password.");
  }
  if (existing) return existing;
  await setDoc(doc(db, "users", user.uid), candidateProfile(user, extra));
  return getUserProfile(user.uid);
}

// Signs in and checks the account matches the chosen tab (HR vs candidate).
// `remember: false` keeps the session only until the browser tab closes.
export async function signInWithEmail({ email, password, role, remember = true }: { email: string; password: string; role: Role; remember?: boolean }) {
  ensureConfigured();
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getUserProfile(user.uid);
  if (!profile) {
    await signOut(auth);
    throw new ScoopyError("We couldn't find a Scoopy profile for this account. Please register first.");
  }
  if (profile.role !== role) {
    await signOut(auth);
    throw new ScoopyError(
      profile.role === ROLES.HR
        ? "This is a company account — switch to “I’m hiring (HR)”."
        : "This is a candidate account — switch to “I’m a candidate”.",
    );
  }
  return profile;
}

export async function resetPassword(email: string) {
  ensureConfigured();
  await sendPasswordResetEmail(auth, email);
}

export async function logOut() {
  if (isFirebaseConfigured) await signOut(auth);
}

/* ------------------------------------------------------------------ */
/* Companies                                                           */
/* ------------------------------------------------------------------ */

export async function getCompany(companyId: string) {
  ensureConfigured();
  const snap = await getDoc(doc(db, "companies", companyId));
  return snap.exists() ? withId<Company>(snap) : null;
}

export async function updateCompany(companyId: string, data: Partial<Omit<Company, "id" | "ownerId">>) {
  ensureConfigured();
  await updateDoc(doc(db, "companies", companyId), { ...data, updatedAt: serverTimestamp() });
}

/* ------------------------------------------------------------------ */
/* Jobs                                                                */
/* ------------------------------------------------------------------ */

export async function createJob(hr: UserProfile, data: JobInput, status: JobStatus = "open") {
  ensureConfigured();
  const jobRef = await addDoc(collection(db, "jobs"), {
    ...data,
    status,
    hrId: hr.id,
    companyId: hr.companyId,
    companyName: hr.companyName,
    applicantCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return jobRef.id;
}

export async function updateJob(jobId: string, data: Partial<JobInput> & { status?: JobStatus }) {
  ensureConfigured();
  await updateDoc(doc(db, "jobs", jobId), { ...data, updatedAt: serverTimestamp() });
}

export const setJobStatus = (jobId: string, status: JobStatus) => updateJob(jobId, { status });

export async function getJob(jobId: string) {
  ensureConfigured();
  const snap = await getDoc(doc(db, "jobs", jobId));
  return snap.exists() ? withId<Job>(snap) : null;
}

export async function getOpenJobs(max = 100) {
  ensureConfigured();
  const q = query(collection(db, "jobs"), where("status", "==", "open"), orderBy("createdAt", "desc"), limit(max));
  return listOf<Job>(await getDocs(q));
}

export async function getCompanyJobs(companyId: string) {
  ensureConfigured();
  const q = query(collection(db, "jobs"), where("companyId", "==", companyId), orderBy("createdAt", "desc"));
  return listOf<Job>(await getDocs(q));
}

/* ------------------------------------------------------------------ */
/* Applications                                                        */
/* ------------------------------------------------------------------ */

// One application per candidate per job, so the id is predictable.
const applicationId = (jobId: string, uid: string) => `${jobId}_${uid}`;

const historyEntry = (status: ApplicationStatus) => ({ status, at: Timestamp.now() });

export async function getMyApplicationForJob(jobId: string, uid: string) {
  ensureConfigured();
  const snap = await getDoc(doc(db, "applications", applicationId(jobId, uid)));
  return snap.exists() ? withId<Application>(snap) : null;
}

async function uploadCv(uid: string, jobId: string, file: File) {
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `cvs/${uid}/${jobId}/${Date.now()}_${safeName}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file, { contentType: file.type });
  return { cvPath: path, cvUrl: await getDownloadURL(fileRef), cvName: file.name };
}

export interface ApplicationForm extends Omit<CandidateDetails, "photoURL"> {
  coverLetter: string;
  answers: { prompt: string; answer: string }[];
}

export async function applyToJob({ job, user, form, cvFile }: { job: Job; user: UserProfile; form: ApplicationForm; cvFile: File }) {
  ensureConfigured();
  const id = applicationId(job.id, user.id);
  const existing = await getDoc(doc(db, "applications", id));
  if (existing.exists()) throw new ScoopyError("You've already applied to this job.");

  const { coverLetter, answers, ...details } = form;
  const cv = await uploadCv(user.id, job.id, cvFile);
  await setDoc(doc(db, "applications", id), {
    jobId: job.id,
    jobTitle: job.title,
    jobLocation: job.location,
    workMode: job.workMode,
    companyId: job.companyId,
    companyName: job.companyName,
    hrId: job.hrId,
    candidateId: user.id,
    candidate: { ...details, photoURL: user.photoURL || "" },
    ...cv,
    coverLetter,
    answers,
    status: "applied",
    history: [historyEntry("applied")],
    rating: 0,
    notes: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "jobs", job.id), { applicantCount: increment(1) });
  return id;
}

export async function getApplication(id: string) {
  ensureConfigured();
  const snap = await getDoc(doc(db, "applications", id));
  return snap.exists() ? withId<Application>(snap) : null;
}

type OnError = (err: Error) => void;

// Live updates for trackers and the HR board. Each returns an unsubscribe fn.
export function subscribeToApplication(id: string, onChange: (a: Application | null) => void, onError?: OnError) {
  ensureConfigured();
  return onSnapshot(doc(db, "applications", id), (snap) => onChange(snap.exists() ? withId<Application>(snap) : null), onError);
}

export function subscribeToJobApplications(jobId: string, onChange: (a: Application[]) => void, onError?: OnError) {
  ensureConfigured();
  const q = query(collection(db, "applications"), where("jobId", "==", jobId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => onChange(listOf<Application>(snap)), onError);
}

export function subscribeToCandidateApplications(uid: string, onChange: (a: Application[]) => void, onError?: OnError) {
  ensureConfigured();
  const q = query(collection(db, "applications"), where("candidateId", "==", uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => onChange(listOf<Application>(snap)), onError);
}

export async function getCompanyApplications(companyId: string) {
  ensureConfigured();
  const q = query(collection(db, "applications"), where("companyId", "==", companyId), orderBy("createdAt", "desc"));
  return listOf<Application>(await getDocs(q));
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus, extra: Record<string, unknown> = {}) {
  ensureConfigured();
  await updateDoc(doc(db, "applications", id), {
    ...extra,
    status,
    history: arrayUnion(historyEntry(status)),
    updatedAt: serverTimestamp(),
  });
}

// Opening an application moves it from "New" to "Reviewed" exactly once.
export async function markReviewed(application: Application) {
  if (application.status === "applied") await updateApplicationStatus(application.id, "reviewed");
}

export async function scheduleInterview(application: Application, input: { scheduledAt: string; durationMins: number; message: string }) {
  await updateApplicationStatus(application.id, "interview", {
    interview: {
      callId: application.id,
      scheduledAt: Timestamp.fromDate(new Date(input.scheduledAt)),
      durationMins: Number(input.durationMins),
      message: input.message,
    },
  });
}

export async function sendOffer(application: Application, offer: Omit<Offer, "sentAt">) {
  await updateApplicationStatus(application.id, "offer", { offer: { ...offer, sentAt: Timestamp.now() } });
}

export const shortlistApplication = (id: string) => updateApplicationStatus(id, "shortlisted");
export const rejectApplication = (id: string) => updateApplicationStatus(id, "rejected");
export const archiveApplication = (id: string) => updateApplicationStatus(id, "archived");

// Candidate accepts or declines an offer.
export const respondToOffer = (id: string, accept: boolean) => updateApplicationStatus(id, accept ? "hired" : "declined");

export async function saveReview(id: string, data: { notes?: string; rating?: number; scorecard?: Scorecard }) {
  ensureConfigured();
  await updateDoc(doc(db, "applications", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteApplication(application: Application) {
  ensureConfigured();
  if (application.cvPath) await deleteObject(ref(storage, application.cvPath)).catch(() => {});
  await deleteDoc(doc(db, "applications", application.id));
  await updateDoc(doc(db, "jobs", application.jobId), { applicantCount: increment(-1) });
}

/* ------------------------------------------------------------------ */
/* Interview chat (stored beside the application)                       */
/* ------------------------------------------------------------------ */

export async function sendInterviewMessage(applicationId: string, user: UserProfile, text: string) {
  ensureConfigured();
  await addDoc(collection(db, "applications", applicationId, "messages"), {
    uid: user.id,
    name: user.name,
    text: text.slice(0, 2000),
    createdAt: serverTimestamp(),
  });
}

export function subscribeToInterviewMessages(applicationId: string, onChange: (m: ChatMessage[]) => void) {
  ensureConfigured();
  const q = query(collection(db, "applications", applicationId, "messages"), orderBy("createdAt", "asc"), limit(200));
  return onSnapshot(q, (snap) => onChange(listOf<ChatMessage>(snap)));
}

/* ------------------------------------------------------------------ */
/* Stream video                                                        */
/* ------------------------------------------------------------------ */

// Asks our API route for a Stream token. The route checks the Firebase ID
// token and that the caller belongs to this interview.
export async function getStreamCredentials(applicationId: string): Promise<StreamCredentials> {
  ensureConfigured();
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new ScoopyError("Please sign in to join the interview.");
  const res = await fetch("/api/stream-token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ applicationId }),
  });
  const body = await res.json();
  if (!res.ok) throw new ScoopyError(body.error || "Couldn't join the interview room.");
  return body;
}
