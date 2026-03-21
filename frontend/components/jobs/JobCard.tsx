import { useState } from "react";
import { Job } from "../../types";
import ShareModal from "../modals/ShareModal";

interface JobCardProps {
  job: Job;
  onClick: () => void;
}

// Typed as React.FC to resolve 'key' prop errors when component is used in list mappings
const JobCard: React.FC<JobCardProps> = ({ job, onClick }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  return (
    <>
    <div
      onClick={onClick}
      className="group bg-white border border-slate-200 rounded-[24px] p-6 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer flex flex-col relative overflow-hidden h-[320px]"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="text-[17px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate leading-tight mb-1.5">
            {job.title}
          </h3>
          <p className="text-[14px] font-medium text-slate-600 truncate">
            {job.creator?.name || "Organisation Name"}
          </p>
        </div>
        <div className="size-14 rounded-xl border border-slate-100 bg-slate-50 p-1 shrink-0 overflow-hidden shadow-sm">
          <img
            src={job.creator?.avatar || "https://github.com/ghost.png"}
            className="size-full object-cover rounded-lg"
            alt={job.creator?.name || "Logo"}
          />
        </div>
      </div>

      <div className="space-y-2.5 mb-5">
        <div className="flex items-center gap-2.5 text-slate-500">
          <span className="material-symbols-outlined !text-[18px]">group</span>
          <span className="text-[13px] font-medium">{job.metadata?.teamSize || "1 - 4 Members"}</span>
          <span className="w-px h-3 bg-slate-200 mx-1" />
        </div>
        <div className="flex items-center gap-2.5 text-slate-500">
          <span className="material-symbols-outlined !text-[18px]">location_on</span>
          <span className="text-[13px] font-medium truncate">{job.offerDetails?.officeLocation || "Online"}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-auto">
        {(job.techStack || []).slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="px-3 py-1.5 bg-slate-100 rounded-full text-[12px] text-slate-600 font-semibold tracking-wide"
          >
            {tag}
          </span>
        ))}
        {(job.techStack || []).length > 3 && (
          <span className="px-3 py-1.5 bg-slate-100 rounded-full text-[12px] text-slate-600 font-bold">
            +{(job.techStack || []).length - 3}
          </span>
        )}
      </div>

      <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4 text-slate-500">
          <span className="text-[13px] font-bold text-blue-600/80">
            Posted {job.postedDate || "Mar 21, 2026"}
          </span>
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <span className="material-symbols-outlined !text-[18px]">hourglass_bottom</span>
            <span className="text-[13px]">13 days left</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
            onClick={(e) => { 
              e.stopPropagation(); 
              setIsShareModalOpen(true);
            }}
          >
            <span className="material-symbols-outlined !text-[20px]">share</span>
          </button>
          <button 
            className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
            onClick={(e) => { e.stopPropagation(); /* Favorite logic */ }}
          >
            <span className="material-symbols-outlined !text-[20px]">favorite</span>
          </button>
        </div>
      </div>
    </div>
    
    <ShareModal 
      isOpen={isShareModalOpen} 
      onClose={() => setIsShareModalOpen(false)} 
      job={job}
    />
    </>
  );
};

export default JobCard;


