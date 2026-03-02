import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Repository } from "../types";
import { githubService, GitHubRepo } from "../services/github";
import { gitlabService, GitLabRepo } from "../services/gitlab";
import EmptyState from "../components/common/EmptyState";

// ... existing helper components (AIHealthIndicator, SecurityIndicator) ...
const AIHealthIndicator = ({
  score,
  label,
}: {
  score: string;
  label: string;
}) => {
  const getColors = () => {
    const s = String(score || "B");
    if (s.startsWith("A"))
      return {
        text: "text-emerald-400",
        border: "border-emerald-500/30",
        bg: "bg-emerald-500/10",
      };
    if (s.startsWith("B"))
      return {
        text: "text-amber-400",
        border: "border-amber-500/30",
        bg: "bg-amber-500/10",
      };
    return {
      text: "text-rose-400",
      border: "border-rose-500/30",
      bg: "bg-rose-500/10",
    };
  };
  const colors = getColors();

  return (
    <div className="flex items-center gap-3">
      <div
        className={`size-10 rounded-full border-2 ${colors.border} flex items-center justify-center font-black text-xs ${colors.text} ${colors.bg}`}
      >
        {score}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest text-gh-text-secondary">
          AI Health
        </span>
        <span className={`text-[11px] font-bold ${colors.text}`}>{label}</span>
      </div>
    </div>
  );
};

const SecurityIndicator = ({ status }: { status: string }) => {
  const isPassing = status === "Passing";
  return (
    <div className="flex items-center gap-3">
      <div
        className={`size-10 rounded-full border-2 ${isPassing ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-rose-500/30 text-rose-400 bg-rose-500/10"} flex items-center justify-center`}
      >
        <span className="material-symbols-outlined !text-[20px] filled">
          {isPassing ? "verified" : "error"}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest text-gh-text-secondary">
          Security
        </span>
        <span
          className={`text-[11px] font-bold ${isPassing ? "text-gh-text" : "text-rose-400"}`}
        >
          {status}
        </span>
      </div>
    </div>
  );
};

