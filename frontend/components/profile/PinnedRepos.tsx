import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PinnedRepos.module.css";
import { api } from "../../services/infra/api";
import { Repository } from "../../types";

const PinnedRepos = () => {
  const navigate = useNavigate();
  const [pinnedRepos, setPinnedRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPinned = async () => {
      setLoading(true);
      try {
        const repos = await api.repositories.list();
        // Sort by stars descending and take top 2 as "pinned"
        const topRepos = [...repos]
          .sort((a, b) => (b.stars || 0) - (a.stars || 0))
          .slice(0, 2);
        setPinnedRepos(topRepos);
      } catch (err) {
        console.error("Failed to fetch pinned repos", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPinned();
  }, []);

  if (loading) {
    return (
      <div className="font-display">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-gh-text-secondary !text-[20px]">
            bookmark
          </span>
          <div className="h-4 w-32 bg-gh-border/20 animate-pulse rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-32 bg-gh-bg-secondary border border-gh-border rounded-2xl animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (pinnedRepos.length === 0) {
    return null; // Don't show if no repos
  }

  return (
    <div className="font-display">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-gh-text-secondary !text-[20px]">
            bookmark
          </span>
          <h3 className="text-[14px] font-black uppercase tracking-widest text-gh-text">
            Pinned Repositories
          </h3>
        </div>
        <button
          onClick={() => navigate("/repositories")}
          className="text-[11px] font-black uppercase text-primary tracking-widest hover:underline transition-all"
        >
          View all
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pinnedRepos.map((repo) => (
          <div
            key={repo.id}
            onClick={() => navigate(`/repositories/${repo.id}`)}
            className="p-6 bg-gh-bg-secondary border border-gh-border rounded-2xl group hover:border-gh-text-secondary transition-all cursor-pointer flex flex-col shadow-lg hover:shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="material-symbols-outlined text-gh-text-secondary !text-[20px] shrink-0">
                  book
                </span>
                <h4 className="text-[14px] font-bold text-primary group-hover:underline truncate">
                  {repo.name}
                </h4>
                <span className="px-2 py-0.5 rounded-full border border-gh-border text-[9px] text-gh-text-secondary font-black uppercase tracking-widest shrink-0">
                  {repo.visibility || (repo.isPublic ? "Public" : "Private")}
                </span>
              </div>
              <div
                className={`size-8 rounded-full flex items-center justify-center text-[12px] font-black shrink-0 shadow-md
                ${(repo.aiHealthLabel || "A").startsWith("A") ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-gh-bg border border-gh-border text-gh-text-secondary"}`}
              >
                {repo.aiHealthLabel || "A"}
              </div>
            </div>

            <p className="text-[12px] text-gh-text-secondary leading-normal mb-6 h-12 line-clamp-2 font-medium italic">
              "{repo.description || "No description provided."}"
            </p>

            <div className="flex items-center gap-5 text-[12px] text-gh-text-secondary mt-auto font-bold">
              <div className="flex items-center gap-2">
                <div
                  className={styles.languageDot}
                  style={
                    {
                      "--lang-color":
                        repo.techColor ||
                        (repo.language === "TypeScript"
                          ? "#3178c6"
                          : repo.language === "JavaScript"
                            ? "#f1e05a"
                            : repo.language === "Rust"
                              ? "#dea584"
                              : "#8b949e"),
                    } as React.CSSProperties
                  }
                ></div>
                <span className="text-gh-text-secondary uppercase text-[11px] font-black tracking-wider">
                  {repo.language || repo.techStack || "Plain Text"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 hover:text-gh-text transition-colors">
                <span className="material-symbols-outlined !text-[16px]">
                  star
                </span>
                <span>{repo.stars || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 hover:text-gh-text transition-colors">
                <span className="material-symbols-outlined !text-[16px]">
                  fork_right
                </span>
                <span>{repo.forks || 0}</span>
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-emerald-400 font-black">
                <span className="material-symbols-outlined !text-[16px] filled">
                  auto_fix_high
                </span>
                <span>{repo.aiHealth || "90%"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PinnedRepos;

