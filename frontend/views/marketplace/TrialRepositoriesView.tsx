import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrialRepo } from "../../types";
import { api } from "../../context/AuthContext";

const TrialCard: React.FC<{ trial: TrialRepo }> = ({ trial }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/marketplace/trials/${trial.id}`);
  };

  const handleStartTrial = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/marketplace/trials/${trial.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-gh-bg-secondary border border-gh-border rounded-xl p-6 flex flex-col relative group hover:border-primary transition-all duration-300 cursor-pointer"
    >
      {/* Header: Logo & Salary */}
      <div className="flex justify-between items-start mb-5">
        <div className="size-12 bg-white rounded-lg flex items-center justify-center p-2 shadow-sm overflow-hidden">
          <img
            src={trial.logo}
            className="w-full h-full object-contain"
            alt={trial.company}
          />
        </div>
        <div className="px-3 py-1.5 bg-primary/15 text-primary text-[11px] font-bold rounded-full border border-primary/20 tracking-wide">
          {trial.salaryRange}
        </div>
      </div>

      {/* Title & Location */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gh-text mb-1.5 tracking-tight group-hover:text-primary transition-colors">
          {trial.title}
        </h3>
        <div className="text-[13px] text-gh-text-secondary font-medium flex items-center gap-1.5">
          <span className="text-gh-text/90">{trial.company}</span>
          <span className="text-gh-text-secondary">•</span>
          <span>{trial.location}</span>
        </div>
      </div>

      {/* Repo & Mission */}
      <div className="mb-6 flex-1">
        <div className="flex items-center gap-2 text-primary text-[13px] font-mono mb-3 opacity-90 hover:underline">
          <span className="material-symbols-outlined !text-[16px] -mt-0.5">
            code
          </span>
          {trial.repoName || "repo/unknown"}
        </div>
        <div className="p-4 bg-gh-bg border border-gh-border rounded-lg relative">
          <p className="text-[13px] text-gh-text leading-relaxed italic font-medium line-clamp-2">
            "{trial.description}"
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {trial.tech?.map((t) => (
          <span
            key={t}
            className="px-2.5 py-1 bg-gh-bg border border-gh-border text-gh-text-secondary text-[11px] font-semibold rounded-md"
          >
            {t}
          </span>
        ))}
      </div>

      {/* Action */}
      <button
        onClick={handleStartTrial}
        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
      >
        <span className="material-symbols-outlined !text-[18px] filled">
          play_arrow
        </span>
        Start Trial
      </button>
    </div>
  );
};

const TrialRepositoriesView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [trials, setTrials] = useState<TrialRepo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrials = async () => {
      try {
        const response = await api.get('/repositories/trials');
        if (response.data.success) {
          setTrials(response.data.trials);
        }
      } catch (err) {
        console.error("Failed to fetch trials", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrials();
  }, []);

  const displayTrials = trials.filter((trial) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    const matchTitle = trial.title?.toLowerCase().includes(lowerQuery);
    const matchCompany = trial.company?.toLowerCase().includes(lowerQuery);
    const matchTech = trial.tech?.some((t) =>
      t.toLowerCase().includes(lowerQuery),
    );
    return matchTitle || matchCompany || matchTech;
  });

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-gh-text mb-2">
            Repo-Based Job Feed
          </h2>
          <p className="text-gh-text-secondary text-[15px] max-w-2xl">
            Prove your skills by solving real issues on enterprise repositories.
            Start a trial and get hired.
          </p>
        </div>

        <div className="relative group w-full md:w-96">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg group-focus-within:text-primary">
            search
          </span>
          <input
            className="w-full bg-gh-bg-secondary border border-gh-border rounded-full pl-12 pr-6 py-3 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all duration-300"
            placeholder="Search trials by title, tech, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center text-gh-text-secondary">
            <span className="material-symbols-outlined animate-spin text-4xl mb-4 text-primary">autorenew</span>
            <p>Loading trial repositories...</p>
          </div>
        ) : displayTrials.length > 0 ? (
          displayTrials.map((trial) => (
            <TrialCard key={trial.id} trial={trial} />
          ))
        ) : (
          <div className="col-span-full py-16 text-center text-slate-500 border border-dashed border-gh-border rounded-2xl bg-gh-bg-secondary">
            <span className="material-symbols-outlined text-4xl mb-4 opacity-50">
              search_off
            </span>
            <h3 className="text-lg font-bold text-gh-text mb-2">
              No trial repositories found.
            </h3>
            <p className="text-sm">
              Try adjusting your search criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrialRepositoriesView;
