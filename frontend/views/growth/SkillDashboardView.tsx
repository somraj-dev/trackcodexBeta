import React, { useState, useEffect } from "react";
import { api, useAuth } from "../../context/AuthContext";

const SkillDashboardView = () => {
  const { user } = useAuth();
  const [growthData, setGrowthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const fetchGrowth = async () => {
      try {
        const response = await api.get(`/growth/${user.id}`);
        if (response.data.success) {
          setGrowthData(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching growth data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGrowth();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-64 text-gh-text-secondary">
        <span className="material-symbols-outlined animate-spin text-4xl mr-3 text-primary">autorenew</span>
        <p>Loading your growth telemetry...</p>
      </div>
    );
  }

  const hasData = growthData && (growthData.skillRadar?.length > 0 || growthData.growthPath?.length > 0);

  return (
    <div className="p-8 text-gh-text max-w-[1200px] mx-auto">
      <div className="flex items-center gap-6 mb-10">
        <img src={user?.avatar || "https://ui-avatars.com/api/?name=User"} alt="Profile" className="size-24 rounded-full border-4 border-[#30363d] shadow-2xl" />
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Growth Dashboard</h1>
          <p className="text-gh-text-secondary font-medium">
            Track your engineering leveled progress and skill acquisition.
          </p>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl p-16 text-center shadow-xl">
          <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">insights</span>
          <h2 className="text-2xl font-bold mb-2">No Growth Telemetry Yet</h2>
          <p className="text-gh-text-secondary max-w-md mx-auto">
            Complete missions, merge PRs, and engage with repositories to start tracking your skill tree progression.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl p-8 shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">radar</span>
              Skill Proficiency Radar
            </h2>
            <div className="space-y-4">
              {growthData.skillRadar?.map((skill: any) => (
                <div key={skill.subject}>
                  <div className="flex justify-between text-sm mb-1 font-bold">
                    <span>{skill.subject}</span>
                    <span className="text-primary">{skill.score}%</span>
                  </div>
                  <div className="h-2 w-full bg-gh-bg border border-gh-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000"
                      style={{ width: `${skill.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl p-8 shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">trending_up</span>
              Recommended Growth Path
            </h2>
            <div className="space-y-4">
              {growthData.growthPath?.map((path: any, i: number) => (
                <div key={i} className="p-4 bg-gh-bg border border-gh-border rounded-xl hover:border-emerald-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-white">{path.skill}</h3>
                      <p className="text-xs text-gh-text-secondary uppercase tracking-wider">{path.category}</p>
                    </div>
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded text-right">
                      {path.recommendation}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <span className="text-xs font-bold text-slate-400 w-12 text-right">{path.currentProficiency}%</span>
                    <div className="flex-1 h-1.5 bg-gh-bg-tertiary rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${path.currentProficiency}%` }} />
                    </div>
                    <span className="text-xs font-bold text-white uppercase">{path.targetLevel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillDashboardView;
