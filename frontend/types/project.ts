export interface Deployment {
  id: string;
  url: string;
  status: string;
  commitHash: string;
  commitMsg: string;
  createdAt: string;
}

export interface Domain {
  id: string;
  name: string;
  isPrimary: boolean;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  repoUrl: string | null;
  branch: string | null;
  framework: string | null;
  status: string;
  createdAt: string;
  userId: string;
  domains?: Domain[];
  deployments?: Deployment[];
  // Legacy fields for compatibility if needed
  logo?: string;
  logoBg?: string;
  domain?: string;
}
