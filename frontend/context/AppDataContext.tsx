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
const FALLBACK_PROJECTS: Project[] = [];

const INITIAL_TASKS: Task[] = [];

const INITIAL_GOALS: Goal[] = [];

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
                framework: p.framework || null,
                status: p.status,
                deploymentCount: p.deploymentCount,
                analyticsEnabled: p.analyticsEnabled,
                speedInsightsEnabled: p.speedInsightsEnabled,
            }));

            // Update projects state with values from backend
            setProjects(mapped);
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
                framework: created.framework || null,
                status: created.status || "READY",
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
                framework: data.framework || null,
                status: "READY",
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
    }), [projects, tasks, goals, isLoading, addProject, deleteProject, refreshProjects, addTask, addGoal]);

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
