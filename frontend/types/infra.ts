export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: {
    name: string;
    username: string;
    avatar: string;
  };
  action: string;
  target: string;
  severity: "Info" | "Warning" | "Critical";
  metadata?: any;
}

export interface SystemMetrics {
  activeUsers: number;
  liveWorkspaces: number;
  repoActivityCount: number;
  jobsCreatedToday: number;
  communityHealthScore: number;
  pendingFlags: number;
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  timestamp: string;
  link?: string;
  metadata?: {
    repo?: string;
    author?: string;
    avatar?: string;
    [key: string]: any;
  };
}

export interface SSHKey {
  id: string;
  title: string;
  key: string;
  fingerprint?: string;
  createdAt?: string;
}

export interface PersonalAccessToken {
  id: string;
  name: string;
  tokenPreview: string;
  scopes: string[];
  expiresAt: number | null;
  createdAt: number;
}

export interface LibraryResource {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  category: string;
  techStack: string;
  techColor: string;
  stars: number;
  forks: number;
  lastUpdated: string;
  visibility: "PUBLIC" | "PRIVATE" | "RESEARCH";
  isAudited: boolean;
  type: "Template" | "Guide" | "Snippet" | "Paper" | "Kit";
  tags: string[];
  snippetPreview?: string;
  version?: string;
}

export interface LibraryCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}
