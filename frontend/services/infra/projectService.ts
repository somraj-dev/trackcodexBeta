import { api } from './api';

export interface ProjectListItem {
  id: string;
  name: string;
  domain: string;
  logo: string;
  logoBg: string;
  repoUrl: string | null;
  repoOwner: string | null;
  repoName: string | null;
  framework: string | null;
  status: string;
  commitMsg: string;
  deployDate: string;
  branch: string;
  lastDeployment: any;
  deploymentCount: number;
  analyticsEnabled: boolean;
  speedInsightsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends ProjectListItem {
  deployUrl: string;
  altDomain: string | null;
  latestStatus: string;
  createdAgo: string;
  createdBy: string;
  commitHash: string;
  latestBranch: string;
  checklist: { label: string; done: boolean }[];
  edgeReqs: number;
  fnInvocations: number;
  errorRate: string;
  deployments: DeploymentItem[];
  customDomains: DomainItem[];
  buildCommand: string | null;
  outputDir: string | null;
  installCommand: string | null;
  rootDir: string | null;
  nodeVersion: string | null;
  envVars: EnvVar[];
}

export interface DeploymentItem {
  id: string;
  status: string;
  environment: string;
  branch: string;
  commitHash: string | null;
  commitMsg: string | null;
  url: string | null;
  duration: number | null;
  createdBy: string | null;
  createdAt: string;
}

export interface DomainItem {
  id: string;
  domain: string;
  verified: boolean;
  redirect: string | null;
  gitBranch: string | null;
  createdAt: string;
}

export interface EnvVar {
  key: string;
  value: string;
  target: string[]; // ['production', 'preview', 'development']
}

export interface ProjectMetric {
  timestamp: string;
  requests: number;
  errors: number;
  bandwidth: string;
  avgLatency: number;
  statusCodes: any;
}

export interface AnalyticsSummary {
  totalRequests: number;
  totalErrors: number;
  totalBandwidth: string;
  avgLatency: number;
  errorRate: string;
}

export const projectService = {
  // Projects
  async listProjects(): Promise<ProjectListItem[]> {
    return api.get('/projects') as any;
  },

  async getProject(id: string): Promise<ProjectDetail> {
    return api.get(`/projects/${id}`) as any;
  },

  async createProject(data: {
    name: string;
    domain?: string;
    repoUrl?: string;
    repoOwner?: string;
    repoName?: string;
    framework?: string;
    buildCommand?: string;
    outputDir?: string;
    commitMsg?: string;
  }): Promise<any> {
    return api.post('/projects', data) as any;
  },

  async updateProject(id: string, data: Partial<ProjectDetail>): Promise<any> {
    return api.put(`/projects/${id}`, data) as any;
  },

  async deleteProject(id: string): Promise<void> {
    return api.delete(`/projects/${id}`) as any;
  },

  // Deployments
  async listDeployments(projectId: string, environment?: string): Promise<DeploymentItem[]> {
    const query = environment && environment !== 'All' ? `?environment=${environment}` : '';
    return api.get(`/projects/${projectId}/deployments${query}`) as any;
  },

  async createDeployment(projectId: string, data: {
    branch?: string;
    commitHash?: string;
    commitMsg?: string;
    environment?: string;
  }): Promise<DeploymentItem> {
    return api.post(`/projects/${projectId}/deployments`, data) as any;
  },

  // Domains
  async listDomains(projectId: string): Promise<DomainItem[]> {
    return api.get(`/projects/${projectId}/domains`) as any;
  },

  async addDomain(projectId: string, data: { domain: string; redirect?: string; gitBranch?: string }): Promise<DomainItem> {
    return api.post(`/projects/${projectId}/domains`, data) as any;
  },

  async removeDomain(projectId: string, domainId: string): Promise<void> {
    return api.delete(`/projects/${projectId}/domains/${domainId}`) as any;
  },

  // Settings
  async updateSettings(projectId: string, data: {
    buildCommand?: string;
    outputDir?: string;
    installCommand?: string;
    rootDir?: string;
    nodeVersion?: string;
    envVars?: EnvVar[];
  }): Promise<any> {
    return api.put(`/projects/${projectId}/settings`, data) as any;
  },

  // Analytics toggles
  async toggleAnalytics(projectId: string): Promise<any> {
    return api.post(`/projects/${projectId}/analytics/toggle`, {}) as any;
  },

  async toggleSpeedInsights(projectId: string): Promise<any> {
    return api.post(`/projects/${projectId}/speed-insights/toggle`, {}) as any;
  },

  // Environment Variables
  async getEnvVars(projectId: string): Promise<EnvVar[]> {
    return api.get(`/projects/${projectId}/env`) as any;
  },

  async updateEnvVars(projectId: string, envVars: EnvVar[]): Promise<any> {
    return api.put(`/projects/${projectId}/env`, { envVars }) as any;
  },

  // Infrastructure / Build Status
  async getBuildStatus(projectId: string): Promise<{
    buildStatus: string;
    activeDeployId: string | null;
    lastBuildAt: string | null;
    latestDeployment?: DeploymentItem;
  }> {
    return api.get(`/projects/${projectId}/build-status`) as any;
  },

  async getBuildLogs(projectId: string, deploymentId: string): Promise<{
    logs: string;
    status: string;
    duration: number | null;
  }> {
    return api.get(`/projects/${projectId}/deployments/${deploymentId}/logs`) as any;
  },

  // Analytics
  async getAnalytics(projectId: string): Promise<ProjectMetric[]> {
    return api.get(`/infra/projects/${projectId}/analytics`) as any;
  },

  async getAnalyticsSummary(projectId: string): Promise<AnalyticsSummary> {
    return api.get(`/infra/projects/${projectId}/analytics/summary`) as any;
  },
};
