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
  visibility?: "Public" | "Private" | "public" | "private";
  description?: string;
  members?: any;
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

