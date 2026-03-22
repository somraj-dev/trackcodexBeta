import React from "react";
import { useNavigate } from "react-router-dom";
import { UserProfile } from "../../services/activity/profile";

interface Props {
  profile?: UserProfile | null;
}

const FreelanceCard: React.FC<Props> = ({ profile }) => {
  const navigate = useNavigate();

  const freelancer = profile?.freelancerProfile;
  const jobsCompleted = freelancer?.jobsCompleted ?? null;
  const rating = freelancer?.rating ?? null;

  const hasData = freelancer != null && (jobsCompleted !== null || rating !== null);

  // Computed hire rate only from real rating
  const repeatHireRate =
    rating !== null && rating > 0
      ? Math.min(100, Math.round((rating / 5) * 100))
      : null;

  const ratingLabel =
    repeatHireRate !== null
      ? repeatHireRate >= 90
        ? "Excellent"
        : repeatHireRate >= 75
        ? "Good"
        : "Fair"
      : null;

  return (
    <div className="bg-gh-bg-secondary border border-gh-border rounded-3xl p-8 flex flex-col shadow-xl hover:border-amber-500/30 transition-all group">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-500 filled !text-[22px]">work</span>
          <h3 className="text-[15px] font-semibold text-gh-text tracking-tight uppercase">Freelance Profile</h3>
        </div>
        <div className="flex items-center gap-1.5 font-semibold">
          <span className="material-symbols-outlined !text-[20px] text-amber-500">star</span>
          <span className={`text-xl tracking-tighter ${rating !== null && rating > 0 ? "text-amber-500" : "text-gh-text-secondary"}`}>
            {rating !== null && rating > 0 ? rating.toFixed(1) : "N/A"}
          </span>
        </div>
      </div>

      {hasData ? (
        <>
          <div className="space-y-8 mb-10 flex-1">
            <button
              onClick={() => navigate("/marketplace/missions")}
              className="flex items-center justify-between border-b border-gh-border pb-4 w-full group/stat hover:border-amber-500/50 transition-all"
            >
              <span className="text-[14px] font-bold text-gh-text-secondary group-hover/stat:text-gh-text transition-colors">
                Jobs Completed
              </span>
              <span className="text-lg font-semibold text-gh-text">
                {jobsCompleted !== null ? jobsCompleted : "—"}
              </span>
            </button>
            <div className="flex items-start justify-between">
              <span className="text-[13px] font-bold text-gh-text-secondary leading-tight">
                Marketplace Status
              </span>
              <span className="text-[14px] font-semibold text-gh-text uppercase tracking-tight">
                {freelancer?.isPublic ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {repeatHireRate !== null ? (
            <div className="space-y-4 pt-6 border-t border-gh-border">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-gh-text-secondary uppercase tracking-widest">
                  {repeatHireRate}% Repeat Hire Rate
                </span>
                {ratingLabel && (
                  <span className="text-[10px] font-bold text-amber-500 uppercase">{ratingLabel}</span>
                )}
              </div>
              <div className="h-2.5 w-full bg-gh-bg rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)] transition-all duration-1000"
                  style={{ width: `${repeatHireRate}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="pt-6 border-t border-gh-border">
              <p className="text-[11px] text-gh-text-secondary font-medium">No rated jobs yet.</p>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="size-16 rounded-full border-2 border-dashed border-gh-border flex items-center justify-center">
            <span className="material-symbols-outlined text-gh-text-secondary !text-[28px]">work_off</span>
          </div>
          <p className="text-[13px] text-gh-text-secondary font-medium text-center max-w-[180px]">
            Complete jobs on the marketplace to build your freelance profile.
          </p>
          <button
            onClick={() => navigate("/marketplace/missions")}
            className="text-[11px] font-semibold text-amber-500 uppercase tracking-widest hover:underline"
          >
            Browse Jobs →
          </button>
        </div>
      )}
    </div>
  );
};

export default FreelanceCard;
