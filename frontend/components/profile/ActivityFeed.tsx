import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserProfile } from "../../services/activity/profile";
import { apiInstance } from "../../services/infra/api";

interface ActivityEvent {
  id: string;
  action: string;
  details: any;
  repoName: string | null;
  repoId: string | null;
  createdAt: string;
}

interface Props {
  profile?: UserProfile | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes || 1} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(dateStr).toLocaleDateString();
}

function eventLabel(event: ActivityEvent): {
  action: string;
  color: string;
  icon: string;
} {
  const a = event.action?.toLowerCase() || "";
  if (a.includes("commit") || a.includes("push"))
    return { action: `Pushed ${event.details?.commitCount ?? 1} commit${(event.details?.commitCount ?? 1) !== 1 ? "s" : ""}`, color: "bg-primary", icon: "commit" };
  if (a.includes("pull_request") || a.includes("pr"))
    return { action: "Opened pull request", color: "bg-purple-500", icon: "merge" };
  if (a.includes("create") || a.includes("repo"))
    return { action: "Created repository", color: "bg-emerald-500", icon: "add_circle" };
  if (a.includes("review"))
    return { action: "Reviewed PR", color: "bg-cyan-400", icon: "rate_review" };
  if (a.includes("issue"))
    return { action: "Opened issue", color: "bg-amber-500", icon: "bug_report" };
  return { action: event.action, color: "bg-gh-text-secondary", icon: "history" };
}

const ActivityFeed: React.FC<Props> = ({ profile }) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }
    const fetchActivity = async () => {
      setLoading(true);
      try {
        const response = await apiInstance.get(`/users/${profile.id}/activity`, {
          params: { limit: 6 }
        });
        const data = response.data;
        // The backend returns { activities: [], total } or just [] depending on which route is hit
        // Let's be safe and check for both
        const eventsList = Array.isArray(data) ? data : (data.activities || []);
        setEvents(eventsList);
      } catch (err) {
        console.warn("Could not load activity feed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [profile?.id]);

  // Group by month/year label
  const monthLabel =
    events.length > 0
      ? new Date(events[0].createdAt).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : null;

  return (
    <div className="font-display">
      <div className="flex items-center gap-3 mb-8">
        <span className="material-symbols-outlined text-gh-text-secondary !text-[20px]">
          history
        </span>
        <h3 className="text-[16px] font-medium uppercase tracking-tight text-gh-text">
          Latest Activity
        </h3>
      </div>

      {loading ? (
        <div className="flex flex-col gap-6 pl-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="size-5 rounded-full bg-gh-border shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gh-border rounded w-3/4" />
                <div className="h-2 bg-gh-border rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="size-14 rounded-full border-2 border-dashed border-gh-border flex items-center justify-center">
            <span className="material-symbols-outlined text-gh-text-secondary !text-[26px]">
              timeline
            </span>
          </div>
          <p className="text-[13px] text-gh-text-secondary font-medium max-w-[200px]">
            No activity recorded yet. Start committing, reviewing, and contributing!
          </p>
          <button
            onClick={() => navigate("/repositories")}
            className="text-[11px] font-semibold text-primary uppercase tracking-widest hover:underline"
          >
            Go to Repositories →
          </button>
        </div>
      ) : (
        <div className="relative pl-8">
          <div className="absolute left-[3px] top-2 bottom-8 w-[1px] bg-gh-border" />
          {monthLabel && (
            <p className="text-[11px] font-medium uppercase text-gh-text-secondary tracking-[0.3em] mb-8">
              {monthLabel}
            </p>
          )}

          <div className="space-y-10">
            {events.map((event) => {
              const { action, color, icon } = eventLabel(event);
              const title: string | undefined = event.details?.title ?? event.details?.prTitle;
              const description: string | undefined =
                event.details?.message ?? event.details?.description;
              return (
                <div key={event.id} className="relative group cursor-pointer">
                  <div
                    className={`absolute left-[-32px] top-1 size-5 rounded-full bg-gh-bg border-2 border-gh-border flex items-center justify-center z-10 group-hover:border-primary transition-colors`}
                  >
                    <div className={`size-1.5 rounded-full ${color}`} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[14px] text-gh-text-secondary leading-snug">
                      <span className="font-semibold text-gh-text group-hover:text-primary transition-colors">
                        {action}
                      </span>
                      {event.repoName && (
                        <>
                          {" "}to{" "}
                          <span className="text-primary font-bold hover:underline">
                            {event.repoName}
                          </span>
                        </>
                      )}
                    </p>

                    {description && (
                      <p className="text-[12px] text-gh-text-secondary mt-2 font-medium italic">
                        "{description}"
                      </p>
                    )}

                    {title && (
                      <div className="mt-3 px-3 py-1.5 bg-gh-bg border border-gh-border rounded-lg text-[11px] text-gh-text-secondary font-bold uppercase tracking-tight inline-block">
                        {title}
                      </div>
                    )}

                    <p className="text-[10px] text-gh-text-secondary mt-4 font-medium uppercase tracking-widest">
                      {timeAgo(event.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {events.length > 0 && (
        <button
          onClick={() => navigate("/activity")}
          className="w-full mt-12 py-3 bg-gh-bg-secondary border border-gh-border text-gh-text-secondary hover:text-gh-text rounded-xl text-[11px] font-medium uppercase tracking-widest transition-all shadow-sm hover:border-primary/40 active:scale-[0.98]"
        >
          View full activity
        </button>
      )}
    </div>
  );
};

export default ActivityFeed;
