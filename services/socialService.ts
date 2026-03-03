import { apiInstance } from "./api";

export interface SocialUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  role: string;
  company?: string;
}

export interface Comment {
  id: string;
  authorId: string;
  author: { name: string; avatar: string };
  text: string;
  createdAt: string;
}

export type PostType =
  | "discussion"
  | "repo_update"
  | "job_alert"
  | "showcase"
  | "question";

export interface Post {
  id: string;
  title?: string;
  content: string;
  type: PostType;
  author: { id: string; name: string; username: string; avatar: string; role?: string; karma: number };
  createdAt: string;
  comments: Comment[];
  likes: number;
  mediaUrl?: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
  repoLink?: {
    name: string;
    description: string;
    stars: number;
    language: string;
  };
  jobDetails?: {
    company: string;
    role: string;
    salary: string;
    location: string;
  };
  shares?: number;
  isLiked?: boolean;
  community?: {
    id: string;
    name: string;
    slug: string;
    avatar?: string;
  };
  workspace?: {
    id: string;
    name: string;
    description?: string;
  };
  researchPaperUrl?: string;
}

export interface Community {
  id: string;
  slug: string;
  name: string;
  description?: string;
  avatar?: string;
  coverImage?: string;
  isSearchable: boolean;
  creatorId: string;
  createdAt: string;
  _count?: {
    members: number;
    posts: number;
  };
}

export const socialService = {
  getFeed: async (): Promise<Post[]> => {
    try {
      const response = await apiInstance.get("/community/posts");
      return response.data || [];
    } catch (err) {
      console.error("❌ Failed to fetch community feed:", err);
      return [];
    }
  },

  likePost: async (postId: string) => {
    try {
      await apiInstance.post(`/community/posts/${postId}/like`);
      return true;
    } catch (err) {
      return false;
    }
  },

  createPost: async (content: string, title?: string) => {
    try {
      const response = await apiInstance.post("/community/posts", {
        content,
        title,
      });
      return response.data;
    } catch (err) {
      console.error("❌ Failed to create post:", err);
      throw err;
    }
  },

  createCommunity: async (data: {
    name: string;
    description?: string;
    avatar?: string;
  }) => {
    try {
      const response = await apiInstance.post("/community", data);
      return response.data;
    } catch (err) {
      console.error("❌ Failed to create community:", err);
      throw err;
    }
  },

  getCommunity: async (slug: string): Promise<Community | null> => {
    try {
      const response = await apiInstance.get(`/community/${slug}`);
      return response.data;
    } catch (err) {
      console.error("❌ Failed to fetch community:", err);
      return null;
    }
  },

  joinCommunity: async (slug: string) => {
    try {
      await apiInstance.post(`/community/${slug}/join`);
      return true;
    } catch (err) {
      console.error("❌ Failed to join community:", err);
      return false;
    }
  },

  getCommunityFeed: async (communityId: string): Promise<Post[]> => {
    try {
      const response = await apiInstance.get("/community/posts", {
        params: { communityId },
      });
      return response.data;
    } catch (err) {
      console.error("❌ Failed to fetch community feed:", err);
      return [];
    }
  },
};
