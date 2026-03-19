import React, { useEffect, useState } from "react";
import {
  activityService,
  Activity,
  ActivityType,
} from "../../services/activity/activityService";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
// import "../../styles/ActivityFeed.css";

export const ActivityFeed: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [page]);

  const loadActivities = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await activityService.getFollowingFeed(page, 20);

      if (response.activities.length < 20) {
        setHasMore(false);
      }

      setActivities((prev) =>
        page === 1 ? response.activities : [...prev, ...response.activities],
      );
    } catch (error) {
      console.error("Error loading activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const handleActivityClick = (activity: Activity) => {
    // Navigate based on activity type
    if (
      activity.action === ActivityType.FOLLOW_USER &&
      activity.metadata?.targetUserId
    ) {
      navigate(`/profile/${activity.metadata.targetUserId}`);
    } else if (
      activity.action === ActivityType.STAR_WORKSPACE &&
      activity.workspaceId
    ) {
      navigate(`/workspace/${activity.workspaceId}`);
    } else if (
      activity.action === ActivityType.CREATE_WORKSPACE &&
      activity.workspaceId
    ) {
      navigate(`/workspace/${activity.workspaceId}`);
    }
  };

  if (loading && page === 1) {
    return (
      <div className="activity-feed-loading">
        <div className="loading-spinner"></div>
        <p>Loading activity feed...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gh-bg-secondary border border-gh-border rounded-2xl text-center">
        <div className="text-4xl mb-4">📭</div>
        <h3 className="text-gh-text font-bold mb-2">No Activity Yet</h3>
        <p className="text-gh-text-secondary text-sm mb-6">Follow users to see their activity here</p>
        <button
          onClick={() => navigate("/explore")}
          className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-blue-600 transition-colors text-sm"
        >
          Explore Users
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-gh-text text-lg">Following Feed</h2>
          <p className="text-xs text-gh-text-secondary">Activity from people you follow</p>
        </div>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => {
          const formatted = activityService.formatActivity(activity);
          const timeAgo = activityService.getRelativeTime(activity.createdAt);

          return (
            <div
              key={activity.id}
              className="flex gap-4 p-4 bg-gh-bg-secondary border border-gh-border rounded-xl hover:border-gh-text-secondary transition-colors cursor-pointer group"
              onClick={() => handleActivityClick(activity)}
            >
              <div className="shrink-0">
                <img
                  src={activity.user?.avatar || "/default-avatar.png"}
                  alt={activity.user?.name || "User"}
                  className="size-10 rounded-full border border-gh-border object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-sm font-bold text-gh-text truncate">
                      {activity.user?.name}
                    </span>
                    <span className="text-xs text-gh-text-secondary truncate">
                      @{activity.user?.username}
                    </span>
                  </div>
                  <span className="text-xs text-gh-text-secondary shrink-0 whitespace-nowrap ml-2">
                    {timeAgo}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-base leading-none mt-0.5">{formatted.icon}</span>
                  <div className="text-sm text-gh-text-secondary leading-snug">
                    <span className="font-medium text-gh-text">{formatted.title}</span>
                    {formatted.description && (
                      <span className="ml-1 text-gh-text-secondary">
                        {formatted.description}
                      </span>
                    )}
                  </div>
                </div>

                {activity.metadata?.description && (
                  <div className="mt-2 text-xs text-gh-text-secondary p-2 bg-gh-bg border border-gh-border rounded-lg italic">
                    "{activity.metadata.description}"
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="text-xs font-bold text-gh-text-secondary hover:text-gh-text transition-colors"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
};