const Repositories = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All Repos");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRepos = async () => {
      setLoading(true);
      try {
        // Helper to enrich repo data with UI indicators
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

        // 1. Try backend API first
        let allRepos: Repository[] = [];
        try {
          const data = await api.repositories.list();
          const safeData = Array.isArray(data) ? data : [];
          allRepos = safeData.map(enrichRepo);
        } catch (e) {
          console.warn("Backend repo list failed, trying direct fetch:", e);
        }

        // 2. If backend is empty, try auto-sync via backend
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

        // Helper: map GitHub repos to Repository format
        const mapGitHubRepos = (ghRepos: GitHubRepo[]): Repository[] =>
          ghRepos.map((repo) => ({
            id: `gh-${repo.id}`,
            name: repo.name,
            description: repo.description || "No description",
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            language: repo.language || "Unknown",
            isPublic: !repo.private,
            visibility: repo.private ? "PRIVATE" : "PUBLIC",
            updatedAt: repo.updated_at,
            lastUpdated: new Date(repo.updated_at).toLocaleDateString(),
            htmlUrl: repo.html_url,
            logo: repo.owner?.avatar_url || "",
            aiHealth: repo.stargazers_count > 500 ? "A+" : "B",
            aiHealthLabel: repo.stargazers_count > 500 ? "Excellent" : "Stable",
            securityStatus: "Passing",
            techStack: repo.language || "Unknown",
            techColor: repo.language === "Python" ? "#facc15" : "#3178c6",
            source: "github",
          } as any));

        // Helper: map GitLab repos to Repository format
        const mapGitLabRepos = (glRepos: GitLabRepo[]): Repository[] =>
          glRepos.map((repo) => ({
            id: `gl-${repo.id}`,
            name: repo.name,
            description: repo.description || "No description",
            stars: repo.star_count,
            forks: repo.forks_count,
            language: "Unknown",
            isPublic: repo.visibility === "public",
            visibility: repo.visibility === "public" ? "PUBLIC" : "PRIVATE",
            updatedAt: repo.last_activity_at,
            lastUpdated: new Date(repo.last_activity_at).toLocaleDateString(),
            htmlUrl: repo.web_url,
            logo: repo.namespace?.avatar_url || "",
            aiHealth: repo.star_count > 100 ? "A+" : "B",
            aiHealthLabel: repo.star_count > 100 ? "Excellent" : "Stable",
            securityStatus: "Passing",
            techStack: "Unknown",
            techColor: "#e24329",
            source: "gitlab",
          } as any));

        // 3. Client-side: fetch GitHub repos (server-side tokens only)
        if (allRepos.length === 0) {
          try {
            const backendToken = await api.integrations.getToken("github");
            if (backendToken.connected && backendToken.accessToken) {
              const ghRepos = await githubService.getRepos(backendToken.accessToken);
              allRepos = [...allRepos, ...mapGitHubRepos(ghRepos)];
            }
          } catch {
            // No GitHub token — skip
          }
        }

        // 4. Client-side: fetch GitLab repos (server-side tokens only)
        try {
          const backendToken = await api.integrations.getToken("gitlab");
          if (backendToken.connected && backendToken.accessToken) {
            const glRepos = await gitlabService.getRepos(backendToken.accessToken);
            allRepos = [...allRepos, ...mapGitLabRepos(glRepos)];
          }
        } catch {
          // No GitLab token — skip
        }

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
      <div className="bg-gh-bg min-h-screen p-8 max-w-[1400px] mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div className="space-y-4">
            <div className="h-10 w-64 bg-gh-border/20 animate-pulse rounded-xl"></div>
            <div className="h-4 w-96 bg-gh-border/10 animate-pulse rounded-md"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-gh-bg-secondary border border-gh-border/50 rounded-3xl h-[320px] animate-pulse relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const removeDuplicates = <T extends Record<string, any>>(
    arr: T[],
    key: keyof T,
  ): T[] => {
    return [...new Map(arr.map((item) => [item[key], item])).values()];
  };

  const renderMarkdown = (text: string) => {
    if (!text) return "";
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.*?)__/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/_(.*?)_/g, "<em>$1</em>")
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-gh-bg-secondary border border-gh-border px-1.5 py-0.5 rounded text-xs font-mono text-amber-400">$1</code>',
      )
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>',
      );
  };

  /* handleCreateRepo removed as it moved to CreateRepo.tsx */


  const filteredRepos = repos.filter((repo) => {
    if (filter === "Public") return repo.visibility === "PUBLIC";
    if (filter === "Private") return repo.visibility === "PRIVATE";
    return true;
  });

  return (
    <div className="bg-gh-bg min-h-screen flex flex-col">
      {/* Dashboard Shared Header */}
      <div className="p-8 pb-0 max-w-[1400px] w-full mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary !text-[32px]">
                account_tree
              </span>
              <h1 className="text-3xl font-black text-white uppercase tracking-tight">
                Repositories
              </h1>
            </div>
            <p className="text-gh-text-secondary text-sm max-w-2xl leading-relaxed">
              Your source repositories hub. Track AI-driven health scores and
              compliance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  await api.repositories.sync();
                  window.location.reload();
                } catch (e) {
                  console.error(e);
                } finally {
                  setLoading(false);
                }
              }}
              className="btn-glow px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined !text-[18px]">
                sync
              </span>
              Sync from Remote
            </button>
            <button
              onClick={() => navigate("/repositories/new")}
              className="btn-glow bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 hover:border-primary/50 px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95"
            >
              <span className="material-symbols-outlined !text-[20px]">
                add
              </span>
              New Repository
            </button>
          </div>
        </div>

        {/* Tab Bar Removed */}
      </div>

      {/* Content Area */}
      <div className="flex-1">
        <div className="p-8 pt-0 max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 bg-gh-bg-secondary border border-gh-border p-1 rounded-xl">
              {["All Repos", "Public", "Private", "Sources", "Forks"].map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${filter === f
                      ? "bg-primary text-white shadow-lg"
                      : "text-gh-text-secondary hover:text-gh-text"
                      }`}
                  >
                    {f}
                  </button>
                ),
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gh-text-secondary text-sm group-focus-within:text-primary transition-colors">
                  search
                </span>
                <input
                  className="bg-gh-bg-secondary border border-gh-border rounded-xl pl-10 pr-4 py-2 text-xs text-gh-text focus:ring-1 focus:ring-primary w-64 outline-none"
                  placeholder="Filter repositories..."
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRepos.length === 0 ? (
              <div className="col-span-full h-[500px] flex items-center justify-center bg-gh-bg-secondary/20 rounded-3xl border border-gh-border/50">
                <EmptyState
                  title="No Repositories Found"
                  message="Create or sync a repository to get started."
                  imageSrc="/dashboard-empty.png"
                />
              </div>
            ) : (
              filteredRepos.map((repo) => (
                <div
                  key={repo.id}
                  onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                    if ((e.target as HTMLElement).tagName !== "A") {
                      navigate(`/repo/${repo.id}`);
                    }
                  }}
                  className="card-hover-glow group bg-gh-bg-secondary border border-gh-border rounded-3xl p-7 transition-all flex flex-col relative overflow-hidden shadow-sm animate-in slide-in-from-bottom-2 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-gh-bg flex items-center justify-center text-gh-text-secondary group-hover:bg-primary/10 group-hover:text-primary transition-all border border-gh-border overflow-hidden">
                        {repo.logo ? (
                          <img
                            src={repo.logo}
                            alt={`${repo.name} logo`}
                            className="size-full object-cover"
                          />
                        ) : (
                          <span className="material-symbols-outlined !text-[28px]">
                            source
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-gh-text group-hover:text-primary transition-colors leading-none uppercase tracking-tight">
                            {repo.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="px-2 py-0.5 rounded-full border border-gh-border text-[9px] text-gh-text-secondary font-black uppercase tracking-widest">
                            {repo.visibility}
                          </span>
                          <span className="text-[10px] text-gh-text-secondary font-bold uppercase tracking-tight">
                            Updated {repo.lastUpdated}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="text-[13px] text-gh-text-secondary leading-relaxed mb-8 h-12 line-clamp-2 overflow-hidden font-medium prose prose-sm prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(repo.description),
                    }}
                  />

                  <div className="grid grid-cols-2 gap-4 bg-gh-bg border border-gh-border p-5 rounded-2xl mb-8">
                    <AIHealthIndicator
                      score={repo.aiHealth}
                      label={repo.aiHealthLabel}
                    />
                    <SecurityIndicator status={repo.securityStatus} />
                  </div>

                  <div className="mt-auto pt-6 border-t border-gh-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-5 text-[11px] font-black uppercase tracking-widest text-gh-text-secondary">
                      <div className="flex items-center gap-2">
                        <div
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: repo.techColor }}
                        ></div>
                        <span>{repo.techStack}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/workspace/${repo.id}/ide`);
                      }}
                      className="bg-primary/10 hover:bg-primary text-primary hover:text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-primary/20 shadow-lg shadow-primary/5 active:scale-95"
                    >
                      Launch Workspace
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Repositories;
