import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Repository } from "../../types";
import { api } from "../../services/infra/api";

interface RepoPullRequestsTabProps {
  repo: Repository;
}

const RepoPullRequestsTab: React.FC<RepoPullRequestsTabProps> = ({ repo }) => {
  const navigate = useNavigate();
  const [prs, setPrs] = useState<any[]>([]);
  const [filter, setFilter] = useState("OPEN");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Metadata State
  const [availableLabels, setAvailableLabels] = useState<any[]>([]);
  const [counts, setCounts] = useState({ open: 0, closed: 0 });

  const fetchMetadata = React.useCallback(async () => {
    try {
      const [labels, allPulls] = await Promise.all([
        api.repositories.getLabels(repo.id).catch(() => []),
        api.repositories.getPulls(repo.id, "ALL").catch(() => [])
      ]);
      setAvailableLabels(labels || []);
      
      const open = allPulls.filter((p: any) => p.status === "OPEN").length;
      const closed = allPulls.filter((p: any) => p.status === "CLOSED" || p.status === "MERGED").length;
      setCounts({ open, closed });
    } catch (err) {
      console.error(err);
    }
  }, [repo.id]);

  const fetchPrs = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.repositories.getPulls(repo.id, filter);
      setPrs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch PRs", err);
    } finally {
      setLoading(false);
    }
  }, [repo.id, filter]);

  useEffect(() => {
    fetchPrs();
    fetchMetadata();
  }, [fetchPrs, fetchMetadata]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gh-text-secondary">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold animate-pulse">Scanning Pull Requests...</p>
      </div>
    );
  }

  const filteredPrs = prs.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.number.toString() === searchQuery
  );

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 p-0 sm:p-4">
      {/* Top Bar - High Fidelity Matching Mockup */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex-1 flex items-center bg-gh-bg-secondary border border-gh-border rounded-md overflow-hidden transition-all focus-within:border-primary group">
          <button type="button" className="px-3 py-1.5 border-r border-gh-border text-xs font-bold text-gh-text-secondary hover:bg-gh-bg-tertiary flex items-center gap-1.5 transition-colors">
            Filters
            <span className="material-symbols-outlined !text-[14px]">arrow_drop_down</span>
          </button>
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gh-text-tertiary !text-[16px] group-focus-within:text-primary transition-colors">
              search
            </span>
            <input
              type="text"
              id="search-pulls-input"
              title="Search all pull requests"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all pull requests"
              className="w-full bg-transparent pl-10 pr-4 py-1.5 text-sm text-gh-text focus:outline-none placeholder:text-gh-text-tertiary"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gh-bg-secondary border border-gh-border rounded-md overflow-hidden">
            <button type="button" className="pl-3 pr-2 py-1.5 text-gh-text text-sm font-bold hover:bg-gh-bg-tertiary flex items-center gap-2 border-r border-gh-border transition-all group">
              <span className="material-symbols-outlined !text-[18px] text-gh-text-tertiary group-hover:text-primary">label</span>
              Labels
              <span className="bg-gh-bg-tertiary px-1.5 rounded-full text-[10px] font-bold">
                {availableLabels.length}
              </span>
            </button>
            <button type="button" className="pl-3 pr-2 py-1.5 text-gh-text text-sm font-bold hover:bg-gh-bg-tertiary flex items-center gap-2 transition-all group">
              <span className="material-symbols-outlined !text-[18px] text-gh-text-tertiary group-hover:text-primary">flag</span>
              Milestones
              <span className="bg-gh-bg-tertiary px-1.5 rounded-full text-[10px] font-bold">0</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/${repo.owner?.username || 'user'}/${repo.name}/pulls/new`)}
            className="px-4 py-1.5 bg-[#238636] hover:bg-[#2ea043] border border-transparent rounded-md text-sm font-bold text-white shadow-sm transition-all"
          >
            New pull request
          </button>
        </div>
      </div>

      {/* Main List Container */}
      <div className="border border-gh-border rounded-xl bg-gh-bg-secondary flex flex-col overflow-hidden">
        {/* List Header Toggles */}
        <div className="px-4 py-3 bg-gh-bg border-b border-gh-border flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <input 
                type="checkbox" 
                id="select-all-prs"
                aria-label="Select all pull requests"
                className="rounded border-gh-border bg-gh-bg-secondary text-primary focus:ring-primary mr-1" 
              />
            </div>
            <button
              type="button"
              onClick={() => setFilter("OPEN")}
              className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${filter === "OPEN" ? 'text-gh-text' : 'text-gh-text-secondary hover:text-gh-text'}`}
            >
              <span className="material-symbols-outlined !text-[18px]">call_split</span>
              {counts.open} Open
            </button>
            <button
              type="button"
              onClick={() => setFilter("CLOSED")}
              className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${filter === "CLOSED" ? 'text-gh-text' : 'text-gh-text-secondary hover:text-gh-text'}`}
            >
              <span className="material-symbols-outlined !text-[18px]">check</span>
              {counts.closed} Closed
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-gh-text-secondary overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {["Author", "Label", "Projects", "Milestones", "Reviews", "Assignee", "Sort"].map((f) => (
              <button key={f} type="button" className="flex items-center gap-1 hover:text-gh-text transition-colors whitespace-nowrap">
                {f}
                <span className="material-symbols-outlined !text-[14px]">arrow_drop_down</span>
              </button>
            ))}
          </div>
        </div>

        {/* PR List Content */}
        {filteredPrs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-16 text-center animate-in fade-in zoom-in duration-300">
            <div className="size-16 rounded-2xl bg-gh-bg-tertiary flex items-center justify-center mb-6 border border-gh-border shadow-inner">
              <span className="material-symbols-outlined !text-[40px] text-gh-text-secondary opacity-30">
                call_split
              </span>
            </div>
            <h3 className="text-xl font-bold text-gh-text mb-2">
              There aren't any open pull requests.
            </h3>
            <p className="max-w-md mx-auto text-gh-text-secondary mb-4">
              You could search <span className="text-primary hover:underline cursor-pointer">all of TrackCodex</span> or try an <span className="text-primary hover:underline cursor-pointer">advanced search</span>.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gh-border">
            {filteredPrs.map((pr) => (
              <div
                key={pr.id}
                onClick={() => navigate(`/repo/${repo.id}/pulls/${pr.number}`)}
                className="flex items-start gap-3 p-4 hover:bg-gh-bg-tertiary transition-all cursor-pointer group"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/repo/${repo.id}/pulls/${pr.number}`); }}
              >
                <input 
                  type="checkbox" 
                  aria-label={`Select pull request ${pr.number}`}
                  className="mt-1 rounded border-gh-border bg-gh-bg-secondary text-primary focus:ring-primary" 
                  onClick={(e) => e.stopPropagation()} 
                />
                <span
                  className={`material-symbols-outlined !text-[20px] mt-0.5 ${pr.status === "MERGED"
                    ? "text-purple-500"
                    : pr.status === "CLOSED"
                      ? "text-red-500"
                      : "text-green-500"
                    }`}
                >
                  {pr.status === "MERGED" ? "merge" : pr.status === "CLOSED" ? "close" : "call_split"}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[16px] font-bold text-gh-text group-hover:text-primary truncate transition-colors leading-tight">
                      {pr.title}
                    </h3>
                    <div className="flex gap-1">
                      {pr.labels?.map((labelId: string) => {
                        const label = availableLabels.find(l => l.id === labelId);
                        return label ? (
                          <span key={label.id} className="px-1.5 py-0.5 rounded-full text-[10px] font-bold border" style={{ backgroundColor: `${label.color}10`, borderColor: `${label.color}30`, color: label.color }}>
                            {label.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gh-text-tertiary">
                    <span className="font-medium">#{pr.number}</span>
                    <span>opened {new Date(pr.createdAt).toLocaleDateString()}</span>
                    <span>by</span>
                    <span className="font-bold text-gh-text-secondary hover:text-primary transition-colors">
                      {pr.author?.username || "unknown"}
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-3">
                  {pr._count && pr._count.comments > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gh-text-tertiary">
                      <span className="material-symbols-outlined !text-[16px]">comment</span>
                      {pr._count.comments}
                    </div>
                  )}
                  {pr.assignees?.map((uid: string) => (
                    <div key={uid} className="size-5 rounded-full bg-gh-bg-tertiary border border-gh-border flex items-center justify-center text-[8px] font-bold uppercase shadow-sm">
                      {uid.charAt(0)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ProTip! Footer - Redesigned */}
      <div className="flex items-center justify-center gap-2 mt-4 text-[13px] text-gh-text-secondary">
        <span className="material-symbols-outlined !text-[16px] text-amber-500">lightbulb</span>
        <span className="font-bold">ProTip!</span>
        <span>Exclude your own pull requests with</span>
        <code className="px-1.5 py-0.5 bg-gh-bg-secondary border border-gh-border rounded font-mono text-[11px] text-primary cursor-pointer hover:bg-gh-bg-tertiary transition-colors">
          -author:somraj-dev
        </code>
      </div>
    </div>
  );
};

export default RepoPullRequestsTab;
