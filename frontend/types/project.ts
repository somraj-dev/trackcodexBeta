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
  slug?: string;
  repoUrl: string | null;
  repoOwner?: string | null;
  repoName?: string | null;
  branch: string | null;
  framework: string | null;
  status: string;
  createdAt?: string;
  userId?: string;
  domains?: Domain[];
  deployments?: Deployment[];
  // Legacy / Additional fields
  logo?: string;
  logoBg?: string;
  domain?: string;
  deploymentCount?: number;
  analyticsEnabled?: boolean;
  speedInsightsEnabled?: boolean;
  commitMsg?: string;
  deployDate?: string;
}
