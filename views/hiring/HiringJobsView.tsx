import React, { useState } from "react";
import PostJobModal from "../../components/jobs/PostJobModal";

const HiringJobsView = () => {
    const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);

    return (
        <div className="p-8 text-gh-text max-w-[1200px] mx-auto">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">Hiring Jobs</h1>
                    <p className="text-gh-text-secondary font-medium">
                        Manage your open engineering roles and hiring pipeline.
                    </p>
                </div>
                <button
                    onClick={() => setIsPostJobModalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined !text-sm">add</span>
                    Create Job
                </button>
            </div>

            <div className="py-20 text-center border border-dashed border-gh-border rounded-2xl bg-gh-bg-secondary">
                <span className="material-symbols-outlined text-4xl mb-4 text-gh-text-secondary">work_off</span>
                <h3 className="text-lg font-bold text-gh-text mb-2">No Active Jobs</h3>
                <p className="text-gh-text-secondary text-sm">
                    You haven't posted any jobs to the marketplace yet.
                </p>
            </div>

            {isPostJobModalOpen && (
                <PostJobModal
                    isOpen={isPostJobModalOpen}
                    onClose={() => setIsPostJobModalOpen(false)}
                    onSubmit={(jobData) => {
                        console.log("Job submitted:", jobData);
                        setIsPostJobModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};

export default HiringJobsView;
