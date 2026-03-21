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
  createdAt: string;
  isPublic: boolean;
  description: string;
  website?: string;
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
  license?: string;
  updatedAt?: string;
  settings?: {
    defaultBranch?: string;
    [key: string]: any;
  };
  watchers?: number;
  topics?: string[];
  owner?: {
    id: string;
    username: string;
    avatar?: string;
  };
  permissions?: {
    admin: boolean;
    push: boolean;
    pull: boolean;
    triage?: boolean;
    maintain?: boolean;
  };
  watchLevel?: string | null;
  isPinned?: boolean;
  isStarred?: boolean;
  open_issues_count?: number;
  open_pull_requests_count?: number;
  commits_count?: number;
  initReadme?: boolean;
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

