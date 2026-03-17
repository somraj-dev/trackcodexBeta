import { LanguageDist, RepoRefactor } from "./common";

export type RepoRole = "READ" | "TRIAGE" | "WRITE" | "MAINTAIN" | "ADMIN";

export type RepoPermission =
  | "pull_code"
  | "push_code"
  | "triage_issues"
  | "manage_webhooks"
  | "administer_repo"
  | "delete_repo";

export interface Repository {
  id: string;
  name: string;
  isPublic: boolean;
  description: string;
  techStack: string;
  techColor: string;
  language?: string;
  stars: number;
  forks: number;
  aiHealth: string;
  aiHealthLabel: string;
  securityStatus: string;
  lastUpdated: string;
  visibility: "PRIVATE" | "PUBLIC";
  logo?: string;
  readme?: string;
  githubId?: number;
  htmlUrl?: string;
  cloneUrl?: string;
  sshUrl?: string;
  languages?: LanguageDist[];
  refactors?: RepoRefactor[];
  contributors?: string[];
  releaseVersion?: string;
  owner?: string;
  open_issues?: number;
  license?: string;
  updatedAt?: string;
}

export interface PinnedRepo {
  name: string;
  description: string;
  language: string;
  langColor: string;
  stars: string;
  forks: number;
  isPublic: boolean;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  body: string | null;
  status: string;
  base: string;
  head: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

