import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import "../styles/SearchResults.css";
import { api } from "../services/infra/api";
import { profileService } from "../services/activity/profile";

interface SearchFilter {
  name: string;
  icon: string;
  count: number;
  type: string;
}

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || "repositories";

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTime, setSearchTime] = useState(0);

  const filters: SearchFilter[] = [
    { name: "Repositories", icon: "book", count: 0, type: "repositories" },
    { name: "Code", icon: "code", count: 0, type: "code" },
    { name: "Users", icon: "person", count: 0, type: "users" },
    { name: "Organizations", icon: "domain", count: 0, type: "organizations" },
  ];

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, type]);

  const performSearch = async () => {
    setLoading(true);
    const startTime = performance.now();

    try {
      const data = await api.get<any>(
        `/search?q=${encodeURIComponent(query)}&type=${type}`,
      );
      setResults(data.results || []);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      const endTime = performance.now();
      setSearchTime(Math.round(endTime - startTime));
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      await profileService.followUser(userId);
      // Refresh results to show updated state if needed
    } catch (error) {
      console.error("Follow error:", error);
    }
  };

  const handleSync = async () => {
    try {
      setLoading(true);
      await api.post("/auth/sync");
      await performSearch(); // Re-run search after sync
    } catch (err) {
      console.error("Manual sync failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderResult = (result: any) => {
    if (result.type === "user") {
      return (
        <div key={result.id} className="user-result-card animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="user-result-left">
            <Link to={result.url}>
              <img src={result.metadata?.avatar || "https://github.com/identicons/guest.png"} alt={result.label} className="user-result-avatar" />
            </Link>
          </div>
          <div className="user-result-content">
            <div className="user-result-header">
              <Link to={result.url} className="user-result-name">{result.label}</Link>
              <span className="user-result-username">{result.subLabel}</span>
            </div>
            {result.metadata?.bio && <p className="user-result-bio">{result.metadata.bio}</p>}
            <div className="user-result-meta">
              {result.metadata?.location && (
                <span className="meta-item">
                  <span className="material-symbols-outlined">location_on</span>
                  {result.metadata.location}
                </span>
              )}
              {result.metadata?.followersCount !== undefined && (
                <span className="meta-item">
                  <span className="material-symbols-outlined">group</span>
                  {result.metadata.followersCount} followers
                </span>
              )}
            </div>
          </div>
          <div className="user-result-actions">
            <button onClick={() => handleFollow(result.id.replace('user-', ''))} className="follow-btn">Follow</button>
          </div>
        </div>
      );
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
                  <span className="repo-lang-dot" style={{backgroundColor: '#f1e05a'}}></span>
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

  return (
    <div className="search-results-page-v2">
      <div className="search-container">
        <aside className="search-sidebar-v2">
          <div className="sidebar-section">
            <h3 className="sidebar-label">Filter by</h3>
            <div className="filter-list">
              {filters.map((f) => (
                <button
                  key={f.type}
                  className={`filter-btn ${type === f.type ? "active" : ""}`}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(query)}&type=${f.type}`)}
                >
                  <span className="material-symbols-outlined">{f.icon}</span>
                  <span className="filter-label">{f.name}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="search-main-v2">
          <div className="results-info-bar">
            <h1 className="results-heading">
              {results.length} {type} results
            </h1>
            <div className="sort-controls">
                {/* Sort logic could go here */}
            </div>
          </div>

          {loading ? (
            <div className="search-fetching">
              <div className="gh-spinner"></div>
              <p>Searching for {query}...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="empty-search">
              <span className="material-symbols-outlined empty-icon">person_search</span>
              <h2>No results found for "{query}"</h2>
              <p>Try different keywords or check your spelling.</p>
              
              <div className="empty-actions">
                <button onClick={handleSync} className="sync-btn-v2">
                  <span className="material-symbols-outlined">sync</span>
                  Sync my profile
                </button>
                <p className="sync-note">Can't find yourself? Triggering a manual sync might help.</p>
              </div>
            </div>
          ) : (
            <div className="results-stack">
              {results.map(renderResult)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SearchResultsPage;

