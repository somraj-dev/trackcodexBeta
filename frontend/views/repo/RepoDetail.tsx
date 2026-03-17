import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { MOCK_REPOS } from "../../constants";
import PostJobModal from "../../components/jobs/PostJobModal";
import { api } from "../../services/infra/api";
import { useRealtime } from "../../contexts/RealtimeContext";

// Tabs
import RepoCodeTab from "../../components/repositories/RepoCodeTab";
import RepoIssuesTab from "../../components/repositories/RepoIssuesTab";
import RepoPullRequestsTab from "../../components/repositories/RepoPullRequestsTab";
import RepoDiscussionsTab from "../../components/repositories/RepoDiscussionsTab";
import RepoWikiTab from "../../components/repositories/RepoWikiTab";
import RepoActionsTab from "../../components/repositories/RepoActionsTab";
import RepoProjectsTab from "../../components/repositories/RepoProjectsTab";
import RepoSecurityTab from "../../components/repositories/RepoSecurityTab";
import RepoInsightsTab from "../../components/repositories/RepoInsightsTab";
import RepoSettingsTab from "../../components/repositories/RepoSettingsTab";
import RepoReleasesTab from "../../components/repositories/RepoReleasesTab";
import RepoTagsTab from "../../components/repositories/RepoTagsTab";
import RepoBranchesTab from "../../components/repositories/RepoBranchesTab";
import RepoContributorsTab from "../../components/repositories/RepoContributorsTab";
import RepoCommitsTab from "../../components/repositories/RepoCommitsTab";
import ActivityFeed from "../../components/shared/ActivityFeed";

