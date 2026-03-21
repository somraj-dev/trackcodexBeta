import React from "react";
import { useNavigate } from "react-router-dom";
import { Job } from "../../types";

interface JobCardProps {
  job: Job;
  onClick: () => void;
}

// Typed as React.FC to resolve 'key' prop errors when component is used in list mappings
const JobCard: React.FC<JobCardProps> = ({ job, onClick }) => {
  const navigate = useNavigate();
  const statusColors = {
    Open: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    "In Progress": "text-amber-400 bg-amber-400/10 border-amber-400/20",
    InProgress: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    Completed: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    Pending: "text-blue-400 bg-blue-400/10 border-blue-400/20 animate-pulse",
  };

  const handleRepoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/repo/${job.repoId}`);
  };

  return (
    <div
      onClick={onClick}
      className="group bg-gh-bg-secondary border border-gh-border rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer flex flex-col relative overflow-hidden"
    >
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
        <span className="material-symbols-outlined text-[100px] font-semibold">
          terminal
        </span>
      </div>

      <div className="flex items-center justify-between mb-5 relative z-10">
        <div
          className={`px-2 py-0.5 rounded-md text-[9px] font-medium uppercase tracking-widest border ${statusColors[job.status]}`}
        >
          {job.status}
        </div>
        <div
          onClick={handleRepoClick}
          className="flex items-center gap-1.5 px-2 py-1 bg-gh-bg border border-gh-border rounded-lg text-[10px] text-gh-text-secondary font-bold hover:text-primary hover:border-primary/50 transition-all"
          title="View Associated Repository"
        >
          <span className="material-symbols-outlined !text-[14px]">
            account_tree
          </span>
          {job.repoId}
        </div>
      </div>

      <div className="flex items-start gap-4 mb-5 relative z-10">
        <div className="size-12 rounded-xl bg-gh-bg flex items-center justify-center overflow-hidden border border-gh-border shrink-0 group-hover:border-primary/30 transition-colors shadow-inner">
          <img
            src={job.creator?.avatar || "https://github.com/ghost.png"}
            className="size-full object-cover"
            alt={job.creator?.name || "Anonymous"}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-gh-text group-hover:text-primary transition-colors truncate leading-tight mb-1 uppercase tracking-tight">
            {job.title}
          </h3>
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-gh-text-secondary font-bold truncate">
              @
              {job.creator?.name
                ? job.creator.name.replace(/\s+/g, "").toLowerCase()
                : "anonymous"}
            </p>
            <div className="flex items-center gap-1 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10">
              <span className="material-symbols-outlined text-amber-500 filled !text-[12px]">
                star
              </span>
              <span className="text-[10px] font-semibold text-amber-500">4.9</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[13px] text-gh-text-secondary leading-relaxed mb-6 line-clamp-2 min-h-[40px] relative z-10">
        {job.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-8 relative z-10">
        {(job.techStack || []).map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 bg-gh-bg rounded-lg border border-gh-border text-[10px] text-gh-text-secondary font-medium uppercase tracking-tight group-hover:border-primary/30 transition-colors"
          >
            {tag}
          </span>
        ))}
        {(job.techStack || []).length > 3 && (
          <span className="px-2 py-1 text-[10px] text-gh-text-secondary font-bold uppercase">
            +{(job.techStack || []).length - 3}
          </span>
        )}
      </div>

      <div className="mt-auto pt-5 border-t border-gh-border/50 flex items-center justify-between relative z-10">
        <div className="flex flex-col">
          <span className="text-[9px] text-gh-text-secondary font-medium uppercase tracking-[0.15em] mb-0.5">
            Value
          </span>
          <span className="text-[18px] font-semibold text-gh-text tracking-tight flex items-center gap-1.5">
            {job.budget}
            <span className="text-[10px] text-gh-text-secondary font-bold lowercase">
              /{job.type === "Full-time" ? "yr" : "fixed"}
            </span>
          </span>
        </div>
        <button className="flex items-center gap-2 bg-primary text-gh-bg px-5 py-2.5 rounded-xl text-[10px] font-medium uppercase tracking-widest transition-all shadow-lg shadow-primary/20 hover:opacity-90 hover:scale-[1.02] active:scale-95">
          {job.status === "Completed"
            ? "Review feedback"
            : job.status === "Pending"
              ? "View Offer"
              : "Explore Brief"}
        </button>
      </div>
    </div>
  );
};

export default JobCard;


