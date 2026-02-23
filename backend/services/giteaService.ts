/**
 * Gitea API Service
 * Wraps Gitea's REST API to provide repository hosting capabilities.
 * This service is the single point of contact between TrackCodex and Gitea.
 *
 * Gitea API Docs: https://gitea.com/api/swagger
 */

function getGiteaConfig() {
  return {
    url: process.env.GITEA_URL || "http://localhost:3000",
    token: process.env.GITEA_API_TOKEN || "",
  };
}

interface GiteaApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

async function giteaFetch<T = any>(
  endpoint: string,
  options: GiteaApiOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;
  const config = getGiteaConfig();

  const url = `${config.url}/api/v1${endpoint}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `token ${config.token}`,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(
      `Gitea API Error [${res.status}] ${method} ${endpoint}: ${errorText}`,
    );
  }

  // Handle 204 No Content (e.g., DELETE responses)
  if (res.status === 204) return {} as T;

  return res.json() as Promise<T>;
}

// ─── Types ───────────────────────────────────────────────────────

export interface GiteaUser {
  id: number;
  login: string;
  email: string;
  full_name: string;
  avatar_url: string;
}

export interface GiteaRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  clone_url: string;
  ssh_url: string;
  html_url: string;
  default_branch: string;
  owner: GiteaUser;
  created_at: string;
  updated_at: string;
}

export interface GiteaFileContent {
  name: string;
  path: string;
  sha: string;
  type: "file" | "dir";
  size: number;
  content?: string; // Base64 encoded for files
  download_url?: string;
}

export interface GiteaWebhook {
  id: number;
  type: string;
  url: string;
  active: boolean;
  events: string[];
}

// ─── Service ─────────────────────────────────────────────────────

export const GiteaService = {
  // ── Health Check ──
  async isAvailable(): Promise<boolean> {
    try {
      await giteaFetch("/version");
      return true;
    } catch {
      return false;
    }
  },

  // ── User Management ──

  /**
   * Create a mirrored user in Gitea (called during TrackCodex registration).
   * Uses the Admin API, so requires an admin-level API token.
   */
  async createUser(
    email: string,
    username: string,
    password: string,
  ): Promise<GiteaUser> {
    return giteaFetch<GiteaUser>("/admin/users", {
      method: "POST",
      body: {
        email,
        username,
        password,
        full_name: username,
        must_change_password: false,
        send_notify: false,
      },
    });
  },

  /**
   * Delete a user from Gitea (cleanup).
   */
  async deleteUser(username: string): Promise<void> {
    await giteaFetch(`/admin/users/${username}`, { method: "DELETE" });
  },

  /**
   * Get a Gitea user by username.
   */
  async getUser(username: string): Promise<GiteaUser | null> {
    try {
      return await giteaFetch<GiteaUser>(`/users/${username}`);
    } catch {
      return null;
    }
  },

  // ── Repository Management ──

  /**
   * Create a new repository for a user.
   * The user must already exist in Gitea (created via createUser).
   */
  async createRepo(
    owner: string,
    name: string,
    description?: string,
    isPrivate: boolean = false,
  ): Promise<GiteaRepository> {
    return giteaFetch<GiteaRepository>(`/admin/users/${owner}/repos`, {
      method: "POST",
      body: {
        name,
        description: description || "",
        private: isPrivate,
        auto_init: true, // Creates an initial commit with README
        default_branch: "main",
      },
    });
  },

  /**
   * Delete a repository.
   */
  async deleteRepo(owner: string, repo: string): Promise<void> {
    await giteaFetch(`/repos/${owner}/${repo}`, { method: "DELETE" });
  },

  /**
   * Get repository details.
   */
  async getRepo(
    owner: string,
    repo: string,
  ): Promise<GiteaRepository | null> {
    try {
      return await giteaFetch<GiteaRepository>(`/repos/${owner}/${repo}`);
    } catch {
      return null;
    }
  },

  /**
   * List all repositories for a user.
   */
  async listUserRepos(username: string): Promise<GiteaRepository[]> {
    return giteaFetch<GiteaRepository[]>(`/users/${username}/repos`);
  },

  // ── File Access (for the TrackCodex IDE / File Browser) ──

  /**
   * Get contents of a directory or file in a repository.
   * Returns an array for directories, single object for files.
   */
  async getContents(
    owner: string,
    repo: string,
    path: string = "",
    ref: string = "main",
  ): Promise<GiteaFileContent | GiteaFileContent[]> {
    const encodedPath = encodeURIComponent(path).replace(/%2F/g, "/");
    return giteaFetch(`/repos/${owner}/${repo}/contents/${encodedPath}?ref=${ref}`);
  },

  /**
   * Get raw file content (for the code editor).
   */
  async getRawFile(
    owner: string,
    repo: string,
    path: string,
    ref: string = "main",
  ): Promise<string> {
    const config = getGiteaConfig();
    const encodedPath = encodeURIComponent(path).replace(/%2F/g, "/");
    const url = `${config.url}/api/v1/repos/${owner}/${repo}/raw/${encodedPath}?ref=${ref}`;

    const res = await fetch(url, {
      headers: { Authorization: `token ${config.token}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch raw file: ${res.status}`);
    }

    return res.text();
  },

  // ── Webhooks ──

  /**
   * Register a webhook on a repository so Gitea notifies TrackCodex
   * whenever there's a push, PR, or issue event.
   */
  async createWebhook(
    owner: string,
    repo: string,
    targetUrl: string,
    events: string[] = ["push"],
    secret: string = "",
  ): Promise<GiteaWebhook> {
    return giteaFetch<GiteaWebhook>(`/repos/${owner}/${repo}/hooks`, {
      method: "POST",
      body: {
        type: "gitea",
        active: true,
        events,
        config: {
          url: targetUrl,
          content_type: "json",
          secret,
        },
      },
    });
  },

  /**
   * List all webhooks for a repository.
   */
  async listWebhooks(owner: string, repo: string): Promise<GiteaWebhook[]> {
    return giteaFetch<GiteaWebhook[]>(`/repos/${owner}/${repo}/hooks`);
  },

  /**
   * Delete a webhook.
   */
  async deleteWebhook(
    owner: string,
    repo: string,
    hookId: number,
  ): Promise<void> {
    await giteaFetch(`/repos/${owner}/${repo}/hooks/${hookId}`, {
      method: "DELETE",
    });
  },
};
