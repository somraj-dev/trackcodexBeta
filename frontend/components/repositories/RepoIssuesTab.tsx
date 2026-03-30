import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Repository } from "../../types";
import { api } from "../../services/infra/api";

interface IssueLabel {
  id: string;
  name: string;
  color: string;
}

interface IssueAssignee {
  id: string;
  username: string;
  avatar?: string;
}

interface Milestone {
  id: string;
  title: string;
  dueOn?: string;
}

interface Issue {
  id: string;
  number: number;
  title: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  author?: {
    username: string;
    avatar?: string;
  };
  labels?: IssueLabel[];
  assignees?: IssueAssignee[];
  milestone?: Milestone;
  _count?: {
    comments: number;
  };
}

interface RepoIssuesTabProps {
  repo: Repository;
}

const RepoIssuesTab: React.FC<RepoIssuesTabProps> = ({ repo }) => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"OPEN" | "CLOSED">("OPEN");
  const [searchQuery, setSearchQuery] = useState("");

  // Metadata State for options and counts
  const [availableLabels, setAvailableLabels] = useState<IssueLabel[]>([]);
  const [availableMilestones, setAvailableMilestones] = useState<Milestone[]>([]);
  const [counts, setCounts] = useState({ open: 0, closed: 0 });

  const fetchIssues = React.useCallback(async () => {
    setLoading(true);
    try {
      const [data, allIssues] = await Promise.all([
        api.repositories.getIssues(repo.id, filter),
        api.repositories.getIssues(repo.id, "ALL").catch(() => [])
      ]);
      setIssues(Array.isArray(data) ? data : []);
      
      const open = (allIssues as Issue[]).filter((i) => i.status === "OPEN").length;
      const closed = (allIssues as Issue[]).filter((i) => i.status === "CLOSED").length;
      setCounts({ open, closed });
    } catch (err) {
      console.error("Failed to fetch issues", err);
    } finally {
      setLoading(false);
    }
  }, [repo.id, filter]);

  const fetchMetadata = React.useCallback(async () => {
    try {
      const [labels, milestones] = await Promise.all([
        api.repositories.getLabels(repo.id),
        api.repositories.getMilestones(repo.id)
      ]);
      setAvailableLabels(labels || []);
      setAvailableMilestones(milestones || []);
    } catch (err) {
      console.error("Failed to fetch metadata", err);
    }
  }, [repo.id]);

  useEffect(() => {
    fetchIssues();
    fetchMetadata();
  }, [fetchIssues, fetchMetadata]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gh-text-secondary">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold animate-pulse">Syncing Issues...</p>
      </div>
    );
  }

  const filteredIssues = issues.filter(i => 
    i.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.number.toString() === searchQuery
  );

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 p-0 sm:p-4">
      {/* Top Bar - Matching Mockup */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex-1 flex items-center bg-gh-bg-secondary border border-gh-border rounded-md overflow-hidden transition-all focus-within:border-primary group">
          <div className="flex-1 relative">
            <input
              type="text"
              id="search-issues-input"
              title="Search Issues"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Issues"
              className="w-full bg-transparent px-4 py-1.5 text-sm text-gh-text focus:outline-none placeholder:text-gh-text-tertiary"
            />
          </div>
          <button 
            type="button" 
            aria-label="Search"
            className="px-3 py-1.5 border-l border-gh-border text-gh-text-tertiary hover:bg-gh-bg-tertiary transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined !text-[18px]">search</span>
          </button>
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
              <span className="bg-gh-bg-tertiary px-1.5 rounded-full text-[10px] font-bold">
                {availableMilestones.length}
              </span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/${repo.owner?.username || 'user'}/${repo.name}/issues/new`)}
            className="px-4 py-1.5 bg-[#238636] hover:bg-[#2ea043] border border-transparent rounded-md text-sm font-bold text-white shadow-sm transition-all"
          >
            New issue
          </button>
        </div>
      </div>

      {/* Main List Container */}
      <div className="border border-gh-border rounded-xl bg-gh-bg-secondary flex flex-col overflow-hidden shadow-sm">
        {/* List Header Toggles */}
        <div className="px-4 py-3 bg-gh-bg border-b border-gh-border flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <input 
                type="checkbox" 
                id="select-all-issues"
                aria-label="Select all issues"
                className="rounded border-gh-border bg-gh-bg-secondary text-primary focus:ring-primary mr-1" 
              />
            </div>
            <button
               type="button"
               onClick={() => setFilter("OPEN")}
               className={`flex items-center gap-2 transition-colors ${filter === "OPEN" ? 'text-gh-text' : 'text-gh-text-secondary hover:text-gh-text'}`}
            >
               <span className="text-sm font-bold">Open</span>
               <span className="bg-gh-bg-tertiary px-1.5 py-0.25 rounded-full text-[11px] font-bold">
                 {counts.open}
               </span>
            </button>
            <button
               type="button"
               onClick={() => setFilter("CLOSED")}
               className={`flex items-center gap-2 transition-colors ${filter === "CLOSED" ? 'text-gh-text' : 'text-gh-text-secondary hover:text-gh-text'}`}
            >
               <span className="text-sm font-bold">Closed</span>
               <span className="bg-gh-bg-tertiary px-1.5 py-0.25 rounded-full text-[11px] font-bold">
                 {counts.closed}
               </span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-gh-text-secondary overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {["Author", "Labels", "Projects", "Milestones", "Assignees"].map((f) => (
              <button key={f} type="button" className="flex items-center gap-1 hover:text-gh-text transition-colors whitespace-nowrap">
                {f}
                <span className="material-symbols-outlined !text-[14px]">arrow_drop_down</span>
              </button>
            ))}
            <button type="button" className="flex items-center gap-1 hover:text-gh-text transition-colors whitespace-nowrap ml-2">
              <span className="material-symbols-outlined !text-[14px]">sort</span>
              Newest
              <span className="material-symbols-outlined !text-[14px]">arrow_drop_down</span>
            </button>
          </div>
        </div>

        {/* Issue List Content */}
        {filteredIssues.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center animate-in fade-in duration-300">
            <h3 className="text-xl font-bold text-gh-text mb-2">No results</h3>
            <p className="text-gh-text-secondary">Try adjusting your search filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gh-border">
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => navigate(`/repo/${repo.id}/issues/${issue.number}`)}
                className="flex items-start gap-3 p-4 hover:bg-gh-bg-tertiary transition-all cursor-pointer group"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/repo/${repo.id}/issues/${issue.number}`); }}
              >
                <input 
                  type="checkbox" 
                  aria-label={`Select issue ${issue.number}`}
                  className="mt-1 rounded border-gh-border bg-gh-bg-secondary text-primary focus:ring-primary" 
                  onClick={(e) => e.stopPropagation()} 
                />
                <span
                  className={`material-symbols-outlined !text-[20px] mt-0.5 ${issue.status === "CLOSED"
                    ? "text-purple-500"
                    : "text-green-500"
                    }`}
                >
                  {issue.status === "CLOSED" ? "check_circle" : "radio_button_unchecked"}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[16px] font-bold text-gh-text group-hover:text-primary truncate transition-colors leading-tight">
                      {issue.title}
                    </h3>
                    <div className="flex gap-1">
                      {issue.labels?.slice(0, 3).map((label: IssueLabel) => (
                        <span key={label.id} className="px-2 py-0.5 rounded-full text-[10px] font-bold border" style={{ backgroundColor: `${label.color}10`, borderColor: `${label.color}30`, color: label.color }}>
                          {label.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gh-text-tertiary">
                    <span className="font-medium">#{issue.number}</span>
                    <span>opened {new Date(issue.createdAt).toLocaleDateString()}</span>
                    <span>by</span>
                    <span className="font-bold text-gh-text-secondary hover:text-primary transition-colors">
                      {issue.author?.username || "unknown"}
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-3">
                   {issue.assignees?.map((a) => (
                    <div key={a.id} className="size-5 rounded-full bg-gh-bg-tertiary border border-gh-border flex items-center justify-center text-[8px] font-bold uppercase shadow-sm">
                      {a.username.charAt(0)}
                    </div>
                  ))}
                  {issue._count && issue._count.comments > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gh-text-tertiary">
                      <span className="material-symbols-outlined !text-[16px]">comment</span>
                      {issue._count.comments}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RepoIssuesTab;
