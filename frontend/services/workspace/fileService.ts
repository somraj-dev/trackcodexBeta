import { API_BASE as GLOBAL_API_BASE } from "./api";

const FORGE_API_BASE = `${GLOBAL_API_BASE}/forge`;

export const fileService = {
    // Get File Tree
    async getFiles(workspaceId: string) {
        const res = await fetch(`${FORGE_API_BASE}/files/${workspaceId}`);
        if (!res.ok) throw new Error('Failed to fetch files');
        return res.json();
    },

    // Get File Content
    async getFileContent(workspaceId: string, path: string) {
        const res = await fetch(`${FORGE_API_BASE}/files/${workspaceId}/content?path=${encodeURIComponent(path)}`);
        if (!res.ok) throw new Error('Failed to fetch content');
        return res.json();
    },

    // Save File
    async saveFile(workspaceId: string, path: string, content: string) {
        const res = await fetch(`${FORGE_API_BASE}/files/${workspaceId}/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, content })
        });
        if (!res.ok) throw new Error('Failed to save');
        return res.json();
    },

    // Git Push (Governance)
    async gitPush(repoId: string, userId: string, prStatus?: string) {
        const res = await fetch(`${FORGE_API_BASE}/git/push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repoId, userId, prStatus })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Push failed');
        return data;
    }
};
