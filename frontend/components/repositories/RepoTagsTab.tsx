import React, { useState, useEffect } from "react";
import { Repository } from "../../types";
import { api } from "../../services/infra/api";

interface RepoTagsTabProps {
  repo: Repository;
}

const RepoTagsTab: React.FC<RepoTagsTabProps> = ({ repo }) => {
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      try {
        const data = await api.repositories.getTags(repo.id);
        setTags(data);
      } catch (err) {
        console.error("Failed to fetch tags", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, [repo.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gh-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-gh-text flex items-center gap-2">
            <span className="material-symbols-outlined !text-[24px]">sell</span>
            Tags
            <span className="px-2 py-0.5 bg-gh-bg-secondary rounded-full text-xs font-medium ml-2 border border-gh-border">
              {tags.length}
            </span>
          </h2>
          <p className="text-sm text-gh-text-secondary mt-1">
            Tags mark specific points in your project's history, often used for versioning.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gh-text-secondary">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-bold">Fetching tags...</p>
        </div>
      ) : tags.length === 0 ? (
        <div className="bg-gh-bg border border-gh-border rounded-xl p-20 text-center">
          <div className="size-20 bg-gh-bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 border border-gh-border">
            <span className="material-symbols-outlined !text-[40px] text-gh-text-secondary opacity-50">
              sell
            </span>
          </div>
          <h3 className="text-lg font-bold text-gh-text mb-2">No tags found</h3>
          <p className="text-gh-text-secondary max-w-md mx-auto text-sm">
            This repository doesn't have any tags yet. You can create a tag via Git or when drafting a release.
          </p>
        </div>
      ) : (
        <div className="bg-gh-bg border border-gh-border rounded-xl overflow-hidden shadow-sm">
          <div className="divide-y divide-gh-border">
            {tags.map((tag) => (
              <div key={tag} className="px-6 py-4 flex items-center justify-between hover:bg-gh-bg-secondary transition-all group">
                <div className="flex items-center gap-4">
                  <div className="size-8 rounded-full bg-gh-bg-secondary border border-gh-border flex items-center justify-center text-primary group-hover:border-primary/50 transition-colors">
                    <span className="material-symbols-outlined !text-[16px]">sell</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gh-text hover:text-primary cursor-pointer transition-colors flex items-center gap-2">
                      {tag}
                      <span className="material-symbols-outlined !text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
                    </div>
                    <div className="text-[10px] font-medium uppercase text-gh-text-secondary mt-0.5 flex items-center gap-2 tracking-widest">
                      <span className="bg-gh-bg-tertiary px-1.5 rounded border border-gh-border">Git Tag</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-1 px-2 py-1 bg-gh-bg-tertiary border border-gh-border rounded-md text-[10px] font-mono text-gh-text-secondary">
                    <span className="material-symbols-outlined !text-[12px]">code</span>
                    <span>Commit SHA</span>
                  </div>
                  <div className="h-6 w-[1px] bg-gh-border mx-2"></div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gh-text-secondary hover:text-primary hover:bg-primary/10 rounded-md transition-all flex items-center gap-2 text-xs font-bold" title="Download ZIP">
                      <span className="material-symbols-outlined !text-[18px]">folder_zip</span>
                      zip
                    </button>
                    <button className="p-2 text-gh-text-secondary hover:text-amber-500 hover:bg-amber-500/10 rounded-md transition-all flex items-center gap-2 text-xs font-bold" title="Download TAR.GZ">
                      <span className="material-symbols-outlined !text-[18px]">archive</span>
                      tar.gz
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RepoTagsTab;
