export type KarmaLevel =
  | "Contributor"
  | "Collaborator"
  | "Expert"
  | "Maintainer";

export interface CommunityComment {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
    karma: number;
  };
  text: string;
  timestamp: string;
  replies?: CommunityComment[];
  upvotes: number;
}

export interface CommunityPost {
  id: string;
  author: {
    name: string;
    username: string;
    role: string;
    avatar: string;
    isLive?: boolean;
    karma?: number;
  };
  time: string;
  visibility: string;
  title: string;
  content: string;
  tags: string[];
  upvotes: number;
  comments: number;
  commentsData?: CommunityComment[];
  linkedEntity?: {
    type: "repo" | "workspace";
    id: string;
    label: string;
  };
  codeSnippet?: {
    filename: string;
    language: string;
    content: string;
  };
  image?: string;
  type?: string;
  moderation?: "SAFE" | "WARNING" | "FLAGGED";
  moderationReason?: string;
}
