import React, { useState, useEffect } from "react";
import { ActivityCalendar, ThemeInput } from "react-activity-calendar";
import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import {
  gitActivityService,
  Activity,
} from "../../services/git/gitActivityService";

interface Props {
  userId?: string | null;
}

const ContributionHeatmap: React.FC<Props> = ({ userId }) => {
  const [data, setData] = useState<Activity[]>([]);
  const [totalContributions, setTotalContributions] = useState(0);

  useEffect(() => {
    // Subscribe with the real userId so we get per-user data from the backend
    const unsubscribe = gitActivityService.subscribe((update) => {
      setData(update.activities);
      setTotalContributions(update.total);
    }, userId);

    return () => unsubscribe();
  }, [userId]);

  const theme: ThemeInput = {
    dark: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
  };

  const hasActivity = totalContributions > 0;

  return (
    <div className="font-display animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-gh-text-secondary uppercase tracking-widest">
          {hasActivity
            ? `${totalContributions.toLocaleString()} contribs in the last year`
            : "No contributions in the last year"}
        </h3>

        <div className="flex items-center gap-2">
          {hasActivity ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                Auto-Sync Active
              </span>
            </>
          ) : (
            <span className="text-[10px] font-bold text-gh-text-secondary uppercase tracking-widest">
              No activity yet
            </span>
          )}
        </div>
      </div>

      <div className="p-6 bg-gh-bg-secondary border border-gh-border rounded-xl overflow-x-auto custom-scrollbar flex justify-center">
        {data.length > 0 && (
          <ActivityCalendar
            data={data}
            theme={theme}
            blockSize={11}
            blockRadius={2}
            blockMargin={3}
            fontSize={12}
            colorScheme="dark"
            showMonthLabels={true}

            renderBlock={(block: any, activity) => (
              <div
                {...block.props}
                data-tooltip-id="activity-tooltip"
                data-tooltip-content={`${activity.count} contribution${activity.count !== 1 ? "s" : ""} on ${activity.date}`}
                className={`${(block.props as any).className} cursor-pointer hover:ring-1 hover:ring-white/50 transition-all`}
              />
            )}

          />
        )}
        <ReactTooltip
          id="activity-tooltip"
          className="!bg-gh-bg !text-gh-text !text-xs !font-bold !rounded-md !opacity-100 !px-3 !py-2 shadow-xl border border-gh-border"
        />
      </div>

      {hasActivity && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[11px] text-gh-text-secondary">
            <strong>Pro Tip:</strong> Activity is synced from your repositories and workspaces.
          </p>
        </div>
      )}
    </div>
  );
};

export default ContributionHeatmap;
