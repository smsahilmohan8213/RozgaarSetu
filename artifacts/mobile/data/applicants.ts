export type ApplicantStatus = "applied" | "reviewed" | "shortlisted" | "rejected" | "interview";

export interface Applicant {
  id: string;
  applicant_id: string;
  jobId: string;
  name: string;
  experience: string;
  skills: string[];
  appliedDate: string; // ISO String
  status: ApplicantStatus;
  phone: string;
  email: string;
  location: string;
  interviewDate?: string;
  interviewTime?: string;
}


