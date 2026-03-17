import React, { useState, useEffect } from "react";
import { Repository } from "../../types";
import { api } from "../../services/infra/api";

interface RepoContributorsTabProps {
  repo: Repository;
}

const RepoContributorsTab: React.FC<RepoContributorsTabProps> = ({ repo }) => {
  const [contributors, setContributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContributors = async () => {
      setLoading(true);
      try {
        const data = await api.repositories.getContributors(repo.id);
        setContributors(data || []);
      } catch (err) {
        console.error("Failed to fetch contributors", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContributors();
  }, [repo.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gh-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-gh-text flex items-center gap-2">
            <span className="material-symbols-outlined !text-[24px]">groups</span>
            Contributors
            <span className="px-2 py-0.5 bg-gh-bg-secondary rounded-full text-xs font-medium ml-2 border border-gh-border">
              {contributors.length}
            </span>
          </h2>
          <p className="text-sm text-gh-text-secondary mt-1">
            People who have contributed code to {repo.name}.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gh-text-secondary">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-bold">Identifying contributors...</p>
        </div>
      ) : contributors.length === 0 ? (
        <div className="bg-gh-bg border border-gh-border rounded-xl p-20 text-center">
          <div className="size-20 bg-gh-bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 border border-gh-border">
            <span className="material-symbols-outlined !text-[40px] text-gh-text-secondary opacity-50">
              person_off
            </span>
          </div>
          <h3 className="text-lg font-bold text-gh-text mb-2">No contributors found</h3>
          <p className="text-gh-text-secondary max-w-md mx-auto text-sm">
            We couldn't find any contribution data for this repository yet. Contributions are typically tracked via Git commits.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contributors.map((c, idx) => (
            <div key={idx} className="bg-gh-bg border border-gh-border rounded-xl p-6 hover:border-primary/50 transition-all group flex items-start gap-4 shadow-sm hover:shadow-md">
              <div className="relative">
                <div className="size-16 rounded-full border-2 border-gh-border group-hover:border-primary/30 transition-all overflow-hidden shrink-0 shadow-lg bg-gh-bg-tertiary">
                  <img 
                    src={c.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.author}`} 
                    alt={c.author}
                    className="size-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 size-6 bg-[#1e1e1e] border border-gh-border rounded-full flex items-center justify-center text-[10px] font-black text-primary">
                  #{idx + 1}
                </div>
              </div>
              
              <div className="flex-1 min-w-0 py-1">
                <h3 className="font-bold text-lg text-gh-text truncate hover:text-primary cursor-pointer transition-colors">
                  {c.author}
                </h3>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex flex-col">
                    <span className="text-xl font-black text-primary leading-none">{c.commits}</span>
                    <span className="text-[10px] font-black uppercase text-gh-text-secondary tracking-widest mt-1">Commits</span>
                  </div>
                  <div className="w-[1px] h-8 bg-gh-border mx-2"></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-emerald-500">+{c.additions?.toLocaleString() || 0}</span>
                    <span className="text-xs font-bold text-red-500">-{c.deletions?.toLocaleString() || 0}</span>
                    <span className="text-[9px] font-black uppercase text-gh-text-secondary tracking-tighter mt-1">Impact</span>
                  </div>
                </div>
              </div>
              
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-gh-text-secondary hover:text-primary hover:bg-primary/10 rounded-md transition-all">
                  <span className="material-symbols-outlined !text-[20px]">open_in_new</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && contributors.length > 0 && (
        <div className="bg-gh-bg-secondary border border-gh-border rounded-xl p-4 flex items-center justify-between text-xs text-gh-text-secondary">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined !text-[16px]">info</span>
            Contributors are ranked by commit count.
          </div>
          <button className="text-primary font-bold hover:underline py-1 px-2 rounded hover:bg-primary/10">
            View as list
          </button>
        </div>
      )}
    </div>
  );
};

export default RepoContributorsTab;
