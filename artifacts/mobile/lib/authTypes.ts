export type UserRole = "seeker" | "employer" | null;

export interface UserProfile {
  name: string;
  phone: string;
  role: UserRole;
  isAuthenticated: boolean;
  location: string;
  skills: string[];
  experience: string;
  education: string;
  language: string;
  bio: string;
  resumeUploaded: boolean;
  resumeName?: string;
  resumeUri?: string;
  profileScore: number;
}

