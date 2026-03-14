import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import "../styles/SearchResults.css";
import { api } from "../services/infra/api";
import { profileService } from "../services/activity/profile";

interface SearchFilter {
  name: string;
  icon: string;
  type: string;
}

interface UserResult {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  location?: string;
  followersCount?: number;
  isFollowing?: boolean;
  url: string;
}

const FILTERS: SearchFilter[] = [
  { name: "Repositories", icon: "book", type: "repositories" },
  { name: "Code", icon: "code", type: "code" },
  { name: "Users", icon: "person", type: "users" },
  { name: "Organizations", icon: "domain", type: "organizations" },
];

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || "repositories";

  // Generic results (repos, code, orgs)
  const [results, setResults] = useState<any[]>([]);
  // User-specific results (dedicated endpoint)
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(true);
  const [searchTime, setSearchTime] = useState(0);

  useEffect(() => {
    if (query) {
      if (type === "users") {
        performUserSearch();
      } else {
        performSearch();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, type]);

  const performSearch = async () => {
    setLoading(true);
    const startTime = performance.now();
    try {
      const data = await api.get<any>(
        `/search?q=${encodeURIComponent(query)}&type=${type}`
      );
      setResults(data.results || []);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearchTime(Math.round(performance.now() - startTime));
      setLoading(false);
    }
  };

  const performUserSearch = async () => {
    setLoading(true);
    const startTime = performance.now();
    try {
      const data = await api.get<any>(
        `/search/users?q=${encodeURIComponent(query)}&limit=30`
      );
      const users: UserResult[] = data.users || [];
      setUserResults(users);
      setUserTotal(data.total || 0);
      // Initialise follow state from backend data
      const initialFollowMap: Record<string, boolean> = {};
      users.forEach((u) => {
        if (u.isFollowing !== undefined) {
          initialFollowMap[u.id] = u.isFollowing;
        }
      });
      setFollowingMap(initialFollowMap);
    } catch (error) {
      console.error("User search error:", error);
      // Fall back to generic search endpoint
      try {
        const fallback = await api.get<any>(
          `/search?q=${encodeURIComponent(query)}&type=users`
        );
        const users: UserResult[] = (fallback.results || [])
          .filter((r: any) => r.type === "user")
          .map((r: any) => ({
            id: r.id.replace("user-", ""),
            name: r.label,
            username: r.subLabel?.replace("@", "") || "",
            avatar: r.metadata?.avatar,
            bio: r.metadata?.bio,
            location: r.metadata?.location,
            followersCount: r.metadata?.followersCount,
            url: r.url,
          }));
        setUserResults(users);
        setUserTotal(users.length);
      } catch (_) {
        /* silently ignore */
      }
    } finally {
      setSearchTime(Math.round(performance.now() - startTime));
      setLoading(false);
    }
  };

  const handleFollow = useCallback(
    async (userId: string) => {
      const isNowFollowing = !followingMap[userId];
      // Optimistic UI: toggle follow + update follower count immediately
      setFollowingMap((prev) => ({ ...prev, [userId]: isNowFollowing }));
      setUserResults((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                followersCount: Math.max(0, (u.followersCount || 0) + (isNowFollowing ? 1 : -1)),
              }
            : u
        )
      );
      try {
        if (isNowFollowing) {
          await profileService.followUser(userId);
        } else {
          await profileService.unfollowUser(userId);
        }
      } catch (error) {
        // Revert both on error
        setFollowingMap((prev) => ({ ...prev, [userId]: !isNowFollowing }));
        setUserResults((prev) =>
          prev.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  followersCount: Math.max(0, (u.followersCount || 0) + (isNowFollowing ? -1 : 1)),
                }
              : u
          )
        );
        console.error("Follow/unfollow error:", error);
      }
    },
    [followingMap]
  );

  // ── User card renderer ──────────────────────────────────────────
  const renderUserCard = (user: UserResult) => {
    const isFollowing = !!followingMap[user.id];
    const profileUrl = user.url || `/profile/${user.username}`;

    return (
      <div key={user.id} className="user-result-card animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="user-result-left">
          <Link to={profileUrl}>
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
              alt={user.name}
              className="user-result-avatar"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`;
              }}
            />
          </Link>
        </div>

        <div className="user-result-content">
          <div className="user-result-header">
            <Link to={profileUrl} className="user-result-name">
              {user.name}
            </Link>
            {user.username && (
              <span className="user-result-username">@{user.username}</span>
            )}
          </div>
          {user.bio && (
            <p className="user-result-bio">{user.bio}</p>
          )}
          <div className="user-result-meta">
            {user.location && (
              <span className="meta-item">
                <span className="material-symbols-outlined">location_on</span>
                {user.location}
              </span>
            )}
            {user.followersCount !== undefined && (
              <span className="meta-item">
                <span className="material-symbols-outlined">group</span>
                {user.followersCount.toLocaleString()} follower{user.followersCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <div className="user-result-actions">
          <button
            onClick={() => handleFollow(user.id)}
            className={`follow-btn ${isFollowing ? "follow-btn--following" : ""}`}
          >
            {isFollowing ? (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
                Following
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person_add</span>
                Follow
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // ── Generic result renderer (repo / org / code) ──────────────────
  const renderResult = (result: any) => {
    if (result.type === "user") {
      // Convert generic user result to UserResult shape
      const u: UserResult = {
        id: result.id.replace("user-", ""),
        name: result.label,
        username: result.subLabel?.replace("@", "") || result.metadata?.username || "",
        avatar: result.metadata?.avatar,
        bio: result.metadata?.bio,
        location: result.metadata?.location,
        followersCount: result.metadata?.followersCount,
        url: result.url,
      };
      return renderUserCard(u);
    }

    if (result.type === "repo") {
      return (
        <div key={result.id} className="repo-result-card">
          <div className="repo-result-header">
            <span className="material-symbols-outlined repo-icon">book</span>
            <Link to={result.url} className="repo-result-title">
              <span className="repo-owner">{result.metadata?.owner}/</span>
              <span className="repo-name">{result.label}</span>
            </Link>
            <span className="repo-visibility">Public</span>
          </div>
          <p className="repo-result-description">{result.subLabel}</p>
          <div className="repo-result-meta">
            {result.metadata?.language && (
              <span className="meta-item">
                <span className="repo-lang-dot" style={{ backgroundColor: "#f1e05a" }} />
                {result.metadata.language}
              </span>
            )}
            <span className="meta-item">
              <span className="material-symbols-outlined">star</span>
              {result.metadata?.stars || 0}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div key={result.id} className="generic-result-card">
        <div className="result-header">
          <span className="material-symbols-outlined result-icon">{result.icon}</span>
          <Link to={result.url} className="result-title">{result.label}</Link>
        </div>
        <p className="result-description">{result.subLabel}</p>
      </div>
    );
  };

  const isUsersTab = type === "users";
  const displayResults = isUsersTab ? userResults : results;
  const resultCount = isUsersTab ? userTotal : results.length;

  return (
    <div className="search-results-page-v2">
      <div className="search-container">
        {/* Sidebar */}
        <aside className="search-sidebar-v2">
          <div className="sidebar-section">
            <h3 className="sidebar-label">Filter by</h3>
            <div className="filter-list">
              {FILTERS.map((f) => (
                <button
                  key={f.type}
                  className={`filter-btn ${type === f.type ? "active" : ""}`}
                  onClick={() =>
                    navigate(`/search?q=${encodeURIComponent(query)}&type=${f.type}`)
                  }
                >
                  <span className="material-symbols-outlined">{f.icon}</span>
                  <span className="filter-label">{f.name}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="search-main-v2">
          <div className="results-info-bar">
            <h1 className="results-heading">
              {loading ? (
                <span>Searching for "{query}"…</span>
              ) : (
                <>
                  {isUsersTab
                    ? `${resultCount.toLocaleString()} user${resultCount !== 1 ? "s" : ""} matching "${query}"`
                    : `${resultCount} ${type} results`}
                </>
              )}
            </h1>
            {!loading && searchTime > 0 && (
              <span style={{ fontSize: 12, color: "#7d8590" }}>
                {searchTime.toLocaleString()} ms
              </span>
            )}
          </div>

          {loading ? (
            <div className="search-fetching">
              <div className="gh-spinner" />
              <p>Searching for <strong>{query}</strong>…</p>
            </div>
          ) : displayResults.length === 0 ? (
            <div className="empty-search">
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#30363d" }}>
                {isUsersTab ? "person_search" : "search_off"}
              </span>
              <h2>No results found for "{query}"</h2>
              <p>Try different keywords or check your spelling.</p>
            </div>
          ) : (
            <div className="results-stack">
              {isUsersTab
                ? (displayResults as UserResult[]).map(renderUserCard)
                : (displayResults as any[]).map(renderResult)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SearchResultsPage;
