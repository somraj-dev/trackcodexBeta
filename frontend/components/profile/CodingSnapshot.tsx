import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import styles from "./CodingSnapshot.module.css";
import { UserProfile } from "../../services/activity/profile";

const LANG_COLORS = ["#135bec", "#f97316", "#a855f7", "#10b981", "#f59e0b"];

interface Props {
  profile?: UserProfile | null;
}

const CodingSnapshot: React.FC<Props> = ({ profile }) => {
  const navigate = useNavigate();

  const skillScore = profile?.skillScore;
  const skillMetrics = profile?.skillMetrics;

  // Total commits + PRs as session count — null means no data yet
  const sessions =
    skillMetrics != null
      ? skillMetrics.commitsPushed + skillMetrics.prCreated
      : null;

  // Build language-like axes from skill scores only if real data exists
  const skillAxes =
    skillScore &&
    (skillScore.coding > 0 ||
      skillScore.security > 0 ||
      skillScore.quality > 0 ||
      skillScore.collaboration > 0)
      ? [
          { name: "Coding", value: Math.round(skillScore.coding), color: LANG_COLORS[0] },
          { name: "Security", value: Math.round(skillScore.security), color: LANG_COLORS[1] },
          { name: "Quality", value: Math.round(skillScore.quality), color: LANG_COLORS[2] },
          { name: "Collab", value: Math.round(skillScore.collaboration), color: LANG_COLORS[3] },
        ].filter((d) => d.value > 0)
      : [];

  const hasData = skillAxes.length > 0;

  // Latest activity string
  const latestActivity =
    skillMetrics != null
      ? skillMetrics.commitsPushed > 0 || skillMetrics.prMerged > 0
        ? `${skillMetrics.commitsPushed} commits pushed · ${skillMetrics.prMerged} PRs merged`
        : "No activity recorded yet"
      : "No activity recorded yet";

  return (
    <div className="bg-gh-bg-secondary border border-gh-border rounded-3xl p-8 h-full flex flex-col shadow-xl hover:border-gh-text-secondary transition-all group">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary !text-[22px]">code</span>
          <h3 className="text-[15px] font-semibold text-gh-text tracking-tight uppercase">
            Coding Snapshot
          </h3>
        </div>
        <button
          onClick={() => navigate("/platform-matrix")}
          className="text-[10px] font-medium uppercase tracking-widest text-gh-text-secondary hover:text-primary transition-all flex items-center gap-1"
        >
          View Details
          <span className="material-symbols-outlined !text-[14px]">chevron_right</span>
        </button>
      </div>

      <div className="flex items-center gap-10 mb-10 flex-1">
        {/* Chart or empty state */}
        {hasData ? (
          <div className="size-40 shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={skillAxes}
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {skillAxes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-semibold text-gh-text">
                {sessions !== null ? sessions : "—"}
              </span>
              <span className="text-[9px] font-semibold text-gh-text-secondary uppercase tracking-widest">
                Actions
              </span>
            </div>
          </div>
        ) : (
          <div className="size-40 shrink-0 flex flex-col items-center justify-center rounded-full border-2 border-dashed border-gh-border bg-gh-bg">
            <span className="material-symbols-outlined text-gh-text-secondary !text-[36px]">
              code_off
            </span>
            <span className="text-[9px] font-bold text-gh-text-secondary uppercase tracking-widest mt-1">
              No Data
            </span>
          </div>
        )}

        {/* Legend or empty prompt */}
        <div className="flex-1 space-y-5">
          {hasData ? (
            skillAxes.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between group/lang cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={styles.languageDot}
                    style={{ "--lang-color": item.color } as React.CSSProperties}
                  ></div>
                  <span className="text-[14px] font-bold text-gh-text-secondary group-hover/lang:text-gh-text transition-colors">
                    {item.name}
                  </span>
                </div>
                <span className="text-[14px] font-semibold text-gh-text">{item.value}%</span>
              </div>
            ))
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-[13px] text-gh-text-secondary font-medium">
                Skill scores will appear here once you start committing, reviewing PRs, and contributing.
              </p>
              <button
                onClick={() => navigate("/repositories")}
                className="text-[11px] font-semibold text-primary uppercase tracking-widest hover:underline text-left"
              >
                Start Contributing →
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-gh-border/50">
        <p className="text-[11px] text-gh-text-secondary font-bold italic flex items-center gap-2">
          <span className="material-symbols-outlined !text-[16px] text-emerald-500">history</span>
          Latest Activity:{" "}
          <span className="text-gh-text-secondary font-medium">{latestActivity}</span>
        </p>
      </div>
    </div>
  );
};

export default CodingSnapshot;
