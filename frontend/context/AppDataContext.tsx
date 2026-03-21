import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Project } from '../types/project';

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
    addProject: (p: Project) => void;
    addTask: (t: Task) => void;
    addGoal: (g: Goal) => void;
}

const INITIAL_PROJECTS: Project[] = [
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
    const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
    const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
    const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);

    const addProject = (p: Project) => setProjects(prev => [p, ...prev]);
    const addTask = (t: Task) => setTasks(prev => [t, ...prev]);
    const addGoal = (g: Goal) => setGoals(prev => [g, ...prev]);

    return (
        <AppDataContext.Provider value={{ projects, tasks, goals, addProject, addTask, addGoal }}>
            {children}
        </AppDataContext.Provider>
    );
};

export const useAppData = () => {
    const context = useContext(AppDataContext);
    if (!context) throw new Error('useAppData must be used within AppDataProvider');
    return context;
};
