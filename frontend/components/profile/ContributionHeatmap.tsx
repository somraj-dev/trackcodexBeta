import React, { useState, useEffect } from "react";
import { ActivityCalendar, ThemeInput } from "react-activity-calendar";
import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { useTheme } from "../../context/ThemeContext";
import {
  gitActivityService,
  Activity,
} from "../../services/git/gitActivityService";

interface Props {
  userId?: string | null;
}

const ContributionHeatmap: React.FC<Props> = ({ userId }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme.type === "dark";

  const currentYear = new Date().getFullYear();
  const [data, setData] = useState<Activity[]>([]);
  const [totalContributions, setTotalContributions] = useState(0);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [activeYears, setActiveYears] = useState<number[]>([currentYear]);

  useEffect(() => {
    // Subscribe with the real userId and selected year
    const unsubscribe = gitActivityService.subscribe((update) => {
      setData(update.activities);
      setTotalContributions(update.total);
      if (update.activeYears?.length > 0) {
        setActiveYears(update.activeYears);
      }
    }, userId, selectedYear);

    return () => unsubscribe();
  }, [userId, selectedYear]);

  // Dynamic Theme Palette
  const calendarTheme: ThemeInput = {
    light: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
    dark: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
  };

  const hasActivity = totalContributions > 0;

  // Dynamic Styles based on theme
  const styles = {
    container: isDark ? "bg-[#0d1117] border-[#30363d]" : "bg-white border-[#d0d7de]",
    textMain: isDark ? "text-[#c9d1d9]" : "text-[#24292f]",
    textMuted: isDark ? "text-[#8b949e]" : "text-[#57606a]",
    yearButtonActive: isDark ? "bg-[#38bdf8] text-white" : "bg-[#0969da] text-white",
    yearButtonInactive: isDark ? "text-[#8b949e] hover:bg-white/5" : "text-[#57606a] hover:bg-[#f3f4f6]"
  };

  return (
    <div className="font-display animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Heatmap main panel */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-[16px] font-normal ${styles.textMain}`}>
              {totalContributions.toLocaleString()} contributions in {selectedYear === currentYear ? 'the last year' : selectedYear}
            </h3>

            <div className="flex items-center gap-1 cursor-pointer group">
              <span className={`text-xs ${styles.textMuted} group-hover:text-blue-500 transition-colors`}>
                Contribution settings
              </span>
              <span className={`material-symbols-outlined !text-[16px] ${styles.textMuted} group-hover:text-blue-500`}>
                arrow_drop_down
              </span>
            </div>
          </div>

          <div className={`p-4 border rounded-md overflow-x-auto no-scrollbar relative ${styles.container}`}>
            <div className="min-w-[750px] relative">
              {data.length > 0 && (
                <ActivityCalendar
                  data={data}
                  theme={calendarTheme}
                  blockSize={12}
                  blockRadius={2}
                  blockMargin={3}
                  fontSize={12}
                  colorScheme={isDark ? "dark" : "light"}
                  showMonthLabels={true}
                  showWeekdayLabels={true}
                  labels={{
                    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                    totalCount: "{{count}} contributions in {{year}}",
                    legend: {
                      less: "Less",
                      more: "More",
                    },
                  }}
                  renderBlock={(block: any, activity) => (
                    React.cloneElement(block, {
                      "data-tooltip-id": "activity-tooltip",
                      "data-tooltip-content": `${activity.count} contribution${activity.count !== 1 ? "s" : ""} on ${activity.date}`,
                      className: `${block.props.className || ""} cursor-pointer ${isDark ? "hover:stroke-white/30" : "hover:stroke-[#24292f]"} hover:stroke-1 transition-all`
                    })
                  )}
                />
              )}
            </div>
            
            <div className="mt-2 flex items-center justify-between">
              <a 
                 href="#" 
                 className={`text-[12px] ${styles.textMuted} hover:text-blue-500 transition-colors`}
              >
                Learn how we count contributions
              </a>
            </div>

            <ReactTooltip
              id="activity-tooltip"
              className={`!text-xs !font-medium !rounded-md !opacity-100 !px-3 !py-1.5 shadow-lg border-none z-50 ${isDark ? "!bg-[#444c56] !text-white" : "!bg-[#24292f] !text-white"}`}
            />
          </div>
        </div>

        {/* Year Selector Sidebar */}
        <div className="w-full lg:w-32 flex flex-col gap-1 mt-8">
          {activeYears.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`w-full py-2 px-4 rounded-md text-[13px] font-medium transition-all text-left ${
                selectedYear === year
                  ? styles.yearButtonActive
                  : styles.yearButtonInactive
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContributionHeatmap;
