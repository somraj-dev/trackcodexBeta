import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Project } from '../types/project';
import { projectService } from '../services/infra/projectService';
import { useAuth } from './AuthContext';

interface Task {
    id: string;
    name: string;
    description: string;
    estimation: string;
    type: string;
    people: string[];
    priority: 'High' | 'Medium' | 'Low';
    status: 'To-do' | 'On Progress' | 'In Review';
}

interface Goal {
    id: string;
    name: string;
    description: string;
    timeline: string;
}

interface AppDataContextType {
    projects: Project[];
    tasks: Task[];
    goals: Goal[];
    isLoading: boolean;
    addProject: (data: any) => Promise<Project | null>;
    deleteProject: (id: string) => Promise<void>;
    refreshProjects: () => Promise<void>;
    addTask: (t: Task) => void;
    addGoal: (g: Goal) => void;
}

// Fallback mock projects used when API is unreachable
const FALLBACK_PROJECTS: Project[] = [
  { id: "trackcodex", name: "trackcodex", domain: "trackcodex.com", logo: "⬡", logoBg: "#111", repoOwner: "somraj-dev", repoName: "trackcodexBeta", repoUrl: "https://github.com/somraj-dev/trackcodexBeta", commitMsg: "style: fix hardcoded dark themes in main layout and dashboard...", deployDate: "1h ago", branch: "main" },
  { id: "docs", name: "docs", domain: "docs.trackcodex.com", logo: "N", logoBg: "#111", repoOwner: "somraj-dev", repoName: "docs", repoUrl: "https://github.com/somraj-dev/docs", commitMsg: "feat: update links to open in the same tab", deployDate: "Mar 14", branch: "main" },
  { id: "support", name: "support", domain: "support.trackcodex.com", logo: "▲", logoBg: "#111", repoOwner: "somraj-dev", repoName: "support", repoUrl: "https://github.com/somraj-dev/support", commitMsg: "fix: resolve build failures by removing unused-vars and converti...", deployDate: "Mar 14", branch: "main" },
];

const INITIAL_TASKS: Task[] = [
    { id: '1', name: 'Implementation of sidebar', description: 'Design and code the primary navigation sidebar', estimation: '3 days', type: 'Dashboard', people: ['https://i.pravatar.cc/150?u=gs', 'https://i.pravatar.cc/150?u=bt'], priority: 'High', status: 'On Progress' },
    { id: '2', name: 'Fix build errors', description: 'Resolve dependency conflicts in the CI/CD pipeline', estimation: '1 day', type: 'Mobile', people: ['https://i.pravatar.cc/150?u=gs'], priority: 'Medium', status: 'To-do' },
];

const INITIAL_GOALS: Goal[] = [
    { id: 'g1', name: 'Q1 Product Launch', description: 'Complete all core features for the initial release', timeline: 'Mar 31' }
];

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [projects, setProjects] = useState<Project[]>(FALLBACK_PROJECTS);
    const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
    const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
    const [isLoading, setIsLoading] = useState(false);
    const { isAuthenticated } = useAuth();

    const refreshProjects = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await projectService.listProjects();
            
            // Map API response to Project type
            const mapped: Project[] = data.map((p) => ({
                id: p.id,
                name: p.name,
                domain: p.domain,
                logo: p.logo || "⬡",
                logoBg: p.logoBg || "#111",
                repoOwner: p.repoOwner,
                repoName: p.repoName,
                repoUrl: p.repoUrl,
                commitMsg: p.commitMsg || "No deployments yet",
                deployDate: p.deployDate ? new Date(p.deployDate).toLocaleDateString() : "Just now",
                branch: p.branch || "main",
                framework: p.framework || undefined,
                status: p.status,
                deploymentCount: p.deploymentCount,
                analyticsEnabled: p.analyticsEnabled,
                speedInsightsEnabled: p.speedInsightsEnabled,
            }));

            // If backend returns projects, use them; otherwise keep fallback
            if (mapped.length > 0) {
                setProjects(mapped);
            }
            // If backend returns empty, keep the fallback so UI isn't empty
        } catch (err) {
            console.warn('[AppDataContext] Could not fetch projects from API, using local data:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch on mount if authenticated
    useEffect(() => {
        if (isAuthenticated) {
            refreshProjects();
        }
    }, [isAuthenticated, refreshProjects]);

    const addProject = useCallback(async (data: any): Promise<Project | null> => {
        try {
            const created = await projectService.createProject({
                name: data.name,
                domain: data.domain,
                repoUrl: data.repoUrl,
                repoOwner: data.repoOwner,
                repoName: data.repoName,
                framework: data.framework,
                buildCommand: data.buildCommand,
                outputDir: data.outputDir,
                commitMsg: data.commitMsg,
            });

            const newProject: Project = {
                id: created.id,
                name: created.name,
                domain: created.domain || `${created.name}.trackcodex.app`,
                logo: created.logo || "⬡",
                logoBg: created.logoBg || "#111",
                repoOwner: created.repoOwner || data.repoOwner || "",
                repoName: created.repoName || data.repoName || "",
                repoUrl: created.repoUrl || data.repoUrl || "",
                commitMsg: data.commitMsg || "feat: Initial deployment via TrackCodex",
                deployDate: "Just now",
                branch: "main",
                framework: created.framework,
            };

            setProjects(prev => [newProject, ...prev]);
            return newProject;
        } catch (err) {
            console.error('[AppDataContext] Failed to create project via API:', err);
            // Fallback: create locally
            const localProject: Project = {
                id: `local-${Date.now()}`,
                name: data.name || "New Project",
                domain: data.domain || `${(data.name || "project").toLowerCase()}.trackcodex.app`,
                logo: data.logo || "⬡",
                logoBg: data.logoBg || "#111",
                repoOwner: data.repoOwner || "",
                repoName: data.repoName || "",
                repoUrl: data.repoUrl || "",
                commitMsg: data.commitMsg || "feat: Initial setup",
                deployDate: "Just now",
                branch: "main",
            };
            setProjects(prev => [localProject, ...prev]);
            return localProject;
        }
    }, []);

    const deleteProject = useCallback(async (id: string) => {
        try {
            await projectService.deleteProject(id);
        } catch (err) {
            console.warn('[AppDataContext] Failed to delete project via API:', err);
        }
        setProjects(prev => prev.filter(p => p.id !== id));
    }, []);

    const addTask = useCallback((t: Task) => setTasks(prev => [t, ...prev]), []);
    const addGoal = useCallback((g: Goal) => setGoals(prev => [g, ...prev]), []);

    const value = React.useMemo(() => ({ 
        projects, 
        tasks, 
        goals,
        isLoading,
        addProject,
        deleteProject,
        refreshProjects,
        addTask, 
        addGoal 
    }), [projects, tasks, goals, isLoading, addProject, deleteProject, refreshProjects]);

    return (
        <AppDataContext.Provider value={value}>
            {children}
        </AppDataContext.Provider>
    );
};

export const useAppData = () => {
    const context = useContext(AppDataContext);
    if (!context) throw new Error('useAppData must be used within AppDataProvider');
    return context;
};
