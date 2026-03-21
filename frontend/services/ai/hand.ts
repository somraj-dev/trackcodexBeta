import { api } from "../infra/api";

export interface AgentStep {
  id: string;
  sessionId: string;
  title: string;
  description?: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  result?: string;
  toolCalls?: unknown;
  position: number;
  createdAt: string;
}

export interface AgentSession {
  id: string;
  userId: string;
  prompt: string;
  model: string;
  provider: string;
  status: "ACTIVE" | "COMPLETED" | "FAILED" | "STOPPED";
  result?: string;
  steps: AgentStep[];
  createdAt: string;
  updatedAt: string;
}

export const handService = {
  getSessions: () => api.get<AgentSession[]>("/forgeai/agent/sessions"),
  getSession: (id: string) => api.get<AgentSession>(`/forgeai/agent/session/${id}`),
};
