import { Repository } from "./repo";

export type StrataRole = "OWNER" | "ADMIN" | "MEMBER" | "BILLING_MANAGER";
export type TeamRole = "MAINTAINER" | "MEMBER";

export interface StrataMember {
  username: string;
  name: string;
  avatar: string;
  role: StrataRole;
  lastActive: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  repoCount: number;
}

export interface Strata {
  id: string;
  name: string;
  avatar: string;
  description: string;
  website?: string;
  location?: string;
  members: StrataMember[];
  teams: Team[];
  repositories: Repository[];
}
