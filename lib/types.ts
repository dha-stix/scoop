// Shape of every document Scoop stores in Firestore.
import type { Timestamp } from "firebase/firestore";

export type Role = "hr" | "candidate";

export type ApplicationStatus =
  | "applied"
  | "reviewed"
  | "shortlisted"
  | "interview"
  | "offer"
  | "hired"
  | "rejected"
  | "declined"
  | "archived";

export type JobStatus = "open" | "closed" | "draft";

// Firestore returns Timestamps; freshly written serverTimestamp() fields can be null briefly.
export type DateValue = Timestamp | Date | string | null | undefined;

export interface UserProfile {
  id: string;
  role: Role;
  name: string;
  email: string;
  photoURL?: string;
  // HR only
  companyId?: string;
  companyName?: string;
  jobTitle?: string;
  // Candidate only
  desiredRole?: string;
  location?: string;
  phone?: string;
  createdAt?: DateValue;
}

export interface Company {
  id: string;
  name: string;
  website?: string;
  size?: string;
  description?: string;
  logoUrl?: string;
  ownerId: string;
  createdAt?: DateValue;
}

export interface ScreeningQuestion {
  id: string;
  prompt: string;
}

export interface JobInput {
  title: string;
  department: string;
  location: string;
  workMode: string;
  employmentType: string;
  experienceLevel: string;
  currency: string;
  salaryMin: number | null;
  salaryMax: number | null;
  about: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  benefits: string[];
  requireCoverLetter: boolean;
  askPortfolio: boolean;
  questions: ScreeningQuestion[];
  deadline: string;
  openings: number;
}

export interface Job extends JobInput {
  id: string;
  status: JobStatus;
  hrId: string;
  companyId: string;
  companyName: string;
  applicantCount: number;
  createdAt?: DateValue;
  updatedAt?: DateValue;
}

export interface CandidateDetails {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
  experience: string;
  startDate: string;
  photoURL: string;
}

export interface Interview {
  callId: string;
  scheduledAt: DateValue;
  durationMins: number;
  message: string;
}

export interface Offer {
  salary: string;
  startDate: string;
  message: string;
  sentAt?: DateValue;
}

export interface Scorecard {
  technical: number;
  communication: number;
  cultureAdd: number;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  jobLocation: string;
  workMode: string;
  companyId: string;
  companyName: string;
  hrId: string;
  candidateId: string;
  candidate: CandidateDetails;
  cvUrl: string;
  cvName: string;
  cvPath: string;
  coverLetter: string;
  answers: { prompt: string; answer: string }[];
  status: ApplicationStatus;
  history: { status: ApplicationStatus; at: DateValue }[];
  rating: number;
  notes: string;
  scorecard?: Scorecard;
  interview?: Interview;
  offer?: Offer;
  createdAt?: DateValue;
  updatedAt?: DateValue;
}

export interface ChatMessage {
  id: string;
  uid: string;
  name: string;
  text: string;
  createdAt?: DateValue;
}

export interface StreamCredentials {
  apiKey: string;
  token: string;
  user: { id: string; name: string; image?: string };
  callId: string;
}
