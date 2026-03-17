import React from "react";
import { BarChart, Bar, ResponsiveContainer, Cell } from "recharts";
import { useNavigate } from "react-router-dom";
import { UserProfile } from "../../services/activity/profile";

interface Props {
  profile?: UserProfile | null;
}

const ForgeAIUsage: React.FC<Props> = ({ profile }) => {
  const navigate = useNavigate();

  const skillScore = profile?.skillScore;
  const skillMetrics = profile?.skillMetrics;

  // Total dev actions as proxy
  const totalActions =
    skillMetrics != null
      ? skillMetrics.commitsPushed + skillMetrics.prCreated + skillMetrics.prReviewsGiven
      : null;

  // AI-assisted %: average of quality + bug detection scores — only if real data
  const aiAssistedPct =
    skillScore && (skillScore.quality > 0 || skillScore.bugDetection > 0)
      ? Math.round((skillScore.quality + skillScore.bugDetection) / 2)
      : null;

  // Bar chart data from skill axes — only real values, no fake bars
  const barData =
    skillScore && Object.values(skillScore).some((v) => typeof v === "number" && v > 0)
      ? [
          { value: skillScore.coding },
          { value: skillScore.quality },
          { value: skillScore.security },
          { value: skillScore.collaboration },
          { value: skillScore.communityImpact },
        ]
      : null;

  const hasData = barData !== null && totalActions !== null;

  return (
    <div className="bg-gh-bg-secondary border border-gh-border rounded-3xl p-8 flex flex-col shadow-xl group hover:border-cyan-500/30 transition-all">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-cyan-400 filled !text-[22px]">auto_awesome</span>
          <h3 className="text-[15px] font-black text-gh-text tracking-tight uppercase">ForgeAI Usage</h3>
        </div>
        <button
          onClick={() => navigate("/settings")}
          className="px-3 py-1 bg-cyan-400/5 border border-cyan-400/20 text-cyan-400 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-cyan-400 hover:text-white transition-all"
        >
          Pro
        </button>
      </div>

      {hasData ? (
        <>
          <div className="h-32 w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData!}>
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barData!.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === barData!.length - 1 ? "#22d3ee" : "var(--gh-bg-tertiary)"}
                      className="transition-all hover:fill-cyan-400"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gh-border/50">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gh-text-secondary uppercase tracking-widest mb-1">
                {totalActions} Total Actions
              </span>
              <div className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-bold text-gh-text-secondary uppercase">Operational</span>
              </div>
            </div>
            <span className="text-[15px] font-black text-cyan-400 uppercase tracking-tight drop-shadow-md">
              {aiAssistedPct !== null ? `${aiAssistedPct}% AI‑Assisted` : "—"}
            </span>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-6">
          <div className="size-16 rounded-full border-2 border-dashed border-gh-border flex items-center justify-center">
            <span className="material-symbols-outlined text-gh-text-secondary !text-[28px]">auto_awesome</span>
          </div>
          <p className="text-[13px] text-gh-text-secondary font-medium text-center max-w-[200px]">
            ForgeAI metrics appear after you start committing, reviewing, and contributing code.
          </p>
          <button
            onClick={() => navigate("/repositories")}
            className="text-[11px] font-black text-cyan-400 uppercase tracking-widest hover:underline"
          >
            Go to Repositories →
          </button>
        </div>
      )}
    </div>
  );
};

export default ForgeAIUsage;
