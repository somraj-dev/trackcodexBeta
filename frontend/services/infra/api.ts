import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { auth } from "../../lib/firebase";
import { Repository, Workspace, Job, ProfileData, SSHKey, Notification, PullRequest } from "../../types";
import { UserProfile } from "../activity/profile";

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

// Dynamic API Base: Uses Electron Bridge if available (Desktop), environment variable (Web Production), or smart fallback
const getApiUrl = () => {
  if (window.electron?.env.API_URL) return window.electron.env.API_URL;
  if (import.meta.env?.VITE_API_URL) return import.meta.env.VITE_API_URL;
  // In production (deployed), use the production API; in local dev, use localhost
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://127.0.0.1:4000";
  }
  return "https://api.trackcodex.com";
};

export const API_URL = getApiUrl();

export const API_BASE = `${API_URL}/api/v1`;

// Create unified axios instance
export const apiInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Automatically inject Firebase ID token
apiInstance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const idToken = await currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${idToken}`;
    } catch (error) {
      console.warn("[API] Failed to get Firebase ID token", error);
    }
  }

  // Inject CSRF token if available in storage or state
  const csrfToken = localStorage.getItem("trackcodex_csrf_token");
  if (csrfToken && ["post", "put", "delete", "patch"].includes(config.method?.toLowerCase() || "")) {
    config.headers["X-CSRF-Token"] = csrfToken;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Global error handling
apiInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (session expired)
      console.warn("[API] 401 Unauthorized - Session may have expired");
    }
    return Promise.reject(error);
  }
);

// Helper for type-safe requests
async function request<T>(config: any): Promise<T> {
  const response = await apiInstance(config);
  return response.data;
}

export const api = {
  community: {
    list: (params?: { authorId?: string }) =>
      request<any[]>({ url: "/community/posts", params }),
  },
  library: {
    list: async (params?: { authorId?: string }) => {
      // Keep static for now as requested
      return [
        {
          id: "1",
          title: "Introduction to React Hooks",
          description: "A comprehensive guide to using React Hooks in modern web applications.",
          slug: "intro-to-react-hooks",
          category: "Tutorial",
          tags: ["react", "hooks", "frontend"],
          authorId: params?.authorId || "user-1",
          authorName: "John Doe",
          authorAvatar: "https://github.com/shadcn.png",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          likesCount: 120,
          viewsCount: 1540,
          type: "component",
          stars: 120,
          downloads: 1540
        }
      ];
    }
  },
  auth: {
    login: (credentials: any) =>
      request<{ token: string; user: UserProfile; sessionId?: string; csrfToken?: string }>({
        url: "/auth/login",
        method: "POST",
        data: credentials,
      }),
    register: (data: any) =>
      request<{ message: string; csrfToken?: string; user: any }>({
        url: "/auth/register",
        method: "POST",
        data,
      }),
    getMe: () => request<UserProfile>({ url: "/auth/me" }),
  },
  workspaces: {
    list: (params?: { userId?: string; visibility?: string }) =>
      request<Workspace[]>({ url: "/workspaces", params }),
    get: (id: string) => request<Workspace>({ url: `/workspaces/${id}` }),
    create: (data: Partial<Workspace>) =>
      request<Workspace>({ url: "/workspaces", method: "POST", data }),
    updateStatus: (id: string, status: string) =>
      request<Workspace>({ url: `/workspaces/${id}/status`, method: "PATCH", data: { status } }),
    start: (id: string, repoId?: string, options?: { liveSync?: boolean }) =>
      request<{ url: string; port: number }>({ url: `/workspaces/${id}/start`, method: "POST", data: { repoId, ...options } }),
    delete: (id: string) =>
      request<void>({ url: `/workspaces/${id}`, method: "DELETE" }),
  },
  repositories: {
    list: async (params?: { userId?: string }): Promise<Repository[]> => {
      const res = await request<any>({ url: "/repositories", params });
      return Array.isArray(res) ? res : res.repositories || [];
    },
    get: (id: string) => request<Repository>({ url: `/repositories/${id}` }),
    getByName: (owner: string, name: string) =>
      request<Repository>({ url: `/repositories/by-name/${owner}/${name}` }),
    create: (data: Partial<Repository>) =>
      request<Repository>({ url: "/repositories", method: "POST", data }),
    star: (id: string) => request<any>({ url: `/repositories/${id}/star`, method: "POST" }),
    unstar: (id: string) => request<any>({ url: `/repositories/${id}/star`, method: "DELETE" }),
    update: (id: string, data: Partial<Repository>) =>
      request<Repository>({ url: `/repositories/${id}`, method: "PATCH", data }),
    pin: (id: string) => request<any>({ url: `/repositories/${id}/pin`, method: "POST" }),
    unpin: (id: string) => request<any>({ url: `/repositories/${id}/pin`, method: "DELETE" }),
    watch: (id: string, level: string) => request<any>({ url: `/repositories/${id}/watch`, method: "POST", data: { level } }),
    unwatch: (id: string) => request<any>({ url: `/repositories/${id}/watch`, method: "DELETE" }),
    sync: () =>
      request<{ message: string; repositories: Repository[] }>({ url: "/repositories/sync", method: "POST" }),
    getCommits: (id: string, ref?: string, path?: string, depth?: number) =>
      request<any[]>({
        url: `/repositories/${id}/commits`,
        params: { ref: ref || "HEAD", path: path || "", depth: depth || 50 }
      }),
    getBranches: (id: string) => request<string[]>({ url: `/repositories/${id}/branches` }),
    getCommitDiff: (id: string, sha: string) => request<{ diff: string }>({ url: `/repositories/${id}/commits/${sha}/diff` }),
    getIssue: (id: string, number: string | number) => request<any>({ url: `/repositories/${id}/issues/${number}` }),
    updateIssue: (id: string, number: string | number, data: any) =>
      request<any>({ url: `/repositories/${id}/issues/${number}`, method: "PATCH", data }),
    addIssueComment: (id: string, number: string | number, data: { body: string }) =>
      request<any>({ url: `/repositories/${id}/issues/${number}/comments`, method: "POST", data }),
    toggleIssueState: (id: string, number: string | number, action: "close" | "reopen", stateReason?: string) =>
      request<any>({ url: `/repositories/${id}/issues/${number}/${action}`, method: "POST", data: { stateReason } }),
    getLabels: (id: string) => request<any[]>({ url: `/repositories/${id}/labels` }),
    getMilestones: (id: string) => request<any[]>({ url: `/repositories/${id}/milestones` }),
    getAssignees: (id: string) => request<any[]>({ url: `/repositories/${id}/assignees` }),
    addIssueAssignee: (id: string, number: string | number, userId: string) =>
      request<any>({ url: `/repositories/${id}/issues/${number}/assignees`, method: "POST", data: { userId } }),
    removeIssueAssignee: (id: string, number: string | number, userId: string) =>
      request<any>({ url: `/repositories/${id}/issues/${number}/assignees/${userId}`, method: "DELETE" }),
    getPulls: (id: string, filter: string = "OPEN") => request<any[]>({ url: `/repositories/${id}/pulls`, params: { status: filter } }),
    getPull: (id: string, number: string | number) => request<any>({ url: `/repositories/${id}/pulls/${number}` }),
    getPullDiff: (id: string, number: string | number) => request<{ diff: string }>({ url: `/repositories/${id}/pulls/${number}/diff` }),
    mergePull: (id: string, number: string | number, method: "merge" | "squash" | "rebase") =>
      request<any>({ url: `/repositories/${id}/pulls/${number}/merge`, method: "POST", data: { method } }),
    createPull: (id: string, data: any) => request<any>({ url: `/repositories/${id}/pulls`, method: "POST", data }),
    getPullComments: (id: string, number: string | number) => request<any[]>({ url: `/repositories/${id}/pulls/${number}/comments` }),
    createPullComment: (id: string, number: string | number, data: { body: string }) => request<any>({ url: `/repositories/${id}/pulls/${number}/comments`, method: "POST", data }),
    getCIStatus: (id: string, ref: string) => request<any[]>({ url: `/repositories/${id}/ci-runs`, params: { ref } }),
    getContents: (id: string, path: string = "", ref: string = "HEAD") =>
      request<any[]>({ url: `/repositories/${id}/contents`, params: { path, ref } }),
    getTree: (id: string, ref: string = "HEAD", recursive: boolean = true) =>
      request<any[]>({ url: `/repositories/${id}/tree`, params: { ref, recursive } }),
    getContent: (id: string, path: string, ref: string = "HEAD") =>
      request<any>({ url: `/repositories/${id}/content`, params: { path, ref } }),
    createFile: (id: string, data: any) =>
      request<any>({ url: `/repositories/${id}/contents`, method: "POST", data }),
    getContributors: (id: string) => request<any[]>({ url: `/repositories/${id}/contributors` }),
    getLanguages: (id: string) => request<any>({ url: `/repositories/${id}/languages` }),
    getTags: (id: string) => request<string[]>({ url: `/repositories/${id}/tags` }),
    getReleases: (id: string) => request<any[]>({ url: `/repositories/${id}/releases` }),
    getWikiPages: (id: string) => request<any[]>({ url: `/repositories/${id}/wiki/pages` }),
    getWikiPage: (id: string, slug: string) => request<any>({ url: `/repositories/${id}/wiki/pages/${slug}` }),
    updateWikiPage: (id: string, slug: string, data: { content: string }) => request<any>({ url: `/repositories/${id}/wiki/pages/${slug}`, method: "PUT", data }),
    createRelease: (id: string, data: any) => request<any>({ url: `/repositories/${id}/releases`, method: "POST", data }),
    importRepo: (data: any) =>
      request<Repository>({ url: "/repositories/import", method: "POST", data }),
    insights: {
      pulse: (id: string, period: string = "week") => request<any>({ url: `/repositories/${id}/insights/pulse`, params: { period } }),
      contributors: (id: string) => request<any[]>({ url: `/repositories/${id}/insights/contributors` }),
      commits: (id: string) => request<any[]>({ url: `/repositories/${id}/insights/commits` }),
      codeFrequency: (id: string) => request<any[]>({ url: `/repositories/${id}/insights/code-frequency` }),
      forks: (id: string) => request<any[]>({ url: `/repositories/${id}/insights/forks` }),
    },
  },
  profile: {
    get: (username: string) => request<ProfileData>({ url: `/profiles/${username}` }),
    update: (data: Partial<UserProfile>) =>
      request<ProfileData>({ url: "/profiles/me", method: "PATCH", data }),
  },
  notifications: {
    list: (userId: string) => request<any[]>({ url: `/notifications` }),
    markRead: (id: string) => request<any>({ url: `/notifications/${id}/read`, method: "POST" }),
    markAllRead: (userId: string) => request<any>({ url: `/notifications/read-all`, method: "POST" }),
  },
  ciRuns: {
    list: (repoId: string) => request<any[]>({ url: `/repositories/${repoId}/ci-runs` }),
  },
  integrations: {
    status: () => request<any>({ url: "/integrations/status" }),
    connect: (provider: string, accessToken: string, providerUsername?: string) =>
      request<any>({
        url: "/integrations/connect",
        method: "POST",
        data: { provider, accessToken, providerUsername },
      }),
    disconnect: (provider: string) =>
      request<any>({ url: `/integrations/disconnect/${provider}`, method: "DELETE" }),
    syncGithub: () => request<any>({ url: "integrations/sync/github" }),
    syncGitlab: () => request<any>({ url: "integrations/sync/gitlab" }),
    githubCallback: (code: string) =>
      request<any>({
        url: "integrations/github/callback",
        method: "POST",
        data: { code },
      }),
    gitlabCallback: (code: string) =>
      request<any>({
        url: "integrations/gitlab/callback",
        method: "POST",
        data: { code },
      }),
  },
  workflows: {
    list: (repoId: string) => request<any[]>({ url: `/repositories/${repoId}/workflows` }),
    listRuns: (repoId: string) => request<any[]>({ url: `/repositories/${repoId}/workflow-runs` }),
    dispatch: (repoId: string, workflowId: string, ref?: string) =>
      request<any>({
        url: `/repositories/${repoId}/workflows/${workflowId}/dispatch`,
        method: "POST",
        data: { ref },
      }),
  },
  get: <T>(url: string, params?: any) => request<T>({ url, params }),
  post: <T>(url: string, data?: any) => request<T>({ url, method: "POST", data }),
  put: <T>(url: string, data?: any) => request<T>({ url, method: "PUT", data }),
  patch: <T>(url: string, data?: any) => request<T>({ url, method: "PATCH", data }),
  delete: <T>(url: string) => request<T>({ url, method: "DELETE" }),
  baseUrl: API_BASE,
};


