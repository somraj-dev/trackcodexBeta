// services/git/gitActivityService.ts

export interface Activity {
  date: string;
  count: number;
  level: number;
}

export interface ActivityUpdate {
  activities: Activity[];
  total: number;
}

type ActivityCallback = (update: ActivityUpdate) => void;

class GitActivityService {
  private subscribers: Map<string, ActivityCallback[]> = new Map();
  private cache: Map<string, { activities: Activity[]; total: number; fetchedAt: number }> = new Map();
  private readonly TTL_MS = 60 * 1000; // 1 minute cache

  /**
   * Subscribe to activity updates for a specific userId.
   * Fetches real data from /api/users/:userId/contributions.
   * If userId is null/undefined, returns an all-zero placeholder.
   */
  public subscribe(callback: ActivityCallback, userId?: string | null): () => void {
    const key = userId || "__anonymous__";

    if (!this.subscribers.has(key)) this.subscribers.set(key, []);
    this.subscribers.get(key)!.push(callback);

    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.fetchedAt < this.TTL_MS) {
      // Use cached data immediately
      callback({ activities: cached.activities, total: cached.total });
    } else {
      // Fetch fresh data
      this.fetchForUser(userId || null);
    }

    return () => {
      const subs = this.subscribers.get(key) || [];
      this.subscribers.set(key, subs.filter((cb) => cb !== callback));
    };
  }

  private async fetchForUser(userId: string | null) {
    const key = userId || "__anonymous__";

    if (!userId) {
      // No user — show all zeros
      const empty = this.buildEmptyYear();
      this.cache.set(key, { activities: empty, total: 0, fetchedAt: Date.now() });
      this.notify(key, empty, 0);
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}/contributions`);
      if (!res.ok) throw new Error("Failed to fetch contributions");
      const data = await res.json();
      const activities: Activity[] = data.contributions ?? this.buildEmptyYear();
      const total: number = data.total ?? 0;
      this.cache.set(key, { activities, total, fetchedAt: Date.now() });
      this.notify(key, activities, total);
    } catch (err) {
      console.warn("GitActivityService: could not fetch contributions", err);
      const empty = this.buildEmptyYear();
      this.cache.set(key, { activities: empty, total: 0, fetchedAt: Date.now() });
      this.notify(key, empty, 0);
    }
  }

  private notify(key: string, activities: Activity[], total: number) {
    const subs = this.subscribers.get(key) || [];
    subs.forEach((cb) => cb({ activities, total }));
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
  public refresh(userId: string | null) {
    this.fetchForUser(userId);
  }
}

export const gitActivityService = new GitActivityService();
