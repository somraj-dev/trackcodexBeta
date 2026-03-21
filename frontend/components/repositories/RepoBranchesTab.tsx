import React, { useState, useEffect } from "react";
import { Repository } from "../../types";
import { api } from "../../services/infra/api";

interface RepoBranchesTabProps {
  repo: Repository;
}

const RepoBranchesTab: React.FC<RepoBranchesTabProps> = ({ repo }) => {
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultBranch, setDefaultBranch] = useState("main");

  useEffect(() => {
    const fetchBranches = async () => {
      setLoading(true);
      try {
        const data = await api.repositories.getBranches(repo.id);
        setBranches(data || ["main"]);
        
        // Use default branch from settings if available
        if (repo.settings?.defaultBranch) {
          setDefaultBranch(repo.settings.defaultBranch);
        } else if (data && data.length > 0) {
          // Fallback to first branch if we can't find default
          const likelyDefault = data.find(b => b === "main" || b === "master") || data[0];
          setDefaultBranch(likelyDefault);
        }
      } catch (err) {
        console.error("Failed to fetch branches", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBranches();
  }, [repo.id, repo.settings]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gh-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-gh-text flex items-center gap-2">
            <span className="material-symbols-outlined !text-[24px]">account_tree</span>
            Branches
            <span className="px-2 py-0.5 bg-gh-bg-secondary rounded-full text-xs font-medium ml-2 border border-gh-border">
              {branches.length}
            </span>
          </h2>
          <p className="text-sm text-gh-text-secondary mt-1">
            Manage repository branches and set branch protection rules.
          </p>
        </div>
        <button className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-md hover:bg-opacity-90 transition-all shadow-sm flex items-center gap-2">
          <span className="material-symbols-outlined !text-[18px]">add</span>
          New branch
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gh-text-secondary">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-bold">Synchronizing branches...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Default Branch Section */}
          <section className="bg-gh-bg border border-gh-border rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-3 bg-gh-bg-secondary border-b border-gh-border">
              <h3 className="text-xs font-medium uppercase text-gh-text-secondary tracking-wider">Default Branch</h3>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined !text-[16px]">stars</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-gh-text flex items-center gap-2">
                    {defaultBranch}
                    <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] uppercase font-semibold tracking-tighter">Default</span>
                  </div>
                  <div className="text-[11px] text-gh-text-secondary mt-0.5">
                    Updated recently · <span className="text-primary hover:underline cursor-pointer">Last commit info</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gh-text-secondary hover:text-gh-text hover:bg-gh-bg-tertiary rounded-md transition-all">
                  <span className="material-symbols-outlined !text-[18px]">settings</span>
                </button>
              </div>
            </div>
          </section>

          {/* Active Branches Section */}
          <section className="bg-gh-bg border border-gh-border rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-3 bg-gh-bg-secondary border-b border-gh-border">
              <h3 className="text-xs font-medium uppercase text-gh-text-secondary tracking-wider">Active Branches</h3>
            </div>
            <div className="divide-y divide-gh-border">
              {branches.filter(b => b !== defaultBranch).length === 0 ? (
                <div className="px-6 py-8 text-center text-gh-text-secondary text-sm italic">
                  No other active branches found.
                </div>
              ) : (
                branches.filter(b => b !== defaultBranch).map((branch) => (
                  <div key={branch} className="px-6 py-4 flex items-center justify-between hover:bg-gh-bg-secondary transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="size-8 rounded-full bg-gh-bg-secondary border border-gh-border flex items-center justify-center text-gh-text-secondary group-hover:border-gh-border-active transition-colors">
                        <span className="material-symbols-outlined !text-[16px]">account_tree</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gh-text hover:text-primary cursor-pointer transition-colors">
                          {branch}
                        </div>
                        <div className="text-[11px] text-gh-text-secondary mt-0.5">
                          Active · <span className="text-primary hover:underline cursor-pointer">View last commit</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 px-2 py-1 bg-gh-bg-tertiary border border-gh-border rounded-md text-[10px] font-mono text-gh-text-secondary opacity-50 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined !text-[12px]">code</span>
                        <span>Commit SHA</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1 bg-gh-bg-secondary border border-gh-border text-gh-text rounded-md text-xs font-bold hover:bg-gh-bg-tertiary transition-all" title="New pull request">
                          New PR
                        </button>
                        <button className="p-2 text-red-500 hover:bg-red-500/10 rounded-md transition-all opacity-0 group-hover:opacity-100" title="Delete branch">
                          <span className="material-symbols-outlined !text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
          
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 flex gap-4 text-xs text-gh-text-secondary leading-relaxed shadow-inner">
            <span className="material-symbols-outlined text-primary !text-[24px] shrink-0">security</span>
            <div className="space-y-2">
              <h4 className="font-bold text-gh-text text-sm">Branch protection rules</h4>
              <p>
                Protect your repository's history from being overwritten or deleted. 
                Require status checks to pass before merging, or require pull request reviews.
              </p>
              <button className="text-primary font-bold hover:underline mt-2 flex items-center gap-1">
                Configure protection rules
                <span className="material-symbols-outlined !text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepoBranchesTab;
