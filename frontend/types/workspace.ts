export interface Workspace {
  id: string;
  name: string;
  status: "Running" | "Stopped" | "Starting" | "Ready" | "Cloning" | "Failed";
  runtime: string;
  lastModified: string;
  repo: string;
  repoUrl?: string | null;
  branch: string;
  commit: string;
  collaborators: string[];
  project?: string;
  environment?: "DEV" | "STAGING" | "PROD";
  hasPassword?: boolean;
  ownerId?: string;
  updatedAt?: string;
}

export interface LiveSession {
  id: string;
  title: string;
  project: string;
  host: string;
  hostAvatar: string;
  viewers: number;
  participants: number;
}

export interface TrialRepo {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryRange: string;
  status: "Newly Active" | "Updated";
  description: string;
  challenges: string[];
  tech: string[];
  deployments: number;
  coverage: number;
  avgPrReview: string;
  logo: string;
  repoName: string;
  readme?: string;
}
