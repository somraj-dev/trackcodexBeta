import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ContinueWorkspaces from "../components/home/ContinueWorkspaces";
import { api } from "../services/infra/api";
import { Repository } from "../types";
import EmptyState from "../components/common/EmptyState";

interface RepoItemProps {
  repo: Repository;
}

const RepoItem = ({ repo }: RepoItemProps) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/repositories/${repo.id}`)}
      className="p-4 border-b border-gh-border last:border-gh-border hover:bg-gh-bg-secondary/50 group cursor-pointer transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <img
            src={`https://ui-avatars.com/api/?name=${repo.name.split("/")[0]}&background=random&color=fff`}
            alt=""
            className="size-5 rounded-md"
          />
          <h3 className="text-sm font-bold text-gh-text group-hover:text-primary transition-colors">
            {repo.owner ? `${repo.owner}/${repo.name}` : repo.name}
          </h3>
        </div>
        <button className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-gh-text-secondary bg-gh-bg-secondary border border-gh-border rounded-md hover:bg-gh-border transition-colors">
          <span className="material-symbols-outlined !text-[14px]">star</span>
          Star
        </button>
      </div>
      <p className="text-xs text-gh-text-secondary mt-2 mb-3 line-clamp-2">
        {repo.description || "No description provided."}
      </p>
      <div className="flex items-center gap-4 text-xs text-gh-text-secondary">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary/80"></span>
          <span>{repo.language || repo.techStack || "Plain Text"}</span>
        </div>
        <div className="flex items-center gap-1 hover:text-primary cursor-pointer transition-colors">
          <span className="material-symbols-outlined !text-[14px]">star</span>
          {repo.stars || 0}
        </div>
        <div className="text-[10px] text-gh-text-secondary/60 ml-auto">
          Updated {repo.updatedAt ? new Date(repo.updatedAt).toLocaleDateString() : "Recently"}
        </div>
      </div>
    </div>
  );
};

