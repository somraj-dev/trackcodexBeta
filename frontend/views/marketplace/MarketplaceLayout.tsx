import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

const tabs = [
    { label: "Missions", path: "/marketplace/missions", icon: "rocket_launch" },
    { label: "Hackathons", path: "/marketplace/hackathons", icon: "quiz" },
    { label: "Events", path: "/marketplace/events", icon: "event" },
    { label: "Jobs", path: "/marketplace/jobs", icon: "work" },
];

const MarketplaceLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const activeTab = tabs.find(t => location.pathname.startsWith(t.path))?.path || tabs[0].path;

    return (
        <div className="flex-1 flex flex-col bg-gh-bg font-display">
            <header className="p-8 pb-0 border-b border-gh-border">
                <div className="max-w-[1400px] mx-auto">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h1 className="text-xl font-semibold text-gh-text tracking-tight mb-2">
                                Marketplace
                            </h1>
                            <p className="text-sm text-gh-text-secondary max-w-2xl leading-relaxed">
                                Discover high-value missions, hackathons, and collaborate with top engineering teams.
                            </p>
                        </div>
                    </div>
                    {/* Tab Navigation */}
                    <div className="flex gap-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.path}
                                onClick={() => navigate(tab.path)}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all relative rounded-t-lg ${
                                    activeTab === tab.path
                                        ? "text-gh-text bg-gh-bg"
                                        : "text-gh-text-secondary hover:text-gh-text hover:bg-gh-bg-secondary"
                                }`}
                            >
                                <span className="material-symbols-outlined !text-[18px]">{tab.icon}</span>
                                {tab.label}
                                {activeTab === tab.path && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f78166]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </header>
            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
};

export default MarketplaceLayout;
