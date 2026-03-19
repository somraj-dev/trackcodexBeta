import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Project {
  id: string;
  name: string;
  domain: string;
  logo: string;
  logoType: "icon" | "image";
  repoOwner: string;
  repoName: string;
  lastCommitMessage: string;
  lastDeployDate: string;
  branch: string;
}

const MOCK_PROJECTS: Project[] = [
  {
    id: "1",
    name: "trackcodex",
    domain: "trackcodex.com",
    logo: "T",
    logoType: "icon",
    repoOwner: "somraj-dev",
    repoName: "trackcodexBeta",
    lastCommitMessage: "style: fix hardcoded dark themes in main layout and dashboard...",
    lastDeployDate: "1h ago",
    branch: "main",
  },
  {
    id: "2",
    name: "docs",
    domain: "docs.trackcodex.com",
    logo: "N",
    logoType: "icon",
    repoOwner: "somraj-dev",
    repoName: "docs",
    lastCommitMessage: "feat: update links to open in the same tab",
    lastDeployDate: "Mar 14",
    branch: "main",
  },
  {
    id: "3",
    name: "support",
    domain: "support.trackcodex.com",
    logo: "▲",
    logoType: "icon",
    repoOwner: "somraj-dev",
    repoName: "support",
    lastCommitMessage: "fix: resolve build failures by removing unused-vars and converti...",
    lastDeployDate: "Mar 14",
    branch: "main",
  },
  {
    id: "4",
    name: "browser",
    domain: "blog.trackcodex.com",
    logo: "W",
    logoType: "icon",
    repoOwner: "Quantaforge",
    repoName: "trackcodex/br...",
    lastCommitMessage: "feat: Initialize ForgeBrowser IDE project",
    lastDeployDate: "Mar 2",
    branch: "main",
  },
];

interface UsageStat {
  label: string;
  used: string;
  limit: string;
}

const USAGE_STATS: UsageStat[] = [
  { label: "Edge Requests", used: "37K", limit: "1M" },
  { label: "Fast Data Transfer", used: "483.85 MB", limit: "100 GB" },
  { label: "ISR Reads", used: "1.3K", limit: "1M" },
  { label: "Fast Origin Transfer", used: "8.96 MB", limit: "10 GB" },
];

interface PreviewItem {
  branch: string;
  message: string;
  icon: string;
  iconBg: string;
  links: string[];
}

const RECENT_PREVIEWS: PreviewItem[] = [
  {
    branch: "master",
    message: "Remove all Supabase depend...",
    icon: "T",
    iconBg: "bg-emerald-600",
    links: ["Preview", "Source", "HP2eaFZNg"],
  },
  {
    branch: "fix/footer-color",
    message: "Match footer bac...",
    icon: "N",
    iconBg: "bg-black",
    links: ["Preview", "Source", "CHD8B3FV2"],
  },
];

const ProjectCard = ({ project }: { project: Project }) => {
  const navigate = useNavigate();

  return (
    <div
      className="bg-gh-bg-secondary border border-gh-border rounded-xl p-5 hover:border-gh-text-secondary/30 transition-all cursor-pointer group relative"
      onClick={() => navigate(`/repo/${project.id}`)}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-gh-bg-tertiary border border-gh-border flex items-center justify-center text-gh-text font-bold text-lg">
            {project.logo}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gh-text group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            <p className="text-xs text-gh-text-secondary">{project.domain}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => e.stopPropagation()}
            className="size-8 rounded-full border border-gh-border flex items-center justify-center text-gh-text-secondary hover:text-gh-text hover:bg-gh-bg-tertiary transition-colors"
          >
            <span className="material-symbols-outlined !text-[16px]">edit</span>
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="size-8 rounded-full border border-gh-border flex items-center justify-center text-gh-text-secondary hover:text-gh-text hover:bg-gh-bg-tertiary transition-colors"
          >
            <span className="material-symbols-outlined !text-[16px]">more_horiz</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        <span className="material-symbols-outlined !text-[14px] text-gh-text-secondary">account_tree</span>
        <span className="text-xs text-gh-text-secondary font-medium">
          {project.repoOwner}/{project.repoName}
        </span>
      </div>

      <p className="text-xs text-gh-text-secondary mb-2 line-clamp-1">
        {project.lastCommitMessage}
      </p>

      <div className="flex items-center gap-2 text-[11px] text-gh-text-secondary/70">
        <span>{project.lastDeployDate}</span>
        <span>on</span>
        <span className="material-symbols-outlined !text-[12px]">call_split</span>
        <span>{project.branch}</span>
      </div>
    </div>
  );
};

const ProjectDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const filteredProjects = MOCK_PROJECTS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 w-full bg-gh-bg p-6 md:p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-[1200px] mx-auto">
        {/* Header: Search + View Toggles + Add New */}
        <div className="flex items-center gap-3 mb-8">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined !text-[18px] text-gh-text-secondary">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-gh-bg-secondary/60 border border-gh-border rounded-lg text-sm text-gh-text placeholder-gh-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              placeholder="Search Projects..."
            />
          </div>

          <div className="flex items-center border border-gh-border rounded-lg overflow-hidden">
            <button
              className="h-10 w-10 flex items-center justify-center text-gh-text-secondary hover:text-gh-text hover:bg-gh-bg-secondary transition-colors border-r border-gh-border"
              title="Filter"
            >
              <span className="material-symbols-outlined !text-[18px]">tune</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`h-10 w-10 flex items-center justify-center transition-colors border-r border-gh-border ${
                viewMode === "grid"
                  ? "bg-gh-bg-secondary text-gh-text"
                  : "text-gh-text-secondary hover:text-gh-text hover:bg-gh-bg-secondary"
              }`}
              title="Grid view"
            >
              <span className="material-symbols-outlined !text-[18px]">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`h-10 w-10 flex items-center justify-center transition-colors ${
                viewMode === "list"
                  ? "bg-gh-bg-secondary text-gh-text"
                  : "text-gh-text-secondary hover:text-gh-text hover:bg-gh-bg-secondary"
              }`}
              title="List view"
            >
              <span className="material-symbols-outlined !text-[18px]">view_list</span>
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              className="h-10 px-4 bg-gh-bg-secondary border border-gh-border rounded-lg text-sm font-semibold text-gh-text hover:bg-gh-bg-tertiary transition-colors flex items-center gap-2"
            >
              Add New...
              <span className="material-symbols-outlined !text-[16px]">expand_more</span>
            </button>
            {isAddMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-gh-bg-secondary border border-gh-border rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                {[
                  { icon: "web", label: "New Project", to: "/repositories/new" },
                  { icon: "account_tree", label: "New Repository", to: "/repositories/new" },
                  { icon: "terminal", label: "New Workspace", to: "/workspace/new" },
                  { icon: "upload", label: "Import Repo", to: "/repositories/import" },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setIsAddMenuOpen(false);
                      navigate(item.to);
                    }}
                    className="w-full px-3 py-2 flex items-center gap-2 text-[13px] text-gh-text-secondary hover:text-gh-text hover:bg-gh-bg-tertiary transition-colors"
                  >
                    <span className="material-symbols-outlined !text-[16px]">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Sidebar + Projects Grid */}
        <div className="flex gap-8">
          {/* Left Sidebar - Usage & Alerts */}
          <div className="w-[280px] shrink-0 hidden lg:block space-y-6">
            {/* Usage Card */}
            <div className="border border-gh-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gh-border flex items-center justify-between bg-gh-bg-secondary/30">
                <h3 className="text-xs font-bold text-gh-text-secondary uppercase tracking-wider">Usage</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gh-text-secondary">Last 30 days</span>
                  <button className="px-2 py-0.5 text-[10px] font-bold text-primary bg-primary/10 rounded-md border border-primary/20 hover:bg-primary/20 transition-colors">
                    Upgrade
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gh-border">
                {USAGE_STATS.map((stat) => (
                  <div key={stat.label} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-emerald-500"></div>
                      <span className="text-xs text-gh-text">{stat.label}</span>
                    </div>
                    <span className="text-xs text-gh-text-secondary font-mono">
                      {stat.used} / {stat.limit}
                    </span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 flex justify-center">
                <button className="text-gh-text-secondary hover:text-gh-text transition-colors">
                  <span className="material-symbols-outlined !text-[16px]">expand_more</span>
                </button>
              </div>
            </div>

            {/* Alerts Card */}
            <div className="border border-gh-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gh-border bg-gh-bg-secondary/30">
                <h3 className="text-xs font-bold text-gh-text-secondary uppercase tracking-wider">Alerts</h3>
              </div>
              <div className="p-4 text-center">
                <h4 className="text-sm font-bold text-gh-text mb-1">Get alerted for anomalies</h4>
                <p className="text-xs text-gh-text-secondary mb-4 leading-relaxed">
                  Automatically monitor your projects for anomalies and get notified.
                </p>
                <button className="px-4 py-2 bg-gh-bg-secondary border border-gh-border rounded-lg text-xs font-bold text-gh-text hover:bg-gh-bg-tertiary transition-colors w-full">
                  Upgrade to Observability Plus
                </button>
              </div>
            </div>
          </div>

          {/* Right Content - Projects */}
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-gh-text-secondary uppercase tracking-wider mb-4">Projects</h2>

            {filteredProjects.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                    : "space-y-3"
                }
              >
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <span className="material-symbols-outlined !text-[48px] text-gh-text-secondary/30 mb-4">folder_off</span>
                <p className="text-sm text-gh-text-secondary">No projects match your search.</p>
              </div>
            )}

            {/* Recent Previews */}
            <div className="mt-10">
              <h2 className="text-sm font-bold text-gh-text-secondary uppercase tracking-wider mb-4">Recent Previews</h2>
              <div className="border border-gh-border rounded-xl overflow-hidden divide-y divide-gh-border">
                {RECENT_PREVIEWS.map((preview, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-3 flex items-center justify-between hover:bg-gh-bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`size-8 rounded-lg ${preview.iconBg} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {preview.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-gh-text">{preview.branch}</span>
                          <span className="text-gh-text-secondary truncate">{preview.message}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {preview.links.map((link, i) => (
                            <span
                              key={i}
                              className="flex items-center gap-1 text-[11px] text-gh-text-secondary hover:text-primary cursor-pointer transition-colors"
                            >
                              <span className="material-symbols-outlined !text-[12px]">
                                {i === 0 ? "visibility" : i === 1 ? "code" : "tag"}
                              </span>
                              {link}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      className="size-8 rounded-full flex items-center justify-center text-gh-text-secondary hover:text-gh-text hover:bg-gh-bg-tertiary transition-colors shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="material-symbols-outlined !text-[16px]">more_horiz</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
