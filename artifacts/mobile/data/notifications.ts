export type NotificationCategory =
  | "job_matches"
  | "applications"
  | "profile_updates"
  | "employer_updates";

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  timestamp: string; // ISO date string
  isRead: boolean;
  jobId?: string;
  applicantId?: string;
  isEmployerNotification: boolean;
}

const now = new Date();
const today = new Date();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  // SEEKER NOTIFICATIONS
  {
    id: "n1",
    category: "applications",
    title: "Application Shortlisted!",
    body: "Sharma & Associates has shortlisted your application for Accountant.",
    timestamp: today.toISOString(),
    isRead: false,
    jobId: "2",
    isEmployerNotification: false,
  },
  {
    id: "n2",
    category: "job_matches",
    title: "5 New Jobs Match Your Profile",
    body: "Check out new Delivery Executive roles in Rohini.",
    timestamp: today.toISOString(),
    isRead: false,
    isEmployerNotification: false,
  },
  {
    id: "n3",
    category: "applications",
    title: "Application Viewed",
    body: "Zomato viewed your application for Delivery Executive.",
    timestamp: yesterday.toISOString(),
    isRead: true,
    jobId: "1",
    isEmployerNotification: false,
  },
  {
    id: "n4",
    category: "profile_updates",
    title: "Profile Incomplete",
    body: "Add your educational background to stand out to employers.",
    timestamp: twoDaysAgo.toISOString(),
    isRead: true,
    isEmployerNotification: false,
  },

  // EMPLOYER NOTIFICATIONS
  {
    id: "ne1",
    category: "employer_updates",
    title: "New Applicants Waiting",
    body: "You have 3 new applicants for your Zomato Delivery Executive role.",
    timestamp: today.toISOString(),
    isRead: false,
    jobId: "1",
    isEmployerNotification: true,
  },
  {
    id: "ne2",
    category: "employer_updates",
    title: "Job Expiring Tomorrow",
    body: "Your posting for Accountant at Sharma & Associates is expiring.",
    timestamp: yesterday.toISOString(),
    isRead: true,
    jobId: "2",
    isEmployerNotification: true,
  },
];