const RepoDetailView = () => {
  const { id, owner, repo: repoName } = useParams();
  const navigate = useNavigate();
  const { isConnected, presence, send, subscribe } = useRealtime();
  const location = useLocation();
  const [repo, setRepo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Code");
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isForking, setIsForking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLaunchingWorkspace, setIsLaunchingWorkspace] = useState(false);
  const [isStarring, setIsStarring] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [ciStatus, setCiStatus] = useState<{ status: string; conclusion: string } | null>(null);
  const [extraCounts, setExtraCounts] = useState<{
    discussions: number;
    actions: number;
    releases: number;
    tags: number;
    contributors: number;
    branches: number;
    wiki: number;
  }>({
    discussions: 0,
    actions: 0,
    releases: 0,
    tags: 0,
    contributors: 0,
    branches: 0,
    wiki: 0,
  });

  // Deep linking for Code Viewer
  useEffect(() => {
    if (location.pathname.includes("/blob/")) {
      setActiveTab("Code");
    }
  }, [location.pathname]);

  const handleFork = async () => {
    if (isForking) return;
    setIsForking(true);
    try {
      const res = await fetch(`/api/v1/repositories/${id}/fork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Fork failed");
      }
      const newRepo = await res.json();
      navigate(`/repo/${newRepo.id}`);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to fork repository.");
    } finally {
      setIsForking(false);
    }
  };

  const handleLaunchWorkspace = async () => {
    if (isLaunchingWorkspace || !repo) return;
    setIsLaunchingWorkspace(true);

    // We navigate directly to the workspace view.
    // VSCodeWorkspaceView.tsx handles checking if a workspace exists
    // and starting the actual docker container automatically!
    navigate(`/workspace/${repo.id}?repoId=${repo.id}`);
  };

  const handleUseTemplate = async () => {
    if (isGenerating) return;
    const newName = prompt("Enter a name for your new repository:");
    if (!newName) return;

    setIsGenerating(true);
    try {
      const res = await fetch(`/api/v1/repositories/${id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Template generation failed");
      }
      const newRepo = await res.json();
      navigate(`/repo/${newRepo.id}`);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to generate from template.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleStar = async () => {
    if (isStarring || !repo) return;
    setIsStarring(true);
    try {
      if (repo.isStarred) {
        await api.repositories.unstar(repo.id);
        setRepo({ ...repo, isStarred: false, stars: Math.max(0, (repo.stars || 0) - 1) });
      } else {
        await api.repositories.star(repo.id);
        setRepo({ ...repo, isStarred: true, stars: (repo.stars || 0) + 1 });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to toggle star.");
    } finally {
      setIsStarring(false);
    }
  };

  const handleTogglePin = async () => {
    if (isPinning || !repo) return;
    setIsPinning(true);
    try {
      if (repo.isPinned) {
        await api.repositories.unpin(repo.id);
        setRepo({ ...repo, isPinned: false });
      } else {
        await api.repositories.pin(repo.id);
        setRepo({ ...repo, isPinned: true });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to toggle pin.");
    } finally {
      setIsPinning(false);
    }
  };

  const handleWatchDrop = async (level: string) => {
    if (isWatching || !repo) return;
    setIsWatching(true);
    try {
      if (level === "IGNORE") {
        await api.repositories.unwatch(repo.id);
        setRepo({ ...repo, watchLevel: null });
      } else {
        await api.repositories.watch(repo.id, level);
        setRepo({ ...repo, watchLevel: level });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update watch status.");
    } finally {
      setIsWatching(false);
    }
  };

  useEffect(() => {
    const fetchRepo = async () => {
      setLoading(true);
      try {
        let data;
        if (id && id !== "undefined") {
          data = await api.repositories.get(id);
        } else if (owner && repoName) {
          data = await api.repositories.getByName(owner, repoName);
        } else {
          throw new Error("No repository ID or owner/name provided in URL");
        }
        setRepo(data);

        // Fetch CI status
        try {
          const runs = await api.ciRuns.list(data.id);
          if (runs && runs.length > 0) {
            setCiStatus({ status: runs[0].status, conclusion: runs[0].conclusion });
          }
        } catch (ciErr) {
          console.warn("Failed to fetch CI status", ciErr);
        }

        // Fetch Extra Counts for badges
        try {
          const [branches, tags, releases, contributors, workflows, wiki] = await Promise.all([
            api.repositories.getBranches(data.id).catch(() => []),
            api.repositories.getTags(data.id).catch(() => []),
            api.repositories.getReleases(data.id).catch(() => []),
            api.repositories.getContributors(data.id).catch(() => []),
            api.workflows.list(data.id).catch(() => []),
            api.repositories.getWikiPages(data.id).catch(() => []),
          ]);

          setExtraCounts({
            branches: branches.length,
            tags: tags.length,
            releases: releases.length,
            contributors: contributors.length,
            actions: workflows.length,
            wiki: Array.isArray(wiki) ? wiki.length : 0,
            discussions: 0, // Placeholder if no API yet
          });
        } catch (countErr) {
          console.warn("Failed to fetch extra counts", countErr);
        }
      } catch (err) {
        console.error("Failed to fetch repo detail", err);
        // We could still fallback to mock here if we want, but the goal is production-ready
        // Let's at least show an error if it completely fails
        setError("Failed to load repository details.");
      } finally {
        setLoading(false);
      }
    };

    fetchRepo();
  }, [id, owner, repoName, setError]);

  useEffect(() => {
    // Determine the unique identifier for realtime room (use id or fallback to owner/name)
    const roomId = id || (owner && repoName ? `${owner}/${repoName}` : null);

    if (isConnected && roomId) {
      send({ type: "WORKSPACE_JOIN", workspaceId: roomId });

      const unsubscribe = subscribe((event) => {
        if (event.type === "REPOSITORY_UPDATE" && (event.repoId === id || event.repoId === roomId)) {
          // Realtime: Repository updated externally
          setRepo((prev: any) => ({ ...prev, settings: event.settings }));
        }
      });

      return () => {
        send({ type: "WORKSPACE_LEAVE", workspaceId: roomId });
        unsubscribe();
      };
    }
  }, [isConnected, id, owner, repoName, send, subscribe]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-red-500/30 rounded-xl bg-red-500/5">
        <span className="material-symbols-outlined text-red-500 text-4xl mb-4">error</span>
        <p className="text-red-500 text-sm font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-gh-bg-secondary border border-gh-border text-gh-text rounded-md text-xs font-bold hover:bg-gh-bg-tertiary transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gh-bg text-gh-text-secondary">
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold animate-pulse">
            Synchronizing Repository Hardware...
          </p>
        </div>
      </div>
    );
  }

  if (!repo) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case "Code":
        return <RepoCodeTab repo={repo} />;
      case "Commits":
        return <RepoCommitsTab repo={repo} />;
      case "Issues":
        return <RepoIssuesTab repo={repo} />;
      case "Pull Requests":
        return <RepoPullRequestsTab repo={repo} />;
      case "Discussions":
        return <RepoDiscussionsTab repo={repo} />;
      case "Actions":
        return <RepoActionsTab />;
      case "Wiki":
        return <RepoWikiTab repo={repo} />;
      case "Projects":
        return <RepoProjectsTab repo={repo} />;
      case "Security":
        return <RepoSecurityTab />;
      case "Insights":
        return <RepoInsightsTab repo={repo} />;
      case "Releases":
        return <RepoReleasesTab repo={repo} />;
      case "Tags":
        return <RepoTagsTab repo={repo} />;
      case "Branches":
        return <RepoBranchesTab repo={repo} />;
      case "Contributors":
        return <RepoContributorsTab repo={repo} />;
      case "Settings":
        return <RepoSettingsTab repo={repo} />;
      case "Activity":
        return <ActivityFeed repoId={repo.id} showTitle={false} limit={50} />;
      default:
        return (
          <div className="bg-gh-bg border border-gh-border rounded-lg p-16 text-center text-gh-text-secondary">
            <span className="material-symbols-outlined !text-[48px] mb-4 opacity-50">
              construction
            </span>
            <h3 className="text-xl font-bold text-gh-text mb-2">{activeTab}</h3>
            <p className="max-w-md mx-auto">
              This section is currently under development.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="font-display text-gh-text h-full overflow-y-auto relative bg-gh-bg scrollbar-thin">
      {/* HEADER SECTION */}
      <div className="bg-gh-bg-secondary border-b border-gh-border pt-4 sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-8 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-gh-text-secondary !text-[20px]">
                book
              </span>
              <div className="flex items-center gap-2 text-xl">
                <span
                  className="text-primary cursor-pointer hover:underline"
                  onClick={() => navigate("/repositories")}
                >
                  {repo.owner?.username || repo.owner?.name || "track-codex"}
                </span>
                <span className="text-gh-text-secondary">/</span>
                <span className="font-bold text-primary cursor-pointer hover:underline">
                  {repo.name}
                </span>
                <span className="px-2 py-0.5 rounded-full border border-gh-border text-[12px] font-medium text-gh-text-secondary capitalize bg-transparent ml-2">
                  {repo.visibility?.toLowerCase() || "public"}
                </span>

                {repo.parent && (
                  <div className="text-xs text-gh-text-secondary mt-1 ml-1">
                    forked from <span className="text-primary hover:underline cursor-pointer" onClick={() => navigate(`/repo/${repo.parent.id}`)}>{repo.parent.full_name || `${repo.parent.owner.username}/${repo.parent.name}`}</span>
                  </div>
                )}

                <button
                  onClick={handleTogglePin}
                  disabled={isPinning}
                  className={`ml-2 flex items-center justify-center p-1 rounded-full transition-colors ${
                    repo.isPinned 
                      ? "text-primary bg-primary/10" 
                      : "text-gh-text-secondary hover:text-gh-text hover:bg-gh-bg-tertiary"
                  } disabled:opacity-50`}
                  title={repo.isPinned ? "Unpin repository" : "Pin repository"}
                >
                  <span className="material-symbols-outlined !text-[16px]">
                    {repo.isPinned ? "keep_public" : "keep"}
                  </span>
                </button>

                {ciStatus && (
                  <div
                    title={`CI/CD: ${ciStatus.status} (${ciStatus.conclusion || 'running'})`}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ml-3 transition-all ${ciStatus.conclusion === 'success'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : ciStatus.conclusion === 'failure'
                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'
                      }`}
                  >
                    <span className="material-symbols-outlined !text-[14px]">
                      {ciStatus.conclusion === 'success' ? 'check_circle' : ciStatus.conclusion === 'failure' ? 'cancel' : 'sync'}
                    </span>
                    {ciStatus.conclusion === 'success' ? 'Pass' : ciStatus.conclusion === 'failure' ? 'Fail' : 'CI Running'}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {presence && Array.isArray(presence) && presence.length > 0 && (
                <div className="flex -space-x-2 mr-2">
                  {presence.map((uid) => (
                    <div
                      key={uid}
                      className="size-7 rounded-full border-2 border-gh-bg bg-primary/20 flex items-center justify-center text-[10px] font-bold text-white uppercase"
                      title={`User ${uid} is online`}
                    >
                      {uid.substring(0, 1)}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center bg-gh-bg-secondary border border-gh-border rounded-md overflow-hidden text-sm">
                {repo.isTemplate && (
                  <button
                    onClick={handleUseTemplate}
                    disabled={isGenerating}
                    className="px-3 py-1 bg-primary text-white font-bold border-r border-gh-border hover:bg-opacity-90 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <span
                      className={`material-symbols-outlined !text-[16px] ${isGenerating ? "animate-spin" : ""}`}
                    >
                      {isGenerating ? "sync" : "content_copy"}
                    </span>
                    {isGenerating ? "Generating..." : "Use this template"}
                  </button>
                )}
                {/* Added Launch Workspace action right beside other primary actions */}
                <button
                  onClick={handleLaunchWorkspace}
                  disabled={isLaunchingWorkspace}
                  className="px-3 py-1 bg-gh-bg-secondary text-gh-text font-bold border-r border-gh-border hover:bg-gh-bg-tertiary flex items-center gap-2 transition-all disabled:opacity-50 group"
                >
                  <span
                    className={`material-symbols-outlined !text-[16px] group-hover:text-primary transition-colors ${isLaunchingWorkspace ? "animate-spin" : ""}`}
                  >
                    {isLaunchingWorkspace ? "sync" : "terminal"}
                  </span>
                  {isLaunchingWorkspace ? "Launching..." : "Launch in Workspace"}
                </button>
                <div className="relative group/watch">
                  <button className="px-3 py-1 text-gh-text font-medium border-r border-gh-border hover:bg-gh-bg-tertiary flex items-center gap-2 transition-colors disabled:opacity-50" disabled={isWatching}>
                    <span className="material-symbols-outlined !text-[16px]">
                      {repo.watchLevel ? "visibility" : "visibility_off"}
                    </span>
                    {isWatching ? "..." : (repo.watchLevel === "ALL" ? "Watching" : repo.watchLevel === "PARTICIPATING" ? "Participating" : "Watch")}
                    <span className="material-symbols-outlined !text-[16px] opacity-70">arrow_drop_down</span>
                  </button>
                  <div className="absolute right-0 mt-1 w-48 bg-gh-bg-secondary border border-gh-border rounded-md shadow-lg hidden group-hover/watch:block z-50 py-1">
                    <button onClick={() => handleWatchDrop("ALL")} className="w-full text-left px-4 py-2 text-sm text-gh-text hover:bg-primary hover:text-white transition-colors">
                      All Activity
                    </button>
                    <button onClick={() => handleWatchDrop("PARTICIPATING")} className="w-full text-left px-4 py-2 text-sm text-gh-text hover:bg-primary hover:text-white transition-colors">
                      Participating
                    </button>
                    <button onClick={() => handleWatchDrop("IGNORE")} className="w-full text-left px-4 py-2 text-sm text-gh-text hover:bg-primary hover:text-white transition-colors">
                      Ignore
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleFork}
                  disabled={isForking}
                  className="px-3 py-1 text-gh-text font-medium border-r border-gh-border hover:bg-gh-bg-tertiary flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <span
                    className={`material-symbols-outlined !text-[16px] ${isForking ? "animate-spin" : ""}`}
                  >
                    {isForking ? "sync" : "fork_right"}
                  </span>
                  {isForking ? "Forking..." : "Fork"}
                  <span className="bg-gh-bg-tertiary px-1.5 rounded-full text-xs">
                    {repo.forks}
                  </span>
                </button>
                <button 
                  onClick={handleToggleStar}
                  disabled={isStarring}
                  className={`px-3 py-1 ${repo.isStarred ? 'text-yellow-400' : 'text-gh-text'} font-medium hover:bg-gh-bg-tertiary flex items-center gap-2 transition-colors disabled:opacity-50`}
                >
                  <span className={`material-symbols-outlined !text-[16px] ${repo.isStarred ? 'fill-current text-yellow-500' : ''}`}>
                    star
                  </span>
                  {isStarring ? "..." : (repo.isStarred ? "Starred" : "Star")}
                  <span className="bg-gh-bg-tertiary px-1.5 border border-gh-border rounded-full text-xs ml-1 text-gh-text">
                    {repo.stars || 0}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-1 text-sm font-medium text-gh-text overflow-x-auto no-scrollbar scrollbar-none">
            {[
              "Code",
              "Issues",
              "Pull Requests",
              "Commits",
              "Discussions",
              "Actions",
              "Projects",
              "Wiki",
              "Security",
              "Insights",
              "Releases",
              "Tags",
              "Branches",
              "Contributors",
              "Settings",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 border-b-[3px] hover:bg-gh-bg rounded-t-md transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab ? "border-primary font-bold text-gh-text" : "border-transparent text-gh-text-secondary"}`}
              >
                {/* Icons for tabs */}
                <span className="material-symbols-outlined !text-[18px]">
                  {tab === "Code"
                    ? "code"
                    : tab === "Commits"
                      ? "history"
                      : tab === "Issues"
                      ? "adjust"
                      : tab === "Pull Requests"
                        ? "schema"
                        : tab === "Activity"
                          ? "history"
                          : tab === "Discussions"
                            ? "chat_bubble"
                            : tab === "Actions"
                              ? "play_circle"
                              : tab === "Projects"
                                ? "table_chart"
                                : tab === "Wiki"
                                  ? "menu_book"
                                  : tab === "Security"
                                    ? "security"
                                      : tab === "Settings"
                                        ? "settings"
                                        : tab === "Releases"
                                          ? "sell"
                                          : tab === "Tags"
                                            ? "label"
                                            : tab === "Branches"
                                              ? "account_tree"
                                              : tab === "Contributors"
                                                ? "groups"
                                                : "insights"}
                </span>
                {tab}
                {tab === "Issues" && repo.open_issues_count !== undefined && (
                  <span className="px-1.5 py-0.5 bg-gh-bg-secondary border border-gh-border rounded-full text-[10px] ml-1 opacity-70">
                    {repo.open_issues_count}
                  </span>
                )}
                {tab === "Pull Requests" && repo.open_pull_requests_count !== undefined && (
                  <span className="px-1.5 py-0.5 bg-gh-bg-secondary border border-gh-border rounded-full text-[10px] ml-1 opacity-70">
                    {repo.open_pull_requests_count}
                  </span>
                )}
                {tab === "Actions" && extraCounts.actions > 0 && (
                  <span className="px-1.5 py-0.5 bg-gh-bg-secondary border border-gh-border rounded-full text-[10px] ml-1 opacity-70">
                    {extraCounts.actions}
                  </span>
                )}
                {tab === "Releases" && extraCounts.releases > 0 && (
                  <span className="px-1.5 py-0.5 bg-gh-bg-secondary border border-gh-border rounded-full text-[10px] ml-1 opacity-70">
                    {extraCounts.releases}
                  </span>
                )}
                {tab === "Tags" && extraCounts.tags > 0 && (
                  <span className="px-1.5 py-0.5 bg-gh-bg-secondary border border-gh-border rounded-full text-[10px] ml-1 opacity-70">
                    {extraCounts.tags}
                  </span>
                )}
                {tab === "Branches" && extraCounts.branches > 0 && (
                  <span className="px-1.5 py-0.5 bg-gh-bg-secondary border border-gh-border rounded-full text-[10px] ml-1 opacity-70">
                    {extraCounts.branches}
                  </span>
                )}
                {tab === "Contributors" && extraCounts.contributors > 0 && (
                  <span className="px-1.5 py-0.5 bg-gh-bg-secondary border border-gh-border rounded-full text-[10px] ml-1 opacity-70">
                    {extraCounts.contributors}
                  </span>
                )}
                {tab === "Wiki" && extraCounts.wiki > 0 && (
                  <span className="px-1.5 py-0.5 bg-gh-bg-secondary border border-gh-border rounded-full text-[10px] ml-1 opacity-70">
                    {extraCounts.wiki}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-8 py-6">
        {renderTabContent()}
      </div>

      <PostJobModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        onSubmit={() => { }}
        initialData={{
          repoId: repo.id,
          description: `Hiring an expert for ${repo.name} repository tasks.`,
        }}
      />
    </div>
  );
};

export default RepoDetailView;



