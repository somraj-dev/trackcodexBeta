import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { auth } from "../lib/firebase";
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
export const API_URL = window.electron?.env.API_URL
  ? window.electron.env.API_URL
  : import.meta.env?.VITE_API_URL || "";

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
    sync: () =>
      request<{ message: string; repositories: Repository[] }>({ url: "/repositories/sync", method: "POST" }),
    getCommits: (id: string, ref?: string, path?: string, depth?: number) =>
      request<any[]>({
        url: `/repositories/${id}/commits`,
        params: { ref: ref || "HEAD", path: path || "", depth: depth || 50 }
      }),
    getBranches: (id: string) => request<string[]>({ url: `/repositories/${id}/branches` }),
    getCommitDiff: (id: string, sha: string) => request<{ diff: string }>({ url: `/repositories/${id}/commits/${sha}/diff` }),
    getIssues: (id: string, filter: string = "OPEN") => request<any[]>({ url: `/repositories/${id}/issues`, params: { status: filter } }),
    createIssue: (id: string, data: { title: string; body: string }) =>
      request<any>({ url: `/repositories/${id}/issues`, method: "POST", data }),
    getPulls: (id: string, filter: string = "OPEN") => request<any[]>({ url: `/repositories/${id}/pulls`, params: { status: filter } }),
    createPull: (id: string, data: any) => request<any>({ url: `/repositories/${id}/pulls`, method: "POST", data }),
    getContents: (id: string, path: string = "", ref: string = "HEAD") =>
      request<any[]>({ url: `/repositories/${id}/contents`, params: { path, ref } }),
    getContent: (id: string, path: string, ref: string = "HEAD") =>
      request<any>({ url: `/repositories/${id}/content`, params: { path, ref } }),
    createFile: (id: string, data: any) =>
      request<any>({ url: `/repositories/${id}/contents`, method: "POST", data }),
    importRepo: (data: any) =>
      request<Repository>({ url: "/repositories/import", method: "POST", data }),
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
  // ... other services can be added here following the same pattern
  get: <T>(url: string, params?: any) => request<T>({ url, params }),
  post: <T>(url: string, data?: any) => request<T>({ url, method: "POST", data }),
  put: <T>(url: string, data?: any) => request<T>({ url, method: "PUT", data }),
  patch: <T>(url: string, data?: any) => request<T>({ url, method: "PATCH", data }),
  delete: <T>(url: string) => request<T>({ url, method: "DELETE" }),
};
