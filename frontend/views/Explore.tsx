import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Search, TrendingUp, UserPlus, Star, Terminal, Globe, Lock } from "lucide-react";
import { api } from "../services/infra/api";
import { profileService } from "../services/activity/profile";
import { realtimeService } from "../services/infra/realtime-service";
import { useAuth } from "../context/AuthContext";
import { Workspace } from "../types";
import "../styles/Explore.css";

interface User {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
}

export const Explore: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"users" | "workspaces">("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [trendingUsers, setTrendingUsers] = useState<User[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = realtimeService.subscribe((event) => {
      if (event.type === "USER_FOLLOW" && event.data) {
        const { targetUserId, followerId, action } = event.data;
        const currentUserId = user?.id;
        
        const updateUsers = (users: User[]) => users.map(u => {
          if (u.id === targetUserId) {
            return {
              ...u,
              followersCount: Math.max(0, (u.followersCount || 0) + (action === "FOLLOW" ? 1 : -1)),
              isFollowing: followerId === currentUserId ? (action === "FOLLOW") : u.isFollowing
            };
          }
          if (u.id === followerId) {
            return {
              ...u,
              followingCount: Math.max(0, (u.followingCount || 0) + (action === "FOLLOW" ? 1 : -1))
            };
          }
          return u;
        });

        setTrendingUsers(updateUsers);
        setSuggestedUsers(updateUsers);
        setSearchResults(updateUsers);
      }
    });

    return () => { unsubscribe(); };
  }, [user?.id]);

  useEffect(() => {
    loadDiscoveryData();
  }, []);

  const loadDiscoveryData = async () => {
    setLoading(true);
    try {
      const [trending, suggested, wsList] = await Promise.all([
        api.get<User[]>("/users/trending"),
        api.get<User[]>("/users/suggested"),
        api.workspaces.list({ visibility: "public" })
      ]);
      setTrendingUsers(trending);
      setSuggestedUsers(suggested);
      setWorkspaces(wsList);
    } catch (error) {
      console.error("Error loading discovery data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await api.get<{ users: User[] }>("/search/users", { q: query, limit: 12 });
        setSearchResults(data.users || []);
      } catch (error) {
        console.error("Error searching users:", error);
      }
    }, 300);
  };

  const handleFollow = async (userId: string) => {
    try {
      await profileService.followUser(userId);
      // Refresh data
      loadDiscoveryData();
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await profileService.unfollowUser(userId);
      // Refresh data
      loadDiscoveryData();
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  };

  const renderUserCard = (user: User) => (
    <div key={user.id} className="user-card" onClick={() => navigate(`/profile/${user.username}`)}>
      <div className="user-card-header">
        <img
          src={
            user.avatarUrl ||
            (user as any).avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
          }
          alt={user.name}
          className="user-avatar"
        />
        <div className="user-info">
          <h3 className="user-name">{user.name}</h3>
          <p className="user-username">@{user.username}</p>
        </div>
        <button
          className={`follow-btn ${user.isFollowing ? "following" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            user.isFollowing ? handleUnfollow(user.id) : handleFollow(user.id);
          }}
        >
          {user.isFollowing ? "Following" : "Follow"}
        </button>
      </div>
      {(user.bio) && <p className="user-bio">{user.bio}</p>}
      <div className="user-stats">
        <span>
          <strong>{user.followersCount || 0}</strong> followers
        </span>
        <span>
          <strong>{user.followingCount || 0}</strong> following
        </span>
      </div>
    </div>
  );

  const renderWorkspaceCard = (ws: Workspace) => (
    <div key={ws.id} className="user-card workspace-card" onClick={() => navigate(`/workspace/${ws.id}`)}>
      <div className="user-card-header">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Terminal size={24} />
        </div>
        <div className="user-info">
          <h3 className="user-name">{ws.name}</h3>
          <p className="user-username flex items-center gap-1">
            {(ws.visibility === 'public' || ws.visibility === 'Public') ? <Globe size={12} /> : <Lock size={12} />}
            {ws.visibility}
          </p>
        </div>
        <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${ws.status === 'Running' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
          {ws.status}
        </div>
      </div>
      {ws.description && <p className="user-bio">{ws.description}</p>}
      <div className="user-stats">
        <span className="flex items-center gap-1">
          <Users size={14} />
          <strong>{Array.isArray(ws.members) ? ws.members.length : (typeof ws.members === 'number' ? ws.members : 1)}</strong> members
        </span>
        <span className="truncate max-w-[150px]">
          {ws.repoUrl || "No repo linked"}
        </span>
      </div>
    </div>
  );

  return (
    <div className="explore-container min-h-full">
      <div className="explore-header">
        <h1>
          <Users size={32} /> Explore
        </h1>
        <p>Discover developers and projects in the TrackCodex community</p>
      </div>

      <div className="explore-tabs">
        <button
          className={`tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <Users size={20} />
          Users
        </button>
        <button
          className={`tab ${activeTab === "workspaces" ? "active" : ""}`}
          onClick={() => setActiveTab("workspaces")}
        >
          <Star size={20} />
          Workspaces
        </button>
      </div>

      {activeTab === "users" && (
        <div className="explore-content">
          {/* Search Section */}
          <div className="search-section">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Search Results */}
          {searchQuery && searchResults.length > 0 && (
            <section className="explore-section">
              <h2>
                <Search size={24} /> Search Results
              </h2>
              <div className="user-grid">
                {searchResults.map(renderUserCard)}
              </div>
            </section>
          )}

          {/* Trending Users */}
          {!searchQuery && (
            <>
              <section className="explore-section">
                <h2>
                  <TrendingUp size={24} /> Trending Developers
                </h2>
                <p className="section-subtitle">
                  Most followed developers this week
                </p>
                {loading ? (
                  <div className="loading">Loading...</div>
                ) : (
                  <div className="user-grid">
                    {trendingUsers.map(renderUserCard)}
                  </div>
                )}
              </section>

              {/* Suggested Users */}
              <section className="explore-section">
                <h2>
                  <UserPlus size={24} /> Suggested for You
                </h2>
                <p className="section-subtitle">
                  Developers you might want to follow
                </p>
                {loading ? (
                  <div className="loading">Loading...</div>
                ) : (
                  <div className="user-grid">
                    {suggestedUsers.map(renderUserCard)}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      )}

      {activeTab === "workspaces" && (
        <div className="explore-content">
          <section className="explore-section">
            <h2>
              <Star size={24} /> Public Workspaces
            </h2>
            <p className="section-subtitle">
              Discover and join active cloud development environments
            </p>
            {loading ? (
              <div className="loading">Loading...</div>
            ) : workspaces.length === 0 ? (
              <div className="coming-soon">
                <Globe size={48} className="opacity-20 mb-4" />
                <p>No public workspaces found.</p>
              </div>
            ) : (
              <div className="user-grid">
                {workspaces.map(renderWorkspaceCard)}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default Explore;

