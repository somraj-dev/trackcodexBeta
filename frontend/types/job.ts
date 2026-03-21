export interface OfferDetails {
  baseSalary: string;
  equity: string;
  signOnBonus: string;
  startDate: string;
  reportingManager: string;
  officeLocation: string;
  includeRelocation: boolean;
  customNDA: boolean;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  techStack: string[];
  budget: string;
  type: "Contract" | "Gig" | "Full-time" | "Bounty";
  status: "Open" | "InProgress" | "Completed" | "Pending" | "In Progress";
  repoId: string;
  creator: {
    id?: string;
    name: string;
    avatar: string;
  };
  postedDate: string;
  targetUserId?: string;
  personalNote?: string;
  offerDetails?: OfferDetails;
  applications?: any[];
  applicationsCount?: number;
  metadata?: any;
  updatedAt?: string;
  category?: string;
  website?: string;
}

export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  status: "completed" | "pending" | "locked";
  dueDate?: string;
  type: "required" | "priority" | "social" | "goal";
}

