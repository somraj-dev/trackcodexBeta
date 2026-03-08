export type SystemRole =
  | "Super Admin"
  | "Org Admin"
  | "Team Admin"
  | "Moderator"
  | "Developer"
  | "Viewer";

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
  isCustom: boolean;
}

export interface SkillProficiency {
  skill: string;
  proficiency: number;
}

export interface GrowthPathItem {
  skill: string;
  category: string;
  currentProficiency: number;
  targetLevel: string;
  recommendation: string;
}

export interface SkillRadarData {
  subject: string;
  score: number;
  fullMark: number;
}

export interface Candidate {
  id: string;
  name: string;
  role: string;
  avatar: string;
  location?: string;
  aiComplexityScore: number;
  codeReplayUrl: string;
  prQuality?: number;
  status?: "Passing" | "Idle" | "Archived" | "Top Match";
  aiComplexityDepth?: "High Depth" | "Elite" | "Standard";
  codeReplayHighlights?: string[];
  interviewerSentiment?: number;
  techStackMatch?: { skill: string; alignment: number }[];
  trialPRLink?: string;
  decision?: "Extend Offer" | "Schedule Final" | "Archive";
  techScore?: number;
  cultureFit?: number;
  complexity?: string;
  experience?: string;
  technicalEvidence?: {
    title: string;
    description: string;
    complexity: number;
    quality: number;
    timestamp: string;
  }[];
  linesChanged?: { added: number; removed: number };
  testingCoverage?: number;
  maintainability?: string;
  qualitativeNotes?: {
    author: string;
    avatar: string;
    rating: number;
    note: string;
    tags: string[];
    strengths: string[];
    potentials: string[];
  }[];
}
