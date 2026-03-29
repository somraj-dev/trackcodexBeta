// services/git/gitActivityService.ts
import { apiInstance } from "../infra/api";

export interface Activity {
  date: string;
  count: number;
  level: number;
}

export interface ActivityUpdate {
  activities: Activity[];
  total: number;
  activeYears: number[];
}

type ActivityCallback = (update: ActivityUpdate) => void;

class GitActivityService {
  private subscribers: Map<string, ActivityCallback[]> = new Map();
  private cache: Map<string, { activities: Activity[]; total: number; activeYears: number[]; fetchedAt: number }> = new Map();
  private readonly TTL_MS = 60 * 1000; // 1 minute cache

  /**
   * Subscribe to activity updates for a specific userId.
   * Fetches real data from /api/users/:userId/contributions.
   * If userId is null/undefined, returns an all-zero placeholder.
   */
  public subscribe(callback: ActivityCallback, userId?: string | null, year?: number): () => void {
    const currentYear = year || new Date().getFullYear();
    const key = userId ? `${userId}-${currentYear}` : `__anonymous__-${currentYear}`;

    if (!this.subscribers.has(key)) this.subscribers.set(key, []);
    this.subscribers.get(key)!.push(callback);

    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.fetchedAt < this.TTL_MS) {
      // Use cached data immediately
      callback({ activities: cached.activities, total: cached.total, activeYears: cached.activeYears });
    } else {
      // Fetch fresh data
      this.fetchForUser(userId || null, currentYear);
    }

    return () => {
      const subs = this.subscribers.get(key) || [];
      this.subscribers.set(key, subs.filter((cb) => cb !== callback));
    };
  }

  private async fetchForUser(userId: string | null, year: number) {
    const key = userId ? `${userId}-${year}` : `__anonymous__-${year}`;

    if (!userId) {
      // No user — show all zeros
      const empty = this.buildEmptyYear();
      this.cache.set(key, { activities: empty, total: 0, activeYears: [year], fetchedAt: Date.now() });
      this.notify(key, empty, 0, [year]);
      return;
    }

    try {
      const response = await apiInstance.get(`/stats/contributions/${userId}?year=${year}`);
      const data = response.data;
      const activities: Activity[] = data.contributions ?? this.buildEmptyYear();
      const total: number = data.total ?? 0;
      const activeYears: number[] = data.activeYears ?? [year];
      this.cache.set(key, { activities, total, activeYears, fetchedAt: Date.now() });
      this.notify(key, activities, total, activeYears);
    } catch (err) {
      console.warn("GitActivityService: could not fetch contributions", err);
      const empty = this.buildEmptyYear();
      this.cache.set(key, { activities: empty, total: 0, activeYears: [year], fetchedAt: Date.now() });
      this.notify(key, empty, 0, [year]);
    }
  }

  private notify(key: string, activities: Activity[], total: number, activeYears: number[]) {
    const subs = this.subscribers.get(key) || [];
    subs.forEach((cb) => cb({ activities, total, activeYears }));
  }

  private buildEmptyYear(): Activity[] {
    const result: Activity[] = [];
    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      result.push({ date: d.toISOString().split("T")[0], count: 0, level: 0 });
    }
    return result;
  }

  /** Public method to force a refresh for a userId */
  public refresh(userId: string | null, year?: number) {
    this.fetchForUser(userId, year || new Date().getFullYear());
  }
}

export const gitActivityService = new GitActivityService();
