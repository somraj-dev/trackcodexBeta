import React, { useState, useEffect } from "react";
import { api } from "../../services/infra/api";
import { useNavigate } from "react-router-dom";
import { Repository } from "../../types";
import EmptyState from "../../components/common/EmptyState";

const getTimeAgo = (dateStr?: string) => {
  if (!dateStr) return "Recently";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return `on ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
};

interface RepoRowProps {
  repo: Repository;
}

const RepoRow = ({ repo }: RepoRowProps) => {
  const navigate = useNavigate();
  const [starred, setStarred] = useState(false);

  return (
    <div className="py-6 border-b border-gh-border">
      <div className="flex items-start justify-between">
        {/* Left side */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              onClick={() => navigate(`/repo/${repo.id}`)}
              className="text-xl font-semibold text-primary hover:underline cursor-pointer"
            >
              {repo.name}
            </h3>
            <span className="px-2 py-0.5 text-[11px] font-medium text-gh-text-secondary border border-gh-border rounded-full leading-tight">
              {repo.visibility === "PRIVATE" ? "Private" : "Public"}
            </span>
          </div>

          {repo.description && (
            <p className="text-sm text-gh-text-secondary mt-1.5 max-w-2xl line-clamp-2">
              {repo.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-gh-text-secondary">
            {(repo.language || repo.techStack) && (
              <div className="flex items-center gap-1.5">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: repo.techColor || "#3178c6" }}
                ></span>
                <span>{repo.language || repo.techStack}</span>
              </div>
            )}
            {repo.stars > 0 && (
              <div className="flex items-center gap-1 hover:text-primary cursor-pointer transition-colors">
                <span className="material-symbols-outlined !text-[14px]">star</span>
                <span>{repo.stars}</span>
              </div>
            )}
            {repo.forks > 0 && (
              <div className="flex items-center gap-1 hover:text-primary cursor-pointer transition-colors">
                <span className="material-symbols-outlined !text-[14px]">call_split</span>
                <span>{repo.forks}</span>
              </div>
            )}
            <span className="text-gh-text-secondary/70">
              Updated {getTimeAgo(repo.updatedAt || repo.lastUpdated)}
            </span>
          </div>
        </div>

        {/* Right side - Star button */}
        <div className="flex-shrink-0 ml-4">
          <div className="flex items-center border border-gh-border rounded-md overflow-hidden">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setStarred(!starred);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold transition-colors ${
                starred
                  ? "bg-gh-bg-secondary text-gh-text"
                  : "bg-gh-bg-secondary/60 text-gh-text-secondary hover:text-gh-text"
              }`}
            >
              <span className={`material-symbols-outlined !text-[14px] ${starred ? "text-amber-400" : ""}`}>
                {starred ? "star" : "star_border"}
              </span>
              {starred ? "Starred" : "Star"}
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="px-1.5 py-1 border-l border-gh-border bg-gh-bg-secondary/60 text-gh-text-secondary hover:text-gh-text transition-colors"
            >
              <span className="material-symbols-outlined !text-[12px]">arrow_drop_down</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Repositories = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRepos = async () => {
      setLoading(true);
      try {
        const enrichRepo = (repo: any): Repository => ({
          ...repo,
          aiHealth: repo.aiHealth || (repo.stars > 500 ? "A+" : "B"),
          aiHealthLabel:
            repo.aiHealthLabel || (repo.stars > 500 ? "Excellent" : "Stable"),
          securityStatus: repo.securityStatus || "Passing",
          lastUpdated: repo.updatedAt
            ? new Date(repo.updatedAt).toLocaleDateString()
            : "Recent",
          techStack: repo.language || "TypeScript",
          techColor: repo.language === "Python" ? "#facc15" : "#3178c6",
          visibility: (repo.isPublic ? "PUBLIC" : "PRIVATE") as
            | "PUBLIC"
            | "PRIVATE",
        });

        let allRepos: Repository[] = [];
        try {
          const data = await api.repositories.list();
          const safeData = Array.isArray(data) ? data : [];
          allRepos = safeData.map(enrichRepo);
        } catch (e) {
          console.warn("Backend repo list failed, trying direct fetch:", e);
        }

        if (allRepos.length === 0) {
          try {
            const syncResponse = await api.repositories.sync();
            if (syncResponse?.repositories?.length > 0) {
              allRepos = syncResponse.repositories.map(enrichRepo);
            }
          } catch (syncErr) {
            console.warn("Backend sync failed:", syncErr);
          }
        }



        // Note: Direct GitHub/GitLab token fetching via api.integrations is not
        // available. Repos are fetched via the backend API and sync endpoints.
        // If those fail (e.g. CORS/network), we gracefully show an empty state.

        setRepos(allRepos);
      } catch (e) {
        console.error("❌ Failed to fetch Repositories:", e);
      } finally {
        setLoading(false);
      }
    };
    loadRepos();
  }, []);

  if (loading) {
    return (
      <div className="bg-gh-bg min-h-screen p-8 max-w-[900px] mx-auto">
        <div className="space-y-4 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-gh-bg-secondary/30 border border-gh-border/30 rounded-lg animate-pulse relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const filteredRepos = repos.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-gh-bg min-h-screen flex flex-col">
      <div className="flex-1 p-8 max-w-[900px] w-full mx-auto">
        {/* Toolbar: Search + Filters + New */}
        <div className="flex items-center gap-3 pb-5 border-b border-gh-border">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 px-3 bg-gh-bg-secondary/40 border border-gh-border rounded-md text-sm text-gh-text placeholder-gh-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              placeholder="Find a repository..."
            />
          </div>
          <button className="h-9 px-3 bg-gh-bg-secondary border border-gh-border rounded-md text-xs font-semibold text-gh-text-secondary hover:text-gh-text hover:bg-gh-border transition-colors flex items-center gap-1">
            Type
            <span className="material-symbols-outlined !text-[14px]">arrow_drop_down</span>
          </button>
          <button className="h-9 px-3 bg-gh-bg-secondary border border-gh-border rounded-md text-xs font-semibold text-gh-text-secondary hover:text-gh-text hover:bg-gh-border transition-colors flex items-center gap-1">
            Language
            <span className="material-symbols-outlined !text-[14px]">arrow_drop_down</span>
          </button>
          <button className="h-9 px-3 bg-gh-bg-secondary border border-gh-border rounded-md text-xs font-semibold text-gh-text-secondary hover:text-gh-text hover:bg-gh-border transition-colors flex items-center gap-1">
            Sort
            <span className="material-symbols-outlined !text-[14px]">arrow_drop_down</span>
          </button>
          <button
            onClick={() => navigate("/repositories/new")}
            className="h-9 px-4 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined !text-[16px]">book</span>
            New
          </button>
        </div>

        {/* Repository list */}
        {filteredRepos.length > 0 ? (
          <div>
            {filteredRepos.map((repo) => (
              <RepoRow key={repo.id} repo={repo} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center pt-8 pb-12">
            <EmptyState
              title="No Repositories Found"
              message="Establish your digital legacy. Create your first native repository or import from GitHub."
              imageSrc="/inbox-zero-dark.svg"
              action={{
                label: "Create Repository",
                onClick: () => navigate("/repositories/new"),
                icon: "add"
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Repositories;
