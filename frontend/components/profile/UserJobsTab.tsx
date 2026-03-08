import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/infra/api";
import { formatDistanceToNow } from "../../utils/dateUtils";

// Assuming a simplified job type for the tab view
interface JobOverview {
    id: string;
    title: string;
    description: string;
    budget: string | null;
    type: string;
    status: string;
    techStack: string[];
    createdAt: string;
    creatorId: string;
}

interface UserJobsTabProps {
    userId: string;
}

const UserJobsTab: React.FC<UserJobsTabProps> = ({ userId }) => {
    const [jobs, setJobs] = useState<JobOverview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            try {
                const data = await api.jobs.list({ creatorId: userId });
                setJobs(data as unknown as JobOverview[]);
            } catch (error) {
                console.error("Failed to fetch user jobs", error);
            } finally {
                setLoading(false);
            }
        };
        if (userId) {
            fetchJobs();
        }
    }, [userId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="size-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            {jobs.length === 0 ? (
                <div className="text-center py-12 border border-gh-border rounded-lg bg-gh-bg-secondary/30">
                    <span className="material-symbols-outlined !text-4xl text-gh-text-secondary mb-3">
                        work
                    </span>
                    <h3 className="text-lg font-semibold mb-2">No missions posted</h3>
                    <p className="text-gh-text-secondary">
                        This user hasn't created any missions or bounties yet.
                    </p>
                </div>
            ) : (
                <ul className="divide-y divide-gh-border mt-4 border-t border-gh-border">
                    {jobs.map((job) => (
                        <li key={job.id} className="py-6">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Link
                                            to={`/marketplace/missions/${job.id}`}
                                            className="text-lg font-semibold text-primary hover:underline"
                                        >
                                            {job.title}
                                        </Link>
                                        <span className={`px-2 py-0.5 text-xs font-medium border rounded-full ${job.status === "Open" ? "border-green-500/30 text-green-400 bg-green-500/10" :
                                            job.status === "InProgress" ? "border-blue-500/30 text-blue-400 bg-blue-500/10" :
                                                "border-purple-500/30 text-purple-400 bg-purple-500/10"
                                            }`}>
                                            {job.status}
                                        </span>
                                    </div>

                                    <p className="text-sm text-gh-text-secondary mb-4 line-clamp-2 max-w-2xl">
                                        {job.description}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-4 text-xs text-gh-text-secondary">
                                        <span className="flex items-center gap-1 font-medium text-gh-text">
                                            <span className="material-symbols-outlined !text-[16px]">account_balance_wallet</span>
                                            {job.budget || "Unspecified"} ({job.type})
                                        </span>

                                        {job.techStack && job.techStack.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                {job.techStack.map((tech) => (
                                                    <span key={tech} className="bg-gh-bg-secondary px-2 py-0.5 rounded-md text-gh-text-secondary">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <span>Modified {formatDistanceToNow(job.createdAt)} ago</span>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default UserJobsTab;
