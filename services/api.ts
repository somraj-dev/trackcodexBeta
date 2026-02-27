import { Repository, Workspace, Job, ProfileData, SSHKey, Notification, PullRequest } from "../types";
import { UserProfile } from "./profile";

// Extended Window interface for Electron Bridge
declare global {
  interface Window {
    electron?: {
      env: {
        API_URL: string;
      };
    };
  }
}

// Dynamic API Base: Uses Electron Bridge if available (Desktop), environment variable (Web Production), or relative (Web Dev)
export const API_BASE = window.electron?.env.API_URL
  ? `${window.electron.env.API_URL}/api/v1`
  : import.meta.env?.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/v1`
    : "/api/v1";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // We use Cookies for auth, so no Bearer token needed
  // But we MUST send CSRF token
  const csrfToken = localStorage.getItem("csrf_token");
  const sessionId = localStorage.getItem("session_id");
  const headers = new Headers(options.headers);

  if (csrfToken) headers.set("X-CSRF-Token", csrfToken);
  if (sessionId) headers.set("Authorization", `Bearer ${sessionId}`);
  if (!headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");

  // IMPORTANT: 'include' credentials to send HttpOnly cookies
  const config: RequestInit = {
    ...options,
    headers,
    credentials: "include",
  };

  const response = await fetch(`${API_BASE}${path}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      // Handle unauthorized background requests silently or trigger logout?
      // For now, let it throw so callers know it failed
    }
    throw new ApiError(
      response.status,
      errorData.message || "Request failed",
      errorData,
    );
  }

  const text = await response.text();
  try {
    return text ? JSON.parse(text) : ({} as T);
  } catch (e) {
    console.error("Failed to parse response JSON", e);
    return {} as T;
  }
}

export interface LoginCredentials {
  username?: string;
  email?: string;
  password?: string;
}

export interface Commit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
    avatar?: string;
  };
  htmlUrl?: string;
}

export interface CIRun {
  id: string;
  status: "queued" | "in_progress" | "completed" | "waiting";
  conclusion: "success" | "failure" | "neutral" | "cancelled" | "skipped" | "timed_out" | "action_required" | null;
  createdAt: string;
  updatedAt: string;
}

