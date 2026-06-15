export type ApplicantStatus = "applied" | "reviewed" | "shortlisted" | "rejected" | "interview";

export interface Applicant {
  id: string;
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

const today = new Date().toISOString();
const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString();
const lastWeek = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

export const MOCK_APPLICANTS: Applicant[] = [
  {
    id: "app_1",
    jobId: "1", // Zomato Delivery Executive
    name: "Rahul Sharma",
    experience: "1 Year",
    skills: ["Two-wheeler", "Local Navigation"],
    appliedDate: today,
    status: "applied",
    phone: "9876543210",
    email: "rahul.sharma@example.com",
    location: "Rohini",
  },
  {
    id: "app_2",
    jobId: "1",
    name: "Amit Kumar",
    experience: "Fresher",
    skills: ["Time Management"],
    appliedDate: yesterday,
    status: "applied",
    phone: "9876543211",
    email: "amit.kumar@example.com",
    location: "Pitampura",
  },
  {
    id: "app_3",
    jobId: "2", // Accountant
    name: "Priya Singh",
    experience: "3 Years",
    skills: ["Tally", "GST", "Excel"],
    appliedDate: yesterday,
    status: "shortlisted",
    phone: "9876543212",
    email: "priya.singh@example.com",
    location: "Ashok Vihar",
  },
  {
    id: "app_4",
    jobId: "2",
    name: "Karan Verma",
    experience: "Fresher",
    skills: ["B.Com", "Basic Accounting"],
    appliedDate: lastWeek,
    status: "rejected",
    phone: "9876543213",
    email: "karan.verma@example.com",
    location: "Model Town",
  },
  {
    id: "app_5",
    jobId: "7", // BPO Night Shift
    name: "Sneha Gupta",
    experience: "2 Years",
    skills: ["English Fluency", "Customer Support", "CRM"],
    appliedDate: today,
    status: "applied",
    phone: "9876543214",
    email: "sneha.gupta@example.com",
    location: "GTB Nagar",
  },
];
