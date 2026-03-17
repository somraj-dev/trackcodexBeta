import React, { useState, useEffect } from "react";
import ProfileCard from "../../components/profile/ProfileCard";
import Highlights from "../../components/profile/Highlights";
import CodingSnapshot from "../../components/profile/CodingSnapshot";
import ForgeAIUsage from "../../components/profile/ForgeAIUsage";
import SecurityImpact from "../../components/profile/SecurityImpact";
import FreelanceCard from "../../components/profile/FreelanceCard";
import PinnedRepos from "../../components/profile/PinnedRepos";
import ContributionHeatmap from "../../components/profile/ContributionHeatmap";
import ActivityFeed from "../../components/profile/ActivityFeed";
import VisualPortfolio from "../../components/profile/VisualPortfolio";
import { profileService, UserProfile } from "../../services/activity/profile";
import { useNavigate } from "react-router-dom";
import { Repository } from "../../types";
import { api } from "../../services/infra/api";

interface ProfileRepositoriesProps {
  repos: Repository[];
  loading: boolean;
  error: string;
}

const ProfileRepositories: React.FC<ProfileRepositoriesProps> = ({ repos, loading, error }) => {
  const navigate = useNavigate();


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <div className="h-7 w-32 bg-gh-border/20 animate-pulse rounded-md"></div>
          <div className="h-8 w-48 bg-gh-border/20 animate-pulse rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-gh-bg-secondary border border-gh-border p-5 rounded-lg h-[160px] animate-pulse relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-semibold text-gh-text tracking-tight">
          Repositories
        </h3>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gh-text-secondary text-sm">
              search
            </span>
            <input
              className="bg-gh-bg border border-gh-border rounded-md pl-9 pr-4 py-1.5 text-xs text-gh-text focus:ring-1 focus:ring-primary w-64 outline-none transition-all placeholder:text-gh-text-secondary"
              placeholder="Search profile repositories..."
            />
          </div>
          <button
            onClick={() => navigate("/repositories")}
            className="text-[11px] font-bold uppercase text-primary tracking-widest hover:underline flex items-center gap-1"
          >
            Global View{" "}
            <span className="material-symbols-outlined !text-[16px]">
              open_in_new
            </span>
          </button>
        </div>
      </div>

      {repos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gh-border rounded-xl bg-gh-bg-secondary/30">
          <span className="material-symbols-outlined text-gh-text-secondary text-4xl mb-4">account_tree</span>
          <p className="text-gh-text-secondary text-sm">No repositories found.</p>
          <button
            onClick={() => navigate("/repositories/new")}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md text-xs font-bold hover:bg-opacity-90 transition-all"
          >
            Create Repository
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repos.map((repo) => (
            <div
              key={repo.id}
              onClick={() => navigate(`/repo/${repo.id}`)}
              className="group bg-gh-bg-secondary border border-gh-border p-5 rounded-lg hover:border-gh-text-secondary transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-md bg-gh-bg border border-gh-border flex items-center justify-center text-gh-text-secondary group-hover:text-primary transition-all">
                    <span className="material-symbols-outlined">
                      account_tree
                    </span>
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-gh-text group-hover:text-primary transition-colors">
                      {repo.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gh-text-secondary font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border border-gh-border">
                        {repo.visibility || (repo.isPublic ? "PUBLIC" : "PRIVATE")}
                      </span>
                      {repo.license && (
                        <span className="text-[10px] text-gh-text-secondary font-medium">
                          ⚖️ {repo.license}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gh-text-secondary line-clamp-2 mb-4 h-[32px]">
                {repo.description || "No description provided."}
              </p>

              <div className="flex items-center justify-between border-t border-gh-border pt-3 mt-auto">
                <div className="flex items-center gap-4 text-xs font-bold text-gh-text-secondary">
                  <span className="flex items-center gap-1">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: repo.techColor || "#8b949e" }}
                    ></span>
                    {repo.language || repo.techStack || "Plain Text"}
                  </span>
                  <span className="flex items-center gap-1 hover:text-white">
                    <span className="material-symbols-outlined !text-[14px]">
                      star
                    </span>
                    {repo.stars || 0}
                  </span>
                  <span className="flex items-center gap-1 hover:text-white pointer-events-none">
                    <span className="material-symbols-outlined !text-[14px]">
                      adjust
                    </span>
                    {repo.open_issues || 0}
                  </span>
                </div>
                <span className="text-[10px] text-gh-text-secondary font-medium uppercase tracking-wider">
                  Updated {repo.updatedAt ? new Date(repo.updatedAt).toLocaleDateString() : (repo.lastUpdated || "Recently")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProfileView = () => {
  const [profile, setProfile] = useState<UserProfile>(
    profileService.getProfile(),
  );
  const [activeTab, setActiveTab] = useState("Overview");
  const [isSyncing, setIsSyncing] = useState(false);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [repoError, setRepoError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Sync with backend on mount
    const syncProfile = async () => {
      setIsSyncing(true);
      try {
        const me = await api.auth.getMe() as any;
        const backendProfile = me?.user;
        if (backendProfile) {
          // Step 1: Update basic identity fields
          profileService.updateProfile({
            id: backendProfile.id,
            name: backendProfile.name || backendProfile.username,
            username: backendProfile.username,
            avatar: backendProfile.avatar,
            role: backendProfile.role,
          });

          // Step 2: Fetch enriched profile with unique metrics (skillMetrics, skillScore, freelancerProfile)
          try {
            const enriched = await profileService.getProfileByIdOrUsername(backendProfile.id);
            if (enriched) {
              profileService.updateProfile({
                skillMetrics: enriched.skillMetrics,
                skillScore: enriched.skillScore,
                freelancerProfile: enriched.freelancerProfile,
              });
              // Also update local state directly so cards re-render immediately
              setProfile((prev) => ({
                ...prev,
                skillMetrics: enriched.skillMetrics,
                skillScore: enriched.skillScore,
                freelancerProfile: enriched.freelancerProfile,
              }));
            }
          } catch (metricsErr) {
            console.warn("Could not fetch enriched profile metrics", metricsErr);
          }
        }
      } catch (err) {
        console.error("Profile sync failed", err);
      } finally {
        setIsSyncing(false);
      }
    };

    syncProfile();

    const fetchRepos = async () => {
      setLoadingRepos(true);
      try {
        const data = await api.repositories.list();
        setRepos(data);
      } catch (err) {
        console.error("Failed to fetch repos", err);
        setRepoError("Failed to fetch repositories.");
      } finally {
        setLoadingRepos(false);
      }
    };
    fetchRepos();

    return profileService.subscribe((updated) => setProfile(updated));
  }, []);

  const tabs = [
    { label: "Overview", icon: "dashboard" },
    { label: "Code & Repos", icon: "account_tree", badge: profile.jobsCompleted > 0 ? String(profile.jobsCompleted) : "0" },
    { label: "Security", icon: "verified_user", badge: "Top 5%" },
    { label: "AI & ForgeAI", icon: "auto_awesome" },
    { label: "Community", icon: "hub" },
    { label: "Portfolio", icon: "grid_view" },
    { label: "Jobs", icon: "work" },
  ];

  const handleTabClick = (label: string) => {
    setActiveTab(label);
  };

  return (
    <div className="font-display p-10">
      <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-12">
        {/* Profile Identity Sidebar */}
        <div className="w-full lg:w-[300px] shrink-0 animate-in fade-in slide-in-from-left duration-500">
          <ProfileCard profile={profile} />
        </div>

        {/* Dynamic Content Dashboard */}
        <div className="flex-1 min-w-0">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-6 border-b border-gh-border mb-10 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => handleTabClick(tab.label)}
                className={`flex items-center gap-2 pb-4 text-[14px] font-medium transition-all relative shrink-0 ${activeTab === tab.label ? "text-gh-text" : "text-gh-text-secondary hover:text-gh-text"}`}
              >
                <span className="material-symbols-outlined !text-[20px] opacity-70">
                  {tab.icon}
                </span>
                {tab.label}
                {tab.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tab.label === "Security"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-gh-bg-secondary text-gh-text-secondary border border-gh-border"
                      }`}
                  >
                    {tab.badge}
                  </span>
                )}
                {activeTab === tab.label && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {activeTab === "Overview" && (
              <div className="space-y-12">
                <Highlights profile={profile} />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                  <CodingSnapshot profile={profile} />
                  <SecurityImpact profile={profile} />
                  <ForgeAIUsage profile={profile} />
                  <FreelanceCard profile={profile} />
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                  <div className="xl:col-span-2 space-y-12">
                    <PinnedRepos />
                    <ContributionHeatmap userId={profile.id} />

                  </div>
                  <div className="space-y-12">
                    <ActivityFeed profile={profile} />

                    <div className="p-6 bg-gh-bg-secondary border border-gh-border rounded-xl relative overflow-hidden group">
                      <div className="flex items-center gap-2 mb-4 text-primary">
                        <span className="material-symbols-outlined filled !text-xl">
                          verified
                        </span>
                        <h3 className="text-[10px] font-black uppercase tracking-widest">
                          ForgeAI Audited
                        </h3>
                      </div>
                      <p className="text-[13px] text-gh-text-secondary leading-relaxed font-medium">
                        Professional history and community contributions are
                        verified by ForgeAI protocols to maintain network-wide
                        trust levels.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Code & Repos" && (
              <ProfileRepositories repos={repos} loading={loadingRepos} error={repoError} />
            )}

            {activeTab === "Security" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gh-text">
                    Recent Security Audits
                  </h2>
                  <button
                    onClick={() => navigate("/activity")}
                    className="text-xs font-bold text-primary uppercase tracking-widest"
                  >
                    View Full Dashboard
                  </button>
                </div>
                {/* Security Summary Component */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gh-bg-secondary border border-gh-border p-6 rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <span className="material-symbols-outlined">
                          shield
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gh-text">
                          Vulnerability Scan
                        </h4>
                        <p className="text-xs text-gh-text-secondary">
                          Last run 2 hours ago
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div>
                        <div className="text-2xl font-black text-gh-text">
                          0
                        </div>
                        <div className="text-[10px] font-bold text-gh-text-secondary uppercase tracking-widest">
                          Critical
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-gh-text">
                          2
                        </div>
                        <div className="text-[10px] font-bold text-gh-text-secondary uppercase tracking-widest">
                          Warnings
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-emerald-500">
                          98%
                        </div>
                        <div className="text-[10px] font-bold text-gh-text-secondary uppercase tracking-widest">
                          Score
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gh-bg-secondary border border-gh-border p-6 rounded-xl">
                    <h4 className="text-sm font-bold text-gh-text mb-4">
                      Recent Flags Resolved
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-center justify-between text-xs">
                        <span className="text-gh-text-secondary">
                          Depedency Outdated (lodash)
                        </span>
                        <span className="text-emerald-500 font-bold">
                          Fixed
                        </span>
                      </li>
                      <li className="flex items-center justify-between text-xs">
                        <span className="text-gh-text-secondary">
                          Exposed ENV var in logs
                        </span>
                        <span className="text-emerald-500 font-bold">
                          Fixed
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "AI & ForgeAI" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gh-text">
                    ForgeAI Activity
                  </h2>
                  <button
                    onClick={() => navigate("/forge-ai")}
                    className="text-xs font-bold text-primary uppercase tracking-widest"
                  >
                    Open Lab
                  </button>
                </div>
                <div className="bg-gh-bg-secondary border border-gh-border p-8 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="size-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                      <span className="material-symbols-outlined text-3xl">
                        auto_awesome
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gh-text">
                        Weekly Compute Usage
                      </h3>
                      <p className="text-sm text-gh-text-secondary">
                        You have used{" "}
                        <strong className="text-gh-text">14.2 hours</strong> of
                        GPU time this week.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-purple-400">
                      842
                    </div>
                    <div className="text-xs font-bold text-gh-text-secondary uppercase tracking-widest">
                      Tokens / Sec
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Community" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gh-text">
                    Community Contributions
                  </h2>
                  <button
                    onClick={() => navigate("/community")}
                    className="text-xs font-bold text-primary uppercase tracking-widest"
                  >
                    Visit Hub
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      label: "Karma",
                      value: profile.communityKarma,
                      icon: "favorite",
                      color: "text-rose-500",
                    },
                    {
                      label: "Posts",
                      value: profile.postsCount,
                      icon: "article",
                      color: "text-blue-400",
                    },
                    {
                      label: "Following",
                      value: profile.following,
                      icon: "group",
                      color: "text-amber-400",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-gh-bg-secondary border border-gh-border p-6 rounded-xl flex items-center gap-4"
                    >
                      <span
                        className={`material-symbols-outlined ${stat.color}`}
                      >
                        {stat.icon}
                      </span>
                      <div>
                        <div className="text-xl font-black text-gh-text">
                          {stat.value}
                        </div>
                        <div className="text-[10px] font-bold text-gh-text-secondary uppercase tracking-widest">
                          {stat.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "Portfolio" && <VisualPortfolio repos={repos} loading={loadingRepos} />}

            {activeTab === "Jobs" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gh-text">
                    Recent Missions
                  </h2>
                  <button
                    onClick={() => navigate("/dashboard/jobs")}
                    className="text-xs font-bold text-primary uppercase tracking-widest"
                  >
                    Browse All
                  </button>
                </div>
                <div className="bg-gh-bg-secondary border border-gh-border rounded-xl overflow-hidden">
                  {[
                    {
                      title: "Backend Refactor for Fintech App",
                      status: "In Progress",
                      pay: "$4,500",
                    },
                    {
                      title: "React Native UI Polish",
                      status: "Completed",
                      pay: "$1,200",
                    },
                  ].map((job, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-6 border-b border-gh-border last:border-[#1A1A1A] hover:bg-gh-bg-tertiary transition-colors"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-gh-text">
                          {job.title}
                        </h4>
                        <span className="text-xs text-gh-text-secondary">
                          Contract • Remote
                        </span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${job.status === "Completed" ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"}`}
                        >
                          {job.status}
                        </span>
                        <span className="text-sm font-bold text-gh-text">
                          {job.pay}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;



