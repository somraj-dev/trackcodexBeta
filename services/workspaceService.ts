import { apiInstance } from "./api";

/**
 * Workspace Service
 * Handles backend integration for TrackCodex IDE workspaces
 */

export interface WorkspaceFile {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  content?: string;
  language?: string;
  children?: WorkspaceFile[];
}

export interface WorkspaceSettings {
  theme: "light" | "dark";
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  autoSave: boolean;
}

class WorkspaceService {
  private currentWorkspaceId: string | null = null;
  private settings: Map<string, WorkspaceSettings> = new Map();

  /**
   * Get workspace files from backend
   */
  async getWorkspaceFiles(workspaceId: string): Promise<WorkspaceFile[]> {
    try {
      // Corrected production endpoint
      const response = await apiInstance.get("/files", {
        params: { workspaceId },
      });
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching workspace files:", error);
      return this.getDemoWorkspace();
    }
  }

  /**
   * Get file content from backend
   */
  async getFileContent(workspaceId: string, filePath: string): Promise<string> {
    try {
      const response = await apiInstance.get(`/files/${encodeURIComponent(filePath)}`, {
        params: { workspaceId },
      });
      return response.data.content;
    } catch (error) {
      console.error("❌ Error fetching file content:", error);
      return "// File content could not be loaded";
    }
  }

  /**
   * Save file content to backend
   */
  async saveFileContent(
    workspaceId: string,
    filePath: string,
    content: string,
  ): Promise<boolean> {
    try {
      await apiInstance.post(`/files/${encodeURIComponent(filePath)}`, { content }, {
        params: { workspaceId },
      });
      return true;
    } catch (error) {
      console.error("❌ Error saving file:", error);
      return false;
    }
  }

  /**
   * Switch to a different workspace
   */
  switchWorkspace(workspaceId: string) {
    this.currentWorkspaceId = workspaceId;
    window.dispatchEvent(
      new CustomEvent("workspace-changed", {
        detail: { workspaceId },
      }),
    );
  }

  /**
   * Get workspace settings
   */
  getWorkspaceSettings(workspaceId: string): WorkspaceSettings {
    if (!this.settings.has(workspaceId)) {
      const saved = localStorage.getItem(`workspace-settings-${workspaceId}`);
      if (saved) {
        this.settings.set(workspaceId, JSON.parse(saved));
      } else {
        this.settings.set(workspaceId, {
          theme: "dark",
          fontSize: 14,
          tabSize: 2,
          wordWrap: true,
          minimap: true,
          autoSave: true,
        });
      }
    }
    return this.settings.get(workspaceId)!;
  }

  /**
   * Save workspace settings
   */
  saveWorkspaceSettings(
    workspaceId: string,
    settings: Partial<WorkspaceSettings>,
  ) {
    const current = this.getWorkspaceSettings(workspaceId);
    const updated = { ...current, ...settings };
    this.settings.set(workspaceId, updated);
    localStorage.setItem(
      `workspace-settings-${workspaceId}`,
      JSON.stringify(updated),
    );
    window.dispatchEvent(
      new CustomEvent("workspace-settings-changed", {
        detail: { workspaceId, settings: updated },
      }),
    );
  }

  /**
   * Create new file in workspace
   */
  async createFile(
    workspaceId: string,
    dirPath: string,
    fileName: string,
  ): Promise<WorkspaceFile | null> {
    try {
      const response = await apiInstance.post("/files/create", { dirPath, fileName }, {
        params: { workspaceId }
      });
      return response.data;
    } catch (error) {
      console.error("❌ Error creating file:", error);
      return null;
    }
  }

  /**
   * Delete file from workspace
   */
  async deleteFile(workspaceId: string, filePath: string): Promise<boolean> {
    try {
      await apiInstance.delete(`/files/${encodeURIComponent(filePath)}`, {
        params: { workspaceId }
      });
      return true;
    } catch (error) {
      console.error("❌ Error deleting file:", error);
      return false;
    }
  }

  /**
   * Demo workspace structure (fallback)
   */
  private getDemoWorkspace(): WorkspaceFile[] {
    return [
      {
        id: "1",
        name: "src",
        path: "/src",
        type: "directory",
        children: [
          {
            id: "2",
            name: "App.tsx",
            path: "/src/App.tsx",
            type: "file",
            language: "typescript",
            content: "import React from 'react';\n\nfunction App() {\n  return <div>Welcome to TrackCodex IDE!</div>;\n}\n\nexport default App;",
          }
        ],
      },
      {
        id: "7",
        name: "README.md",
        path: "/README.md",
        type: "file",
        language: "markdown",
        content: "# TrackCodex Workspace\n\nWelcome to your TrackCodex development environment!",
      },
    ];
  }
}

export const workspaceService = new WorkspaceService();