const HomeView = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);

  useEffect(() => {
    const fetchRepos = async () => {
      setLoadingRepos(true);
      try {
        const data = await api.repositories.list();
        setRepos(data);
      } catch (err) {
        console.error("Failed to fetch repos", err);
      } finally {
        setLoadingRepos(false);
      }
    };
    fetchRepos();
  }, []);

  return (
    <div className="flex-1 p-8 font-display">
      <div className="max-w-[1000px] mx-auto">
        <h1 className="text-2xl font-bold text-gh-text mb-6">Home</h1>

        {/* Search Bar - GitHub Style */}
        <div className="relative group mb-8">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-gh-text-secondary group-focus-within:text-gh-text transition-colors">
              search
            </span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-transparent border border-gh-border rounded-xl text-gh-text placeholder-gh-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-medium"
            placeholder="Ask anything"
          />
          <div className="absolute inset-y-0 right-3 flex items-center gap-2">
            <button className="px-2 py-1 text-xs font-bold text-gh-text-secondary hover:text-gh-text bg-gh-bg-secondary border border-gh-border rounded-md transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined !text-[14px]">chat_bubble</span>
              Ask
            </button>
            <button
              onClick={() => navigate("/repositories")}
              className="px-2 py-1 text-xs font-bold text-gh-text-secondary hover:text-gh-text bg-gh-bg-secondary border border-gh-border rounded-md transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined !text-[14px]">library_books</span>
              All repositories
            </button>
            <button
              onClick={() => navigate("/repositories/new")}
              className="size-7 flex items-center justify-center text-gh-text-secondary hover:text-gh-text bg-gh-bg-secondary border border-gh-border rounded-md transition-colors"
            >
              <span className="material-symbols-outlined !text-[16px]">add</span>
            </button>
            <div className="h-6 w-px bg-gh-border mx-1"></div>
            <span className="text-xs text-gh-text-secondary font-mono mr-2">TrackCodex AI</span>
            <button className="size-8 flex items-center justify-center text-primary hover:text-white bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
              <span className="material-symbols-outlined !text-[18px]">send</span>
            </button>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <button className="px-4 py-2 bg-gh-bg-secondary border border-gh-border rounded-lg text-sm font-bold text-gh-text-secondary hover:text-gh-text hover:border-gh-text-secondary transition-all flex items-center gap-2">
            <span className="material-symbols-outlined !text-[18px]">task_alt</span>
            Task
          </button>
          <button className="px-4 py-2 bg-gh-bg-secondary border border-gh-border rounded-lg text-sm font-bold text-gh-text-secondary hover:text-gh-text hover:border-gh-text-secondary transition-all flex items-center gap-2">
            <span className="material-symbols-outlined !text-[18px]">adjust</span>
            Create issue
          </button>
          <button className="px-4 py-2 bg-gh-bg-secondary border border-gh-border rounded-lg text-sm font-bold text-gh-text-secondary hover:text-gh-text hover:border-gh-text-secondary transition-all flex items-center gap-2">
            <span className="material-symbols-outlined !text-[18px]">code</span>
            Write code
          </button>
          <button className="px-4 py-2 bg-gh-bg-secondary border border-gh-border rounded-lg text-sm font-bold text-gh-text-secondary hover:text-gh-text hover:border-gh-text-secondary transition-all flex items-center gap-2">
            <span className="material-symbols-outlined !text-[18px]">call_split</span>
            Git
          </button>
          <button className="px-4 py-2 bg-gh-bg-secondary border border-gh-border rounded-lg text-sm font-bold text-gh-text-secondary hover:text-gh-text hover:border-gh-text-secondary transition-all flex items-center gap-2">
            <span className="material-symbols-outlined !text-[18px]">merge_type</span>
            Pull requests
          </button>
        </div>

        {/* Dashboard Cards */}
        <div className="space-y-4 mb-10">
          {/* Copilot Card */}
          <div className="relative overflow-hidden rounded-xl border border-gh-border bg-gradient-to-r from-[#6e40c9]/10 to-[#2f2f2f]/30 p-5 group hover:border-[#6e40c9]/50 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="size-10 rounded-lg bg-[#6e40c9] flex items-center justify-center text-white shadow-lg shadow-[#6e40c9]/20">
                  <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gh-text mb-1">TrackCodex Business is available for you</h3>
                  <p className="text-xs text-gh-text-secondary max-w-xl leading-relaxed">
                    AI-powered coding for your team. Empower your developers with advanced context-aware suggestions and security monitoring.
                  </p>
                  <button className="mt-3 px-4 py-1.5 bg-[#6e40c9] hover:bg-[#5a32a3] text-white text-xs font-bold rounded-md transition-colors shadow-md shadow-[#6e40c9]/20">
                    Activate Business
                  </button>
                </div>
              </div>
              <button className="text-gh-text-secondary hover:text-gh-text transition-colors">
                <span className="material-symbols-outlined !text-[18px]">close</span>
              </button>
            </div>
          </div>

          {repos.length === 0 && !loadingRepos && (
            <div className="relative overflow-hidden rounded-xl border border-gh-border bg-gradient-to-r from-amber-500/5 to-[#2f2f2f]/30 p-5 group hover:border-amber-500/30 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="size-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                    <span className="material-symbols-outlined">book</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gh-text mb-1">Create your first repository</h3>
                    <p className="text-xs text-gh-text-secondary max-w-xl leading-relaxed">
                      Repositories are where you add code, collaborate, and utilize premium features, like GitHub Actions and Advanced Security.
                    </p>
                    <button
                      onClick={() => navigate("/repositories/new")}
                      className="mt-3 px-4 py-1.5 bg-gh-bg-secondary hover:bg-gh-border border border-gh-border text-gh-text text-xs font-bold rounded-md transition-colors"
                    >
                      Create repository
                    </button>
                  </div>
                </div>
                <button className="text-gh-text-secondary hover:text-gh-text transition-colors">
                  <span className="material-symbols-outlined !text-[18px]">close</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Feed Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gh-text">Feed</h2>
            <button className="px-3 py-1.5 bg-gh-bg-secondary border border-gh-border rounded-md text-xs font-bold text-gh-text-secondary hover:text-gh-text transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined !text-[16px]">filter_list</span>
              Filter
            </button>
          </div>

          <div className="border border-gh-border rounded-xl bg-gh-bg-secondary/20 overflow-hidden">
            <div className="p-4 border-b border-gh-border bg-gh-bg-secondary/40">
              <div className="flex items-center gap-2 text-xs text-gh-text-secondary mb-1">
                <span className="material-symbols-outlined !text-[16px]">trending_up</span>
                <span className="font-bold text-gh-text">Your Repositories</span>
                <span>·</span>
                <button
                  onClick={() => navigate("/repositories")}
                  className="text-primary hover:underline"
                >
                  See more
                </button>
              </div>
            </div>

            <div className="divide-y divide-gh-border">
              {loadingRepos ? (
                <div className="p-8 text-center bg-gh-bg-secondary/10">
                  <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-xs text-gh-text-secondary font-bold">Synchronizing Feed...</p>
                </div>
              ) : repos.length > 0 ? (
                repos.slice(0, 5).map((repo) => (
                  <RepoItem key={repo.id} repo={repo} />
                ))
              ) : (
                <div className="py-12 bg-gh-bg-secondary/10">
                  <EmptyState
                    title="No activity yet"
                    message="Start by creating or syncing a repository."
                    imageSrc="/inbox-zero-dark.svg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid - Workspaces */}
        <div className="mb-12 mt-12 pt-12 border-t border-gh-border">
          <div className="animate-slide-up">
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gh-text tracking-tight">
                  Active Sessions
                </h2>
                <button
                  onClick={() => navigate("/workspaces")}
                  className="text-primary text-sm font-bold hover:underline"
                >
                  View all workspaces
                </button>
              </div>
              <ContinueWorkspaces />
            </section>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomeView;


