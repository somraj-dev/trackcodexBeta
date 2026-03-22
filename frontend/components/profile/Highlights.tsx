import React from "react";
import { useNavigate } from "react-router-dom";
import { UserProfile } from "../../services/activity/profile";

interface Props {
  profile?: UserProfile | null;
}

const Highlights: React.FC<Props> = ({ profile }) => {
  const navigate = useNavigate();

  const metrics = profile?.skillMetrics;
  const score = profile?.skillScore;
  const freelancer = profile?.freelancerProfile;

  const commits = metrics?.commitsPushed ?? 0;
  const prsMerged = metrics?.prMerged ?? 0;
  const vulnsFixed = metrics?.vulnerabilitiesFixed ?? 0;
  const bugsFixed = metrics?.bugsFixed ?? 0;
  const jobsCompleted = freelancer?.jobsCompleted ?? 0;
  const rating = freelancer?.rating ?? 0;
  const streak = metrics?.currentStreak ?? 0;

  const hasCodeActivity = commits > 0 || prsMerged > 0;
  const hasSecurityActivity = vulnsFixed > 0 || bugsFixed > 0;
  const hasFreelanceActivity = jobsCompleted > 0;

  // Empty state for a single card
  const EmptyCard: React.FC<{ color: string; icon: string; label: string; hint: string; onClick: () => void }> = ({
    color, icon, label, hint, onClick,
  }) => (
    <div
      onClick={onClick}
      className="p-8 bg-gh-bg-secondary border border-dashed border-gh-border rounded-2xl group hover:border-primary/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 min-h-[160px]"
    >
      <span className={`material-symbols-outlined ${color} !text-[32px] opacity-40`}>{icon}</span>
      <p className="text-[12px] font-bold text-gh-text-secondary text-center">{hint}</p>
      <span className="text-[10px] font-semibold text-primary uppercase tracking-widest opacity-70">
        {label} →
      </span>
    </div>
  );

  return (
    <div className="font-display">
      <div className="flex items-center gap-3 mb-8">
        <span className="material-symbols-outlined text-amber-500 filled !text-xl">bolt</span>
        <h3 className="text-[16px] font-medium uppercase tracking-tight text-gh-text">Highlights</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Code Activity */}
        {hasCodeActivity ? (
          <div
            onClick={() => navigate("/repositories")}
            className="p-8 bg-gh-bg-secondary border border-gh-border rounded-2xl group hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden shadow-lg"
          >
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-semibold text-primary uppercase tracking-widest">
                Code Activity
              </span>
              <div className="flex items-center gap-1 text-amber-500 font-semibold text-xs bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                <span className="material-symbols-outlined !text-[16px]">commit</span>
                {commits + prsMerged}
              </div>
            </div>
            <h4 className="text-[17px] font-bold text-gh-text group-hover:text-primary transition-colors leading-snug">
              {commits} commit{commits !== 1 ? "s" : ""} · {prsMerged} PR{prsMerged !== 1 ? "s" : ""} merged
            </h4>
            {streak > 0 && (
              <p className="text-xs text-gh-text-secondary mt-2 font-medium">{streak}-day streak 🔥</p>
            )}
          </div>
        ) : (
          <EmptyCard
            color="text-primary"
            icon="commit"
            label="Start coding"
            hint="Your commits and PRs will appear here once you push code."
            onClick={() => navigate("/repositories")}
          />
        )}

        {/* Security Impact */}
        {hasSecurityActivity ? (
          <div
            onClick={() => navigate("/activity")}
            className="p-8 bg-gh-bg-secondary border border-gh-border rounded-2xl group hover:border-emerald-500/50 transition-all cursor-pointer shadow-lg"
          >
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest">
                Security Impact
              </span>
              <span className="material-symbols-outlined text-emerald-500 filled !text-[20px]">check_circle</span>
            </div>
            <h4 className="text-[17px] font-bold text-gh-text group-hover:text-emerald-500 transition-colors uppercase tracking-tight leading-none mb-2">
              {vulnsFixed} vuln{vulnsFixed !== 1 ? "s" : ""} fixed
            </h4>
            <p className="text-xs text-gh-text-secondary font-bold uppercase tracking-widest">
              {bugsFixed > 0 ? `${bugsFixed} bugs resolved` : "Security contributions"}
            </p>
          </div>
        ) : (
          <EmptyCard
            color="text-emerald-500"
            icon="security"
            label="Fix vulnerabilities"
            hint="Security contributions will be highlighted here."
            onClick={() => navigate("/activity")}
          />
        )}

        {/* Freelance Highlight */}
        {hasFreelanceActivity ? (
          <div
            onClick={() => navigate("/marketplace/missions")}
            className="p-8 bg-gh-bg-secondary border border-gh-border rounded-2xl group hover:border-amber-500/50 transition-all cursor-pointer shadow-lg"
          >
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-semibold text-amber-500 uppercase tracking-widest">
                Gig Performance
              </span>
              {rating > 0 && (
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-semibold rounded border border-amber-500/20 uppercase tracking-widest">
                  {rating.toFixed(1)}★
                </span>
              )}
            </div>
            <h4 className="text-[17px] font-bold text-gh-text group-hover:text-amber-500 transition-colors uppercase tracking-tight leading-none mb-2">
              {jobsCompleted} job{jobsCompleted !== 1 ? "s" : ""} completed
            </h4>
            <p className="text-xs text-gh-text-secondary font-bold uppercase tracking-widest">
              Freelance Marketplace
            </p>
          </div>
        ) : (
          <EmptyCard
            color="text-amber-500"
            icon="work"
            label="Browse jobs"
            hint="Your completed gigs and ratings will appear here."
            onClick={() => navigate("/marketplace/missions")}
          />
        )}
      </div>
    </div>
  );
};

export default Highlights;
