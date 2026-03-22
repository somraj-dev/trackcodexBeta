import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiInstance } from "../../services/infra/api";
import "../styles/GlobalSearchModal.css";

interface SearchResult {
  id: string;
  type: string;
  label: string;
  subLabel?: string;
  icon: string;
  group: string;
  url: string;
  metadata?: {
    avatar?: string;
    bio?: string;
    location?: string;
    followersCount?: number;
    username?: string;
  };
}

interface RecentRepo {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  lastVisited: Date;
}

const STATIC_PAGES: SearchResult[] = [
  { id: "page-dashboard", type: "page", label: "Dashboard", subLabel: "Personalized home area", icon: "dashboard", group: "Pages", url: "/home" },
  { id: "page-community", type: "page", label: "Community Workspace", subLabel: "Discussions, issues, and collaboration", icon: "forum", group: "Pages", url: "/community" },
  { id: "page-workspaces", type: "page", label: "IDE Workspaces", subLabel: "Cloud development environments", icon: "computer", group: "Pages", url: "/workspaces" },
  { id: "page-repositories", type: "page", label: "Repositories", subLabel: "Your codebase and git projects", icon: "book", group: "Pages", url: "/repositories" },
  { id: "page-marketplace", type: "page", label: "Job Marketplace", subLabel: "Find freelance work and bounties", icon: "work", group: "Pages", url: "/marketplace" },
  { id: "page-integrations", type: "page", label: "Integration Settings", subLabel: "Connect GitHub, Slack, Jira, etc.", icon: "integration_instructions", group: "Settings", url: "/strata/default/settings/integrations" }, // Defaulting to 'default' strata
  { id: "page-settings", type: "page", label: "General Settings", subLabel: "Configure your environment settings", icon: "settings", group: "Settings", url: "/strata/default/settings/general" },
];

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentRepos, setRecentRepos] = useState<RecentRepo[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showSyntaxTips, setShowSyntaxTips] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load recent repositories on mount
  useEffect(() => {
    if (isOpen) {
      loadRecentRepos();
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const loadRecentRepos = async () => {
    try {
      const response = await apiInstance.get("/search/recent");
      if (response.data) {
        setRecentRepos(response.data.recent || []);
      }
    } catch (error) {
      console.error("Error loading recent repos:", error);
    }
  };

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // Show shortcuts immediately (no waiting for backend)
    setLoading(true);
    let cancelled = false;

    const timer = setTimeout(async () => {
      if (cancelled) return;

      // Abort fetch after 3s if backend is unreachable
      const controller = new AbortController();
      const fetchTimeout = setTimeout(() => controller.abort(), 3000);

      try {
        // 1. Filter local static pages
        const lowerQuery = query.toLowerCase();
        const staticMatches = STATIC_PAGES.filter(p =>
          p.label.toLowerCase().includes(lowerQuery) ||
          (p.subLabel && p.subLabel.toLowerCase().includes(lowerQuery))
        );

        // 2. Fetch remote matches (with timeout)
        let dynamicMatches: SearchResult[] = [];
        try {
          const response = await apiInstance.get("/search", {
            params: { q: query },
            signal: controller.signal,
          });
          if (response.data) {
            dynamicMatches = response.data.results || [];
          }
        } catch {
          // Backend unreachable - shortcuts still show, just no dynamic results
        }

        if (!cancelled) {
          setResults([...staticMatches, ...dynamicMatches]);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        clearTimeout(fetchTimeout);
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const jumpTo = useCallback((url: string) => {
    navigate(url);
    onClose();
  }, [navigate, onClose]);

  const handleSelect = useCallback(() => {
    const items = query.trim()
      ? results
      : recentRepos.map((r) => ({
        id: r.id,
        type: "repo",
        label: r.name,
        subLabel: r.fullName,
        icon: "book",
        group: "Repositories",
        url: `/${r.owner}/${r.name}`,
      }));

    if (items[selectedIndex]) {
      jumpTo(items[selectedIndex].url);
    } else if (query.trim()) {
      // Fallback: navigate to full search results
      jumpTo(`/search?q=${encodeURIComponent(query.trim())}&type=users`);
    }
  }, [query, results, recentRepos, selectedIndex, jumpTo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(
            prev + 1,
            Math.max(results.length - 1, recentRepos.length - 1),
          ),
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSelect();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, recentRepos, selectedIndex, handleSelect, onClose]);

  const submitFeedback = async (message: string) => {
    try {
      await apiInstance.post("/search/feedback", {
        message,
        category: "search",
        url: window.location.href,
      });
      setShowFeedback(false);
      alert("Thank you for your feedback!");
    } catch (error) {
      console.error("Feedback error:", error);
    }
  };

  if (!isOpen) return null;

  // Group results
  const groupedResults: Record<string, SearchResult[]> = {};
  results.forEach((result) => {
    if (!groupedResults[result.group]) {
      groupedResults[result.group] = [];
    }
    groupedResults[result.group].push(result);
  });

  return (
    <>
      <div className="search-backdrop" onClick={onClose} />
      <div className="search-modal">
        <div className="search-header">
          <span className="material-icons search-icon">search</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search or jump to..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
          {loading && <div className="search-spinner"></div>}
        </div>

        <div className="search-body">
          {query.trim() ? (
            <>
              {/* Always-visible shortcuts */}
              <div className="search-section">
                <div className="search-section-header">Search</div>
                <div
                  className="search-result-item"
                  style={{ cursor: "pointer" }}
                  onClick={() => jumpTo(`/search?q=${encodeURIComponent(query.trim())}&type=users`)}
                >
                  <span className="material-icons result-icon">person_search</span>
                  <div className="result-content">
                    <div className="result-label">Search users for "{query}"</div>
                    <div className="result-sublabel">Find people by name or username</div>
                  </div>
                  <button className="jump-to-btn">View all →</button>
                </div>
                <div
                  className="search-result-item"
                  style={{ cursor: "pointer" }}
                  onClick={() => jumpTo(`/search?q=${encodeURIComponent(query.trim())}&type=repositories`)}
                >
                  <span className="material-icons result-icon">search</span>
                  <div className="result-content">
                    <div className="result-label">Search all of TrackCodex for "{query}"</div>
                    <div className="result-sublabel">Repos, code, users, and more</div>
                  </div>
                  <button className="jump-to-btn">Go →</button>
                </div>
              </div>
              {/* Dynamic API results */}
              {Object.keys(groupedResults).length > 0 ? (
            Object.entries(groupedResults).map(([group, items]) => (
                <div key={group} className="search-section">
                  <div className="search-section-header">{group}</div>
                  {items.map((result, idx) => (
                    <div
                      key={result.id}
                      className={`search-result-item ${selectedIndex === idx ? "selected" : ""}`}
                      onClick={() => jumpTo(result.url)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      {/* Show avatar for user results, icon for everything else */}
                      {result.type === "user" && (
                        <img
                          src={
                            result.metadata?.avatar ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(result.label)}`
                          }
                          alt={result.label}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(result.label)}`;
                          }}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "1px solid #30363d",
                            flexShrink: 0,
                          }}
                        />
                      )}
                      {result.type !== "user" && (
                        <span className="material-icons result-icon">
                          {result.icon}
                        </span>
                      )}
                      <div className="result-content">
                        <div className="result-label">{result.label}</div>
                        {result.subLabel && (
                          <div className="result-sublabel">
                            {result.subLabel}
                          </div>
                        )}
                      </div>
                      <button className="jump-to-btn">Jump to →</button>
                    </div>
                  ))}
                  {/* View all link for each group */}
                  {group === "People" && (
                    <div
                      className="search-result-item"
                      style={{ borderTop: "1px solid #21262d", opacity: 0.8 }}
                      onClick={() => jumpTo(`/search?q=${encodeURIComponent(query)}&type=users`)}
                    >
                      <span className="material-icons result-icon">person_search</span>
                      <div className="result-content">
                        <div className="result-label">View all users matching "{query}"</div>
                      </div>
                      <button className="jump-to-btn">View all →</button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="material-symbols-outlined !text-4xl text-[#8b949e] mb-2">person_search</span>
                <h3 className="text-[#c9d1d9] text-sm font-semibold mb-1">No results found for "{query}"</h3>
                <p className="text-[#8b949e] text-xs mb-4">Try different keywords, or search all users below.</p>
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-sm text-[#c9d1d9] hover:border-[#58a6ff] hover:text-[#58a6ff] transition-all"
                  onClick={() => jumpTo(`/search?q=${encodeURIComponent(query)}&type=users`)}
                >
                  <span className="material-icons" style={{ fontSize: 16 }}>person</span>
                  Search "{query}" in Users
                </button>
              </div>
            )}
            </>
          ) : (
            // Recent repositories
            <>
              {recentRepos.length > 0 && (
                <div className="search-section">
                  <div className="search-section-header">Repositories</div>
                  {recentRepos.map((repo, idx) => (
                    <div
                      key={repo.id}
                      className={`search-result-item ${selectedIndex === idx ? "selected" : ""}`}
                      onClick={() => jumpTo(`/${repo.owner}/${repo.name}`)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <span className="material-icons result-icon">book</span>
                      <div className="result-content">
                        <div className="result-label">{repo.fullName}</div>
                      </div>
                      <button className="jump-to-btn">Jump to →</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Copilot Section */}
              <div className="search-section">
                <div className="search-section-header">Copilot</div>
                <div className="search-result-item copilot-item">
                  <span className="material-icons result-icon">chat</span>
                  <div className="result-content">
                    <div className="result-label">Chat with Copilot</div>
                  </div>
                  <span className="copilot-cta">
                    Start a new Copilot thread
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="search-footer">
          <button
            className="footer-link"
            onClick={() => setShowSyntaxTips(true)}
          >
            Search syntax tips
          </button>
          <button className="footer-link" onClick={() => setShowFeedback(true)}>
            Give feedback
          </button>
        </div>
      </div>

      {/* Syntax Tips Modal */}
      {showSyntaxTips && (
        <div
          className="tips-modal-backdrop"
          onClick={() => setShowSyntaxTips(false)}
        >
          <div className="tips-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Search Syntax Tips</h3>
            <ul>
              <li>
                <code>repo:owner/name</code> - Search in specific repository
              </li>
              <li>
                <code>org:name</code> - Search in organization
              </li>
              <li>
                <code>user:username</code> - Find user
              </li>
              <li>
                <code>type:repo</code> - Filter by repositories
              </li>
              <li>
                <code>language:javascript</code> - Filter by language
              </li>
            </ul>
            <button onClick={() => setShowSyntaxTips(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div
          className="tips-modal-backdrop"
          onClick={() => setShowFeedback(false)}
        >
          <div className="tips-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Send Feedback</h3>
            <textarea
              placeholder="Tell us what you think..."
              rows={5}
              id="feedback-input"
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  const input = document.getElementById(
                    "feedback-input",
                  ) as HTMLTextAreaElement;
                  submitFeedback(input.value);
                }}
              >
                Submit
              </button>
              <button onClick={() => setShowFeedback(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalSearchModal;


