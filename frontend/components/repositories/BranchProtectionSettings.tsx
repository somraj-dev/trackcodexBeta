import React, { useState } from "react";
import { Repository } from "../../types";

interface BranchProtectionSettingsProps {
  repoId: string;
}

const BranchProtectionSettings: React.FC<BranchProtectionSettingsProps> = ({ repoId }) => {
  const [rules, setRules] = useState([
    {
      id: "1",
      pattern: "main",
      requirePR: true,
      requireSignedCommits: false,
      isLocked: false,
    },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newPattern, setNewPattern] = useState("");

  const handleAddRule = () => {
    if (!newPattern) return;
    setRules([
      ...rules,
      {
        id: Math.random().toString(36).substr(2, 9),
        pattern: newPattern,
        requirePR: true,
        requireSignedCommits: false,
        isLocked: false,
      },
    ]);
    setNewPattern("");
    setIsAdding(false);
  };

  const toggleRule = (id: string, field: "requirePR" | "requireSignedCommits" | "isLocked") => {
    setRules(
      rules.map((r) => (r.id === id ? { ...r, [field]: !r[field] } : r))
    );
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gh-text flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">security</span>
            Branch protection rules
          </h2>
          <p className="text-sm text-gh-text-secondary mt-1 max-w-2xl">
            Protect branches from being deleted, or restrict how commits can be pushed to them. 
            Define rules that apply to specific branch patterns.
          </p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-md hover:bg-opacity-90 transition-all shadow-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined !text-[18px]">add</span>
          Add rule
        </button>
      </div>

      {isAdding && (
        <div className="p-6 bg-gh-bg border border-primary/30 rounded-xl shadow-xl animate-in zoom-in-95 duration-200">
          <h3 className="text-sm font-bold text-gh-text mb-4 uppercase tracking-widest">Add branch protection rule</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black uppercase text-gh-text-secondary mb-2 block">Branch name pattern</label>
              <input 
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
                placeholder="e.g. main, release/*"
                className="w-full bg-gh-bg-secondary border border-gh-border rounded-lg px-4 py-2 text-sm text-gh-text focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-sm font-bold text-gh-text-secondary hover:text-gh-text transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddRule}
                disabled={!newPattern}
                className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-md hover:bg-opacity-90 transition-all shadow-sm disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {rules.length === 0 ? (
          <div className="p-12 text-center bg-gh-bg-secondary/30 border border-gh-border border-dashed rounded-2xl italic text-gh-text-secondary">
            No protection rules defined yet.
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="bg-gh-bg border border-gh-border rounded-xl overflow-hidden shadow-sm group hover:border-gh-border-active transition-all">
              <div className="px-6 py-4 bg-gh-bg-secondary flex items-center justify-between border-b border-gh-border">
                <div className="flex items-center gap-3">
                  <div className="px-2 py-1 bg-gh-bg border border-gh-border rounded-md text-xs font-mono text-primary font-bold">
                    {rule.pattern}
                  </div>
                </div>
                <button 
                  onClick={() => deleteRule(rule.id)}
                  className="p-1.5 text-gh-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                >
                  <span className="material-symbols-outlined !text-[18px]">delete</span>
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div 
                    onClick={() => toggleRule(rule.id, "requirePR")}
                    className={`mt-1 size-5 rounded-md border flex items-center justify-center cursor-pointer transition-all ${rule.requirePR ? "bg-primary border-primary" : "bg-gh-bg border-gh-border"}`}
                  >
                    {rule.requirePR && <span className="material-symbols-outlined !text-[14px] text-white font-black">check</span>}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gh-text">Require a pull request before merging</h4>
                    <p className="text-xs text-gh-text-secondary mt-1">
                      All commits must be made to a non-protected branch and submitted via a pull request before they can be merged.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div 
                    onClick={() => toggleRule(rule.id, "requireSignedCommits")}
                    className={`mt-1 size-5 rounded-md border flex items-center justify-center cursor-pointer transition-all ${rule.requireSignedCommits ? "bg-primary border-primary" : "bg-gh-bg border-gh-border"}`}
                  >
                    {rule.requireSignedCommits && <span className="material-symbols-outlined !text-[14px] text-white font-black">check</span>}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gh-text">Require signed commits</h4>
                    <p className="text-xs text-gh-text-secondary mt-1">
                      Commits pushed to this branch must have a verified signature.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 opacity-60">
                  <div 
                    className={`mt-1 size-5 rounded-md border border-gh-border bg-gh-bg flex items-center justify-center cursor-not-allowed`}
                  >
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gh-text">Lock branch</h4>
                    <p className="text-xs text-gh-text-secondary mt-1">
                      Branch is read-only. Users cannot push to the branch. (Administrative only)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex gap-4 text-xs text-gh-text-secondary leading-relaxed shadow-inner">
        <span className="material-symbols-outlined text-primary !text-[24px] shrink-0">info</span>
        <div>
          <h4 className="font-bold text-gh-text text-sm mb-1">Rule Precedence</h4>
          <p>
            When multiple protection rules apply to the same branch, the rules are additive. 
            If a branch pattern exactly matches a branch name, it takes precedence over wildcard patterns.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BranchProtectionSettings;
