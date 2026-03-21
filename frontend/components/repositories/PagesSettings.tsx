import React, { useState } from "react";

interface PagesSettingsProps {
  repoId: string;
}

const PagesSettings: React.FC<PagesSettingsProps> = ({ repoId }) => {
  const [source, setSource] = useState("branch"); // branch, action
  const [branch, setBranch] = useState("main");
  const [folder, setFolder] = useState("/");
  const [customDomain, setCustomDomain] = useState("");
  const [enforceHttps, setEnforceHttps] = useState(true);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <section>
        <h2 className="text-xl font-bold text-gh-text flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary">browser_updated</span>
          Pages
        </h2>
        <p className="text-sm text-gh-text-secondary mb-6 max-w-2xl">
          TrackCodex Pages is designed to host your personal, organization, or project pages from a repository.
        </p>

        <div className="p-8 bg-gh-bg-secondary/30 border border-gh-border rounded-[2rem] space-y-8">
          <div>
            <h3 className="text-sm font-bold text-gh-text mb-4 uppercase tracking-widest opacity-60">Build and deployment</h3>
            <div className="space-y-4">
              <label className="text-xs font-medium uppercase text-gh-text-secondary block">Source</label>
              <select 
                value={source}
                onChange={(e) => setSource(e.target.value)}
                title="Deployment source"
                className="w-full max-w-sm bg-gh-bg border border-gh-border rounded-xl px-4 py-2.5 text-sm text-gh-text focus:ring-2 focus:ring-primary/40 outline-none transition-all cursor-pointer shadow-sm"
              >
                <option value="branch">Deploy from a branch</option>
                <option value="action">TrackCodex Actions</option>
              </select>
            </div>

            {source === "branch" && (
              <div className="mt-6 p-6 bg-gh-bg border border-gh-border rounded-2xl flex items-center gap-8 animate-in slide-in-from-top-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-medium uppercase text-gh-text-tertiary">Branch</label>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[18px] text-gh-text-secondary">account_tree</span>
                    <select 
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      title="Source branch"
                      className="bg-transparent text-sm font-bold text-primary outline-none cursor-pointer"
                    >
                      <option value="main">main</option>
                      <option value="gh-pages">gh-pages</option>
                    </select>
                  </div>
                </div>
                <div className="w-px h-10 bg-gh-border mx-2"></div>
                <div className="space-y-2">
                  <label className="text-[10px] font-medium uppercase text-gh-text-tertiary">Folder</label>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[18px] text-gh-text-secondary">folder</span>
                    <select 
                      value={folder}
                      onChange={(e) => setFolder(e.target.value)}
                      title="Source folder"
                      className="bg-transparent text-sm font-bold text-gh-text outline-none cursor-pointer"
                    >
                      <option value="/">/ (root)</option>
                      <option value="/docs">/docs</option>
                    </select>
                  </div>
                </div>
                <button className="ml-auto px-4 py-1.5 bg-gh-bg-secondary border border-gh-border text-gh-text text-xs font-bold rounded-lg hover:bg-gh-bg-tertiary transition-all">
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="h-px bg-gh-border opacity-50"></div>

          <div>
            <h3 className="text-sm font-bold text-gh-text mb-4 uppercase tracking-widest opacity-60">Custom domain</h3>
            <div className="space-y-4">
              <p className="text-xs text-gh-text-secondary leading-relaxed max-w-xl">
                Custom domains allow you to serve your site from a domain other than <code>trackcodex.io</code>.
              </p>
              <div className="flex gap-3 max-w-xl">
                <input 
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="www.example.com"
                  className="flex-1 bg-gh-bg border border-gh-border rounded-xl px-4 py-2 text-sm text-gh-text focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-inner"
                />
                <button className="px-6 py-2 bg-gh-bg-secondary border border-gh-border text-gh-text text-sm font-bold rounded-xl hover:bg-gh-bg-tertiary transition-all">
                  Add
                </button>
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                <div 
                  onClick={() => setEnforceHttps(!enforceHttps)}
                  className={`size-5 rounded-md border flex items-center justify-center cursor-pointer transition-all ${enforceHttps ? "bg-primary border-primary shadow-lg shadow-primary/20" : "bg-gh-bg border-gh-border"}`}
                >
                  {enforceHttps && <span className="material-symbols-outlined !text-[14px] text-white font-semibold">check</span>}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gh-text">Enforce HTTPS</span>
                  <span className="text-[10px] text-gh-text-secondary">Redirect HTTP requests to HTTPS for your site.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-8 flex gap-6 text-sm text-gh-text leading-relaxed shadow-sm">
        <div className="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
          <span className="material-symbols-outlined text-emerald-500 !text-[28px]">rocket</span>
        </div>
        <div>
          <h4 className="font-bold text-emerald-500 text-lg mb-1">Your site is ready!</h4>
          <p className="text-gh-text-secondary">
            Your TrackCodex Pages site is currently being deployed. 
            Once finished, it will be available at <span className="text-primary font-bold hover:underline cursor-pointer">https://{repoId}.pages.trackcodex.io/</span>
          </p>
          <div className="flex items-center gap-4 mt-4">
            <button className="text-xs font-medium uppercase text-primary hover:text-emerald-500 transition-colors flex items-center gap-1">
              Visit Site
              <span className="material-symbols-outlined !text-[14px]">open_in_new</span>
            </button>
            <button className="text-xs font-medium uppercase text-gh-text-secondary hover:text-gh-text transition-colors">
              View Deployment Runs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PagesSettings;
