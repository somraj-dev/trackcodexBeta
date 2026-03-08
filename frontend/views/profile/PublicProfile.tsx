import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { profileService, UserProfile } from "../../services/activity/profile";
import ProfileCard from "../../components/profile/ProfileCard";
import Highlights from "../../components/profile/Highlights";
import CodingSnapshot from "../../components/profile/CodingSnapshot";
import SecurityImpact from "../../components/profile/SecurityImpact";
import ForgeAIUsage from "../../components/profile/ForgeAIUsage";
import ContributionHeatmap from "../../components/profile/ContributionHeatmap";
import PinnedRepos from "../../components/profile/PinnedRepos";
import ActivityFeed from "../../components/profile/ActivityFeed";
import VisualPortfolio from "../../components/profile/VisualPortfolio";
import UserRepositoriesTab from "../../components/profile/UserRepositoriesTab";
import UserWorkspacesTab from "../../components/profile/UserWorkspacesTab";
import UserCommunityTab from "../../components/profile/UserCommunityTab";
import UserJobsTab from "../../components/profile/UserJobsTab";
import UserLibraryTab from "../../components/profile/UserLibraryTab";

export const PublicProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");

  useEffect(() => {
    if (userId) {
      loadProfile(userId);
    }
  }, [userId]);

  const loadProfile = async (id: string) => {
    setLoading(true);
    try {
      const data = await profileService.getProfileByIdOrUsername(id);
      setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-gh-bg flex flex-col items-center justify-center">
        <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="text-gh-text-secondary font-bold animate-pulse">
          Decrypting Profile...
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-full bg-gh-bg flex flex-col items-center justify-center p-6 text-center">
        <span className="material-symbols-outlined !text-6xl text-rose-500 mb-4">
          person_off
        </span>
        <h2 className="text-2xl font-bold text-gh-text mb-2">
          Profile Not Found
        </h2>
        <p className="text-gh-text-secondary mb-6 max-w-md">
          The user you are looking for does not exist or has set their profile
          to private.
        </p>
        <button
          onClick={() => navigate("/dashboard/home")}
          className="px-6 py-2 bg-gh-bg-secondary border border-gh-border rounded-lg text-sm font-bold text-gh-text hover:border-primary transition-all"
        >
          Return Home
        </button>
      </div>
    );
  }

  const tabs = ["Overview", "Repositories", "Workspaces", "Community", "Jobs", "Library"];

  return (
    <div className="min-h-full bg-gh-bg text-gh-text font-display">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar */}
          <aside>
            <ProfileCard profile={profile} />
          </aside>

          {/* Main Content */}
          <main className="min-w-0">
            {/* Tabs Navigation */}
            <div className="flex items-center gap-1 border-b border-gh-border mb-8 overflow-x-auto no-scrollbar sticky top-0 bg-gh-bg/80 backdrop-blur-md z-40">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === tab
                    ? "text-gh-text"
                    : "text-gh-text-secondary hover:text-gh-text"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[18px]">
                      {tab === "Overview"
                        ? "dashboard"
                        : tab === "Repositories"
                          ? "book"
                          : tab === "Workspaces"
                            ? "laptop_mac"
                            : tab === "Community"
                              ? "forum"
                              : tab === "Jobs"
                                ? "work"
                                : "extension"}
                    </span>
                    {tab}
                  </div>
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "Overview" && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Highlights />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <CodingSnapshot />
                  <SecurityImpact />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-8">
                  <div className="space-y-8">
                    <PinnedRepos />
                    <ContributionHeatmap />
                  </div>
                  <div className="space-y-8">
                    <ForgeAIUsage />
                    <ActivityFeed />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Repositories" && <UserRepositoriesTab userId={profile.id} />}
            {activeTab === "Workspaces" && <UserWorkspacesTab userId={profile.id} />}
            {activeTab === "Community" && <UserCommunityTab userId={profile.id} />}
            {activeTab === "Jobs" && <UserJobsTab userId={profile.id} />}
            {activeTab === "Library" && <UserLibraryTab userId={profile.id} />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;




