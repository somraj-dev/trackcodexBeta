import React, { useState, useEffect } from "react";
import { Repository } from "../../types";
import { api } from "../../services/infra/api";
import { format } from "date-fns";

interface RepoReleasesTabProps {
  repo: Repository;
}

interface Release {
  id: string;
  name: string;
  tagName: string;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  createdAt: string;
  author: {
    username?: string;
    avatar?: string;
  };
  assets?: Array<{
    name: string;
    size: string;
  }>;
}

const RepoReleasesTab: React.FC<RepoReleasesTabProps> = ({ repo }) => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New release form state
  const [newRelease, setNewRelease] = useState({
    tagName: "",
    name: "",
    body: "",
    draft: false,
    prerelease: false,
  });

  const fetchReleases = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.repositories.getReleases(repo.id);
      setReleases(data);
    } catch (err) {
      console.error("Failed to fetch releases", err);
    } finally {
      setLoading(false);
    }
  }, [repo.id]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRelease.tagName || !newRelease.name) return;

    setIsSubmitting(true);
    try {
      await api.repositories.createRelease(repo.id, newRelease);
      setShowCreateModal(false);
      setNewRelease({
        tagName: "",
        name: "",
        body: "",
        draft: false,
        prerelease: false,
      });
      fetchReleases();
    } catch (err: unknown) {
      console.error("Failed to create release", err);
      alert("Failed to create release. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gh-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-gh-text flex items-center gap-2">
            <span className="material-symbols-outlined !text-[24px]">sell</span>
            Releases
            <span className="px-2 py-0.5 bg-gh-bg-secondary rounded-full text-xs font-medium ml-2 border border-gh-border">
              {releases.length}
            </span>
          </h2>
          <p className="text-sm text-gh-text-secondary mt-1">
            Releases are based on Git tags and mark specific points in your project's history.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-md hover:bg-opacity-90 transition-all shadow-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined !text-[18px]">add</span>
          Draft a new release
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gh-text-secondary">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-bold">Fetching releases...</p>
        </div>
      ) : releases.length === 0 ? (
        <div className="bg-gh-bg border border-gh-border rounded-xl p-20 text-center">
          <div className="size-20 bg-gh-bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 border border-gh-border">
            <span className="material-symbols-outlined !text-[40px] text-gh-text-secondary opacity-50">
              sell
            </span>
          </div>
          <h3 className="text-lg font-bold text-gh-text mb-2">There aren't any releases here</h3>
          <p className="text-gh-text-secondary max-w-md mx-auto mb-6 text-sm">
            Releases mark specific points in your project's history. They are often used to ship versions of your software to users.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gh-bg-secondary border border-gh-border text-gh-text rounded-md text-sm font-bold hover:bg-gh-bg-tertiary transition-all"
          >
            Create your first release
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {releases.map((release) => (
            <div key={release.id} className="flex gap-6 group">
              {/* Timeline bubble */}
              <div className="hidden md:flex flex-col items-center">
                <div className="size-8 rounded-full bg-gh-bg-secondary border border-gh-border flex items-center justify-center z-10 shrink-0 group-hover:border-primary transition-colors">
                  <span className={`material-symbols-outlined !text-[16px] ${release.prerelease ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {release.prerelease ? 'warning' : 'verified'}
                  </span>
                </div>
                <div className="w-[1px] flex-1 bg-gh-border group-last:bg-transparent mt-2"></div>
              </div>

              <div className="flex-1 bg-gh-bg border border-gh-border rounded-xl overflow-hidden hover:border-gh-border-active transition-all shadow-sm">
                <div className="px-6 py-4 border-b border-gh-border bg-gh-bg-secondary flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-primary hover:underline cursor-pointer flex items-center gap-2">
                      {release.name}
                    </h3>
                    {release.prerelease && (
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/20 rounded-full text-[10px] font-black uppercase">
                        Pre-release
                      </span>
                    )}
                    {release.draft && (
                      <span className="px-2 py-0.5 bg-gh-bg-tertiary text-gh-text-secondary rounded-full text-[10px] font-black uppercase border border-gh-border">
                        Draft
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gh-text-secondary">
                    <div className="flex items-center gap-1 bg-gh-bg border border-gh-border px-2 py-1 rounded-md">
                      <span className="material-symbols-outlined !text-[14px]">sell</span>
                      <span className="font-mono text-gh-text font-bold">{release.tagName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined !text-[14px]">calendar_today</span>
                      {format(new Date(release.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="size-8 rounded-full bg-gh-bg-tertiary border border-gh-border overflow-hidden shrink-0 mt-1">
                      <img 
                        src={release.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${release.author?.username}`} 
                        alt={release.author?.username}
                        className="size-full object-cover"
                      />
                    </div>
                    <div className="space-y-4 flex-1">
                      <div className="text-sm text-gh-text-secondary">
                        <span className="font-bold text-gh-text hover:text-primary cursor-pointer transition-colors">
                          {release.author?.username || "trackcodex-user"}
                        </span>
                        {" "}released this on {format(new Date(release.createdAt), "MMMM d, yyyy")}
                      </div>
                      
                      <div className="prose prose-invert max-w-none text-gh-text text-sm">
                        {release.body ? (
                          <div dangerouslySetInnerHTML={{ __html: release.body.replace(/\n/g, '<br/>') }} />
                        ) : (
                          <p className="italic opacity-50">No description provided.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Assets */}
                  {release.assets && Array.isArray(release.assets) && release.assets.length > 0 && (
                    <div className="border-t border-gh-border pt-4 mt-6">
                      <h4 className="text-sm font-bold text-gh-text mb-3 flex items-center gap-2 uppercase tracking-wider">
                        <span className="material-symbols-outlined !text-[16px]">folder_zip</span>
                        Assets
                      </h4>
                      <div className="space-y-2">
                        {release.assets.map((asset, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gh-bg-secondary rounded-lg border border-gh-border hover:border-primary/30 transition-all cursor-pointer group/asset shadow-sm">
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-gh-text-secondary !text-[20px] group-hover/asset:text-primary transition-colors">
                                {asset.name.endsWith('.zip') || asset.name.endsWith('.tar.gz') ? 'archive' : 'description'}
                              </span>
                              <span className="text-sm font-medium text-gh-text">{asset.name}</span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] text-gh-text-secondary font-black uppercase">
                              <span>{asset.size || '0 KB'}</span>
                              <span className="material-symbols-outlined !text-[14px]">download</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Git Assets Fallback (Standard Source Code) */}
                  <div className="border-t border-gh-border pt-4 mt-6">
                    <h4 className="text-sm font-bold text-gh-text mb-3 flex items-center gap-2 uppercase tracking-wider">
                      <span className="material-symbols-outlined !text-[16px]">source</span>
                      Source Code
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 bg-gh-bg-tertiary/30 rounded-lg border border-gh-border hover:bg-gh-bg-tertiary transition-all cursor-pointer group/sc shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-gh-text-secondary !text-[20px] group-hover/sc:text-emerald-500 transition-colors">
                            archive
                          </span>
                          <span className="text-sm font-medium text-gh-text">Source code (zip)</span>
                        </div>
                        <span className="material-symbols-outlined !text-[16px] text-gh-text-secondary">download</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gh-bg-tertiary/30 rounded-lg border border-gh-border hover:bg-gh-bg-tertiary transition-all cursor-pointer group/sc shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-gh-text-secondary !text-[20px] group-hover/sc:text-amber-500 transition-colors">
                            archive
                          </span>
                          <span className="text-sm font-medium text-gh-text">Source code (tar.gz)</span>
                        </div>
                        <span className="material-symbols-outlined !text-[16px] text-gh-text-secondary">download</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Release Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
          <div className="bg-gh-bg-secondary border border-gh-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gh-border flex items-center justify-between bg-gh-bg">
              <h3 className="font-bold text-gh-text flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_circle</span>
                Draft a new release
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gh-text-secondary hover:text-gh-text transition-colors"
                title="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateRelease} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gh-text-secondary flex items-center gap-2">
                    Tag version
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined !text-[18px] text-gh-text-tertiary">sell</span>
                    <input
                      required
                      type="text"
                      className="w-full bg-gh-bg border border-gh-border rounded-md pl-10 pr-4 py-2 text-sm text-gh-text focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:opacity-30"
                      placeholder="v1.0.0"
                      value={newRelease.tagName}
                      onChange={(e) => setNewRelease({...newRelease, tagName: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gh-text-secondary flex items-center gap-2">
                    Release title
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full bg-gh-bg border border-gh-border rounded-md px-4 py-2 text-sm text-gh-text focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:opacity-30"
                    placeholder="Release name"
                    value={newRelease.name}
                    onChange={(e) => setNewRelease({...newRelease, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gh-text-secondary">Describe this release</label>
                <textarea
                  className="w-full bg-gh-bg border border-gh-border rounded-md px-4 py-3 text-sm text-gh-text focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all min-h-[150px] font-mono placeholder:opacity-30"
                  placeholder="Markdown supported..."
                  value={newRelease.body}
                  onChange={(e) => setNewRelease({...newRelease, body: e.target.value})}
                />
              </div>

              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative size-5">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={newRelease.prerelease}
                      onChange={(e) => setNewRelease({...newRelease, prerelease: e.target.checked})}
                    />
                    <div className="size-full bg-gh-bg border border-gh-border rounded transition-all peer-checked:bg-primary peer-checked:border-primary"></div>
                    <span className="absolute inset-0 flex items-center justify-center material-symbols-outlined !text-[16px] text-white opacity-0 peer-checked:opacity-100 transition-opacity">check</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gh-text group-hover:text-primary transition-colors">This is a pre-release</span>
                    <span className="text-[10px] text-gh-text-secondary">Label as non-production ready</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative size-5">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={newRelease.draft}
                      onChange={(e) => setNewRelease({...newRelease, draft: e.target.checked})}
                    />
                    <div className="size-full bg-gh-bg border border-gh-border rounded transition-all peer-checked:bg-primary peer-checked:border-primary"></div>
                    <span className="absolute inset-0 flex items-center justify-center material-symbols-outlined !text-[16px] text-white opacity-0 peer-checked:opacity-100 transition-opacity">check</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gh-text group-hover:text-primary transition-colors">Set as draft</span>
                    <span className="text-[10px] text-gh-text-secondary">Drafts are only visible to collaborators</span>
                  </div>
                </label>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3 text-xs text-gh-text-secondary leading-relaxed">
                <span className="material-symbols-outlined text-primary !text-[18px] shrink-0">info</span>
                <p>
                  Releases are used to package and distribute software versions. 
                  By default, source code in <code>.zip</code> and <code>.tar.gz</code> formats are automatically attached. 
                  You can add custom binary assets after the release is created.
                </p>
              </div>
            </form>
            
            <div className="px-6 py-4 bg-gh-bg border-t border-gh-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-bold text-gh-text-secondary hover:text-gh-text transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRelease}
                disabled={isSubmitting || !newRelease.tagName || !newRelease.name}
                className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-md hover:bg-opacity-90 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Publishing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined !text-[18px]">rocket_launch</span>
                    Publish release
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepoReleasesTab;
