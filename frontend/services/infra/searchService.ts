// Search Service
import { api } from "./api";

export interface SearchResult {
  id: string;
  type: "user" | "repo" | "workspace" | "job" | "org" | "nav";
  label: string;
  subLabel?: string; // Role, Tech Stack, Description
  icon: string;
  url: string; // Navigation path
  group: string;
  metadata?: Record<string, any>; // Extra data for rendering (e.g., avatar URL, skills)
}

// MOCK DATA REMOVED - Search now strictly uses real database

class SearchService {
  async search(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    let results: SearchResult[] = [];
    try {
      // 1. General Search (Users, Repos, Jobs)
      const data = await api.get<{ results: SearchResult[] }>(`/search?q=${encodeURIComponent(query)}`);
      if (data && data.results) {
        results = data.results;
      }
    } catch (error) {
      console.error("General Search API failed", error);
    }

    let codeResults: SearchResult[] = [];
    try {
      // 2. Raven Code Search (Symbols)
      const codeData = await api.get<{ results: SearchResult[] }>(`/search/code?q=${encodeURIComponent(query)}`);
      if (codeData && codeData.results) {
        codeResults = codeData.results;
      }
    } catch (error) {
      console.error("Code Search API failed", error);
    }

    // Do not fallback to mock. If no results, return empty array.
    return [...results, ...codeResults];
  }
}

export const searchService = new SearchService();
