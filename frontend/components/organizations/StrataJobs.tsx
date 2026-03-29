import React from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Strata } from "../../types";
import MarketplaceJobCard from "../jobs/MarketplaceJobCard";

const StrataJobs = () => {
    const navigate = useNavigate();
    const { strata } = useOutletContext<{ strata: Strata }>();

    // Mock jobs for this specific strata
    const MOCK_STRATA_JOBS = [
        {
            id: `${strata.id}-j1`,
            title: "Senior Product Designer",
            description: "Join the design team to build cutting-edge solutions for our platform.",
            positions: 1,
            type: "Full Time",
            location: "WFO",
            icon: "polymer",
            iconBg: "#fee2e2",
        },
        {
            id: `${strata.id}-j2`,
            title: "Frontend Engineer",
            description: "Scale our React-based dashboard systems and collaborate with world-class engineers.",
            positions: 2,
            type: "Full Time",
            location: "Remote",
            icon: "science",
            iconBg: "#e0f2fe",
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-xl font-bold text-gh-text mb-1">Open Positions</h2>
                    <p className="text-gh-text-secondary text-sm">
                        Manage your active hiring roles for <span className="text-gh-text font-bold">{strata.name}</span>.
                    </p>
                </div>
                <button
                    onClick={() => navigate("/marketplace/missions/new")}
                    className="px-6 py-2.5 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                    <span className="material-symbols-outlined !text-[18px]">add</span>
                    Create Job
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_STRATA_JOBS.map((job) => (
                    <MarketplaceJobCard key={job.id} job={job} />
                ))}
            </div>

            {MOCK_STRATA_JOBS.length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-gh-border rounded-2xl bg-gh-bg-secondary/30">
                    <span className="material-symbols-outlined text-4xl text-gh-text-secondary mb-4">work_off</span>
                    <h3 className="text-lg font-bold text-gh-text mb-2">No active jobs</h3>
                    <p className="text-gh-text-secondary text-sm mb-6">You haven't posted any jobs for this strata yet.</p>
                    <button
                        onClick={() => navigate("/marketplace/missions/new")}
                        className="px-5 py-2 bg-gh-bg-tertiary hover:bg-gh-bg-tertiary/80 text-gh-text rounded-lg font-bold text-[13px] border border-gh-border transition-colors"
                    >
                        Create Your First Job
                    </button>
                </div>
            )}
        </div>
    );
};

export default StrataJobs;
