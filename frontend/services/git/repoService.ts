import { apiInstance } from "./api";

export type AccessRole = "owner" | "admin" | "write" | "read";

export interface Collaborator {
  user: {
    id: string; // username
    name: string;
    avatar: string;
    email?: string;
  };
  role: AccessRole;
  joinedAt: string;
}

export interface FullRepoSettings {
  name?: string;
  isTemplate?: boolean;
  requireCommitSignOff?: boolean;
  defaultBranch?: string;
  releaseImmutability?: boolean;
  socialPreview?: string;
  features?: {
    wikis?: boolean;
    restrictWiki?: boolean;
    issues?: boolean;
    sponsorships?: boolean;
    preserve?: boolean;
    discussions?: boolean;
    projects?: boolean;
  };
  pullRequests?: {
    allowMerge?: boolean;
    mergeMessage?: string;
    allowSquash?: boolean;
    squashMessage?: string;
    allowRebase?: boolean;
    alwaysSuggestUpdate?: boolean;
    autoMerge?: boolean;
    deleteHead?: boolean;
  };
  archives?: {
    includeLfs?: boolean;
  };
  pushes?: {
    limitEnabled?: boolean;
    limit?: number;
  };
  issues?: {
    autoClose?: boolean;
  };
}

// Mock Data
const MOCK_COLLABORATORS: Record<string, Collaborator[]> = {
  "my-repo-1": [
    {
      user: {
        id: "current-user",
        name: "Me",
        avatar: "https://i.pravatar.cc/150?u=me",
      },
      role: "owner",
      joinedAt: "2025-01-01",
    },
    {
      user: {
        id: "sarah_dev",
        name: "Sarah Developer",
        avatar: "https://i.pravatar.cc/150?u=sarah",
      },
      role: "admin",
      joinedAt: "2025-02-15",
    },
    {
      user: {
        id: "mike_security",
        name: "Mike Sec",
        avatar: "https://i.pravatar.cc/150?u=mike",
      },
      role: "write",
      joinedAt: "2025-03-01",
    },
  ],
};

class RepoService {
  async getCollaborators(repoId: string): Promise<Collaborator[]> {
    try {
      // In a real production app, this would be a real API call.
      // For now, using mock data as a fallback to ensure the UI works.
      return MOCK_COLLABORATORS[repoId] || MOCK_COLLABORATORS["my-repo-1"];
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async getSettings(repoId: string): Promise<FullRepoSettings> {
    try {
      const resp = await apiInstance.get(`/repositories/${repoId}`);
      const data = resp.data;
      return {
        ...(data.settings as object),
        name: data.name,
        isTemplate: data.isTemplate,
      };
    } catch (e) {
      console.error(e);
      return {};
    }
  }

  async updateSettings(
    repoId: string,
    settings: FullRepoSettings,
  ): Promise<void> {
    await apiInstance.patch(`/repositories/${repoId}/settings`, { settings });
  }

  async updateRole(
    repoId: string,
    userId: string,
    newRole: AccessRole,
  ): Promise<void> {
    // This should also be an API call in production
    await new Promise((resolve) => setTimeout(resolve, 500));
    const collaborators =
      MOCK_COLLABORATORS[repoId] || MOCK_COLLABORATORS["my-repo-1"];
    const member = collaborators.find((c) => c.user.id === userId);
    if (member) {
      member.role = newRole;
    }
  }

  async inviteCollaborator(
    repoId: string,
    email: string,
    role: AccessRole,
  ): Promise<void> {
    // This should also be an API call in production
    await new Promise((resolve) => setTimeout(resolve, 600));
    const collaborators =
      MOCK_COLLABORATORS[repoId] || MOCK_COLLABORATORS["my-repo-1"];
    collaborators.push({
      user: {
        id: email.split("@")[0],
        name: email.split("@")[0],
        avatar: `https://i.pravatar.cc/150?u=${email}`,
      },
      role,
      joinedAt: "Just now",
    });
  }

  // Permission Check Helpers
  canMerge(userRole: AccessRole): boolean {
    return ["owner", "admin", "write"].includes(userRole);
  }

  canManageSettings(userRole: AccessRole): boolean {
    return ["owner", "admin"].includes(userRole);
  }
}

export const repoService = new RepoService();
