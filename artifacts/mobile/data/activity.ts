export type ActivityType =
  | "application_submitted"
  | "application_viewed"
  | "profile_updated"
  | "new_job_match"
  | "new_applicant"
  | "application_reviewed"
  | "job_expiring"
  | "job_performance";

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string; // ISO string for easy sorting
  jobId?: string;
  applicantId?: string;
  isEmployerEvent: boolean;
}

const now = new Date();
const today = new Date();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

export const MOCK_ACTIVITIES: ActivityEvent[] = [
  // SEEKER ACTIVITY
  {
    id: "a1",
    type: "application_viewed",
    title: "Application Viewed",
    description: "Zomato reviewed your application for Delivery Executive.",
    timestamp: today.toISOString(),
    jobId: "1",
    isEmployerEvent: false,
  },
  {
    id: "a2",
    type: "new_job_match",
    title: "New Job Match",
    description: "Swiggy posted a Delivery Partner role near you.",
    timestamp: yesterday.toISOString(),
    jobId: "14",
    isEmployerEvent: false,
  },
  {
    id: "a3",
    type: "application_submitted",
    title: "Application Submitted",
    description: "You successfully applied for Accountant at Sharma & Associates.",
    timestamp: twoDaysAgo.toISOString(),
    jobId: "2",
    isEmployerEvent: false,
  },
  {
    id: "a4",
    type: "profile_updated",
    title: "Profile Updated",
    description: "You added Tally to your skills, increasing your profile score.",
    timestamp: lastWeek.toISOString(),
    isEmployerEvent: false,
  },

  // EMPLOYER ACTIVITY
  {
    id: "e1",
    type: "new_applicant",
    title: "New Applicant",
    description: "Rahul Sharma applied for Delivery Executive.",
    timestamp: today.toISOString(),
    jobId: "1",
    applicantId: "user_rahul",
    isEmployerEvent: true,
  },
  {
    id: "e2",
    type: "job_performance",
    title: "Job Performance Update",
    description: "Your Accountant job post has received 12 applications so far.",
    timestamp: yesterday.toISOString(),
    jobId: "2",
    isEmployerEvent: true,
  },
  {
    id: "e3",
    type: "job_expiring",
    title: "Job Expiring Soon",
    description: "Your BPO Executive job post expires in 2 days.",
    timestamp: twoDaysAgo.toISOString(),
    jobId: "7",
    isEmployerEvent: true,
  },
  {
    id: "e4",
    type: "application_reviewed",
    title: "Application Reviewed",
    description: "You shortlisted Priya for Accountant role.",
    timestamp: lastWeek.toISOString(),
    jobId: "2",
    applicantId: "user_priya",
    isEmployerEvent: true,
  },
];