export const api = {
  auth: {
    login: (credentials: LoginCredentials) =>
      request<{ token: string; user: UserProfile; sessionId?: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    getMe: () => request<UserProfile>("/auth/me"),
  },
  workspaces: {
    list: () => request<Workspace[]>("/workspaces"),
    get: (id: string) => request<Workspace>(`/workspaces/${id}`),
    create: (data: Partial<Workspace>) =>
      request<Workspace>("/workspaces", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, status: string) =>
      request<Workspace>(`/workspaces/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    delete: (id: string) =>
      request<void>(`/workspaces/${id}`, { method: "DELETE" }),
  },
  repositories: {
    list: async (): Promise<Repository[]> => {
      const res = await request<{ repositories: Repository[] } | Repository[]>("/repositories");
      // Backend may return { repositories: [...] } or flat array — handle both
      if (Array.isArray(res)) return res;
      return (res as { repositories: Repository[] }).repositories || [];
    },
    get: (id: string) => request<Repository>(`/repositories/${id}`),
    create: (data: Partial<Repository>) =>
      request<Repository>("/repositories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    sync: () =>
      request<{ message: string; repositories: Repository[] }>(
        "/repositories/sync",
        { method: "POST" },
      ),
    getCommits: (id: string, ref?: string, path?: string, depth?: number) =>
      request<Commit[]>(
        `/repositories/${id}/commits?ref=${ref || "HEAD"}&path=${path || ""}&depth=${depth || 50}`,
      ),
    getBranches: (id: string) =>
      request<string[]>(`/repositories/${id}/branches`),
    getCommitDiff: (id: string, sha: string) =>
      request<{ diff: string }>(`/repositories/${id}/commits/${sha}/diff`),
    importRepo: (data: {
      sourceUrl: string;
      sourceUsername?: string;
      sourceToken?: string;
      name: string;
      visibility: string;
      ownerId?: string;
    }) =>
      request<Repository>("/repositories/import", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  forgeAI: {
    complete: (options: {
      prompt: string;
      provider?: string;
      model?: string;
      workspaceId?: string;
      systemPrompt?: string;
    }) =>
      request<{ result: string }>("/forgeai/complete", {
        method: "POST",
        body: JSON.stringify(options),
      }),
    synthesize: (requirement: string, workspaceId: string) =>
      request<{ success: boolean; message?: string }>("/forgeai/synthesize", {
        method: "POST",
        body: JSON.stringify({ requirement, workspaceId }),
      }),
  },
  jobs: {
    list: () => request<Job[]>("/jobs"),
    create: (data: Partial<Job>) =>
      request<Job>("/jobs", { method: "POST", body: JSON.stringify(data) }),
    apply: (id: string) =>
      request<void>(`/jobs/${id}/apply`, { method: "POST" }),
  },
  profile: {
    get: (username: string) => request<ProfileData>(`/profiles/${username}`),
    update: (data: Partial<UserProfile>) =>
      request<ProfileData>("/profiles/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },
  cloud: {
    listContainers: () => request<unknown[]>("/cloud/containers"),
    stopContainer: (id: string) =>
      request<{ success: boolean }>(`/cloud/containers/${id}/stop`, { method: "POST" }),
    listPipelines: (workspaceId?: string) =>
      request<unknown[]>(
        `/cloud/pipelines${workspaceId ? `?workspaceId=${workspaceId}` : ""}`,
      ),
    triggerPipeline: (workspaceId: string) =>
      request<{ pipelineId: string }>("/cloud/pipelines", {
        method: "POST",
        body: JSON.stringify({ workspaceId }),
      }),
    getPipeline: (id: string) => request<unknown>(`/cloud/pipelines/${id}`),
  },
  notifications: {
    list: (userId: string) => request<Notification[]>(`/notifications?userId=${userId}`),
    markRead: (id: string) => request<void>(`/notifications/${id}/read`, { method: "POST" }),
    markAllRead: (userId: string) => request<void>("/notifications/read-all", { method: "POST", body: JSON.stringify({ userId }) }),
  },
  pullRequests: {
    list: (repoId: string, status?: string) =>
      request<PullRequest[]>(`/repositories/${repoId}/pulls${status ? `?status=${status}` : ""}`),
    get: (repoId: string, number: number) =>
      request<PullRequest>(`/repositories/${repoId}/pulls/${number}`),
    create: (repoId: string, data: { base: string; head: string; title: string; body?: string; draft?: boolean }) =>
      request<PullRequest>(`/repositories/${repoId}/pulls`, { method: "POST", body: JSON.stringify(data) }),
    merge: (repoId: string, number: number, method?: "merge" | "squash" | "rebase") =>
      request<{ success: boolean; message?: string }>(`/repositories/${repoId}/pulls/${number}/merge`, { method: "POST", body: JSON.stringify({ method }) }),
    close: (repoId: string, number: number) =>
      request<{ success: boolean }>(`/repositories/${repoId}/pulls/${number}/close`, { method: "POST" }),
    addReview: (repoId: string, number: number, status: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED", body?: string) =>
      request<{ success: boolean }>(`/repositories/${repoId}/pulls/${number}/reviews`, { method: "POST", body: JSON.stringify({ status, body }) }),
    getDiff: (repoId: string, number: number) =>
      request<{ diff: string }>(`/repositories/${repoId}/pulls/${number}/diff`),
    addComment: (repoId: string, number: number, body: string) =>
      request<{ success: boolean; comment: unknown }>(`/repositories/${repoId}/pulls/${number}/comments`, { method: "POST", body: JSON.stringify({ body }) }),
  },
  ciRuns: {
    list: (repoId: string) => request<CIRun[]>(`/repos/${repoId}/runs`),
    get: (runId: string) => request<CIRun>(`/runs/${runId}`),
    cancel: (runId: string) => request<{ success: boolean }>(`/runs/${runId}/cancel`, { method: "POST" }),
    rerun: (runId: string) => request<{ success: boolean }>(`/runs/${runId}/rerun`, { method: "POST" }),
    dispatch: (repoId: string, workflowId?: string) =>
      request<{ success: boolean }>(`/repos/${repoId}/dispatch`, { method: "POST", body: JSON.stringify({ workflowId }) }),
  },

  integrations: {
    connect: (provider: string, accessToken: string, providerUsername?: string) =>
      request<{ success: boolean }>("/integrations/connect", {
        method: "POST",
        body: JSON.stringify({ provider, accessToken, providerUsername }),
      }),
    getToken: (provider: string) =>
      request<{ connected: boolean; accessToken?: string }>(`/integrations/token/${provider}`),
    status: () =>
      request<{ connected: Record<string, boolean> }>("/integrations/status"),
    disconnect: (provider: string) =>
      request<{ success: boolean }>(`/integrations/disconnect/${provider}`, { method: "DELETE" }),
  },

  sshKeys: {
    list: () => request<SSHKey[]>("/ssh-keys"),
    add: (title: string, key: string) =>
      request<SSHKey>("/ssh-keys", {
        method: "POST",
        body: JSON.stringify({ title, key }),
      }),
    delete: (id: string) =>
      request<void>(`/ssh-keys/${id}`, { method: "DELETE" }),
  },
  // Generic methods for services
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: <T>(path: string) =>
    request<T>(path, {
      method: "DELETE",
    }),
};
