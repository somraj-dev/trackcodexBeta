import React, { useState, useEffect } from "react";
import { api } from "../../services/infra/api";
import { Link } from "react-router-dom";

interface RepoCommitsTabProps {
  repo: any;
}

const RepoCommitsTab: React.FC<RepoCommitsTabProps> = ({ repo }) => {
  const [commits, setCommits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommits = async () => {
      setLoading(true);
      try {
        const data = await api.repositories.getCommits(repo.id);
        setCommits(data || []);
      } catch (err) {
        console.error("Failed to fetch commits", err);
      } finally {
        setLoading(false);
      }
    };

    if (repo?.id) {
      fetchCommits();
    }
  }, [repo?.id]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse bg-gh-bg-secondary border border-gh-border rounded-lg h-16 w-full"></div>
        ))}
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="bg-gh-bg border border-gh-border rounded-lg p-16 text-center text-gh-text-secondary">
        <span className="material-symbols-outlined !text-[48px] mb-4 opacity-50">history</span>
        <h3 className="text-xl font-bold text-gh-text mb-2">No commits yet</h3>
        <p>This repository doesn't have any commits yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gh-text">
          {commits.length} Commit{commits.length !== 1 ? 's' : ''}
        </h3>
      </div>

      <div className="border border-gh-border rounded-lg overflow-hidden">
        {commits.map((commit, index) => (
          <div 
            key={commit.sha} 
            className={`p-3 bg-gh-bg-secondary flex items-center justify-between gap-4 ${
              index !== commits.length - 1 ? 'border-b border-gh-border' : ''
            } hover:bg-gh-bg-tertiary transition-colors`}
          >
            <div className="flex items-start gap-3 min-w-0">
              <img 
                src={`https://github.com/${commit.author?.username || 'ghost'}.png`} 
                className="size-8 rounded-full border border-gh-border mt-1" 
                alt={commit.author?.username} 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${commit.author?.username || 'U'}&background=random`;
                }}
              />
              <div className="min-w-0">
                <Link 
                  to={`/repo/${repo.id}/commit/${commit.sha}`}
                  className="text-sm font-bold text-gh-text hover:text-primary transition-colors block truncate"
                >
                  {commit.message}
                </Link>
                <div className="flex items-center gap-1.5 text-xs text-gh-text-secondary mt-1">
                  <span className="font-bold text-gh-text hover:underline cursor-pointer">
                    {commit.author?.username || 'ghost'}
                  </span>
                  <span>committed {new Date(commit.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-gh-bg-tertiary border border-gh-border rounded-md text-xs font-mono text-gh-text hover:border-primary transition-colors cursor-pointer">
                 <span className="material-symbols-outlined !text-[14px]">history</span>
                 {commit.sha?.substring(0, 7)}
              </div>
              <button className="p-1 px-2 hover:bg-gh-bg rounded border border-gh-border text-gh-text-secondary hover:text-primary transition-colors">
                 <span className="material-symbols-outlined !text-[18px]">code</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RepoCommitsTab;
