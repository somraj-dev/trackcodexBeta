import { apiInstance } from '../infra/api';

export interface Comment {
  id: string;
  authorId: string;
  author: { name: string; avatar: string };
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    isVerified?: boolean;
    karma?: number;
  };
  title?: string;
  content: string;
  mediaUrl?: string;
  mediaUrls?: string[]; // For carousels
  isPromoted?: boolean;
  isPopular?: boolean;
  isJoined?: boolean;
  ctaText?: string; // e.g., "Shop Now"
  awards?: number;
  codeSnippet?: {
    code: string;
    language: string;
  };
  likes: number;
  comments: any[];
  createdAt: string;
  community?: {
    id: string;
    name: string;
    slug: string;
    avatar?: string;
  };
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatar: string;
  coverImage?: string;
  memberCount: number;
  isMember: boolean;
  createdAt?: string;
}

export interface TrendingRepo {
  id: string;
  name: string;
  description: string;
  stars: number;
  language: string;
  avatar: string;
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

  createPost: async (data: {
    title?: string;
    content: string;
    type?: string;
    repoLink?: any;
    codeSnippet?: any;
    jobDetails?: any;
    communityId?: string;
    mediaUrl?: string;
    mediaUrls?: string[];
  }) => {
    try {
      const response = await apiInstance.post("/community/posts", data);
      return response.data;
    } catch (err) {
      console.error("❌ Failed to create post:", err);
      throw err;
    }
  },

  getCommunities: async (): Promise<Community[]> => {
    try {
      const response = await apiInstance.get("/community");
      return response.data || [];
    } catch (err) {
      console.error("❌ Failed to fetch communities:", err);
      return [];
    }
  },


  createCommunity: async (data: {
    name: string;
    description?: string;
    avatar?: string;
    coverImage?: string;
  }) => {
    try {
      const response = await apiInstance.post("/community", data);
      return response.data;
    } catch (err) {
      console.error("❌ Failed to create community:", err);
      throw err;
    }
  },

  updateCommunity: async (
    slug: string,
    data: { avatar?: string; coverImage?: string; description?: string }
  ) => {
    try {
      const response = await apiInstance.patch(`/community/${slug}`, data);
      return response.data;
    } catch (err) {
      console.error("❌ Failed to update community:", err);
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


