import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/infra/api";
import { formatDistanceToNow } from "../../utils/dateUtils";

// Assuming a simplified workspace type for the tab view
interface WorkspaceOverview {
    id: string;
    name: string;
    description: string | null;
    visibility: string;
    createdAt: string;
    updatedAt: string;
    ownerId: string;
    owner?: { username: string };
    starsCount: number;
}

interface UserWorkspacesTabProps {
    userId: string;
}

const UserWorkspacesTab: React.FC<UserWorkspacesTabProps> = ({ userId }) => {
    const [workspaces, setWorkspaces] = useState<WorkspaceOverview[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");

    useEffect(() => {
        const fetchWorkspaces = async () => {
            setLoading(true);
            try {
                // We'll update the backend to support userId filtering on the workspace list
                const data = await api.workspaces.list({ userId });
                setWorkspaces(data as unknown as WorkspaceOverview[]);
            } catch (error) {
                console.error("Failed to fetch user workspaces", error);
            } finally {
                setLoading(false);
            }
        };
        if (userId) {
            fetchWorkspaces();
        }
    }, [userId]);

    const filteredWorkspaces = workspaces.filter((ws) =>
        ws.name.toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="size-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-4 py-4 border-b border-gh-border">
                <div className="relative flex-1 max-w-lg">
                    <input
                        type="text"
                        placeholder="Find a workspace..."
                        className="w-full bg-gh-bg-secondary border border-gh-border rounded-md pl-3 pr-10 py-1.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-gh-text placeholder:text-gh-text-secondary"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            {filteredWorkspaces.length === 0 ? (
                <div className="text-center py-12 border border-gh-border rounded-lg bg-gh-bg-secondary/30">
                    <h3 className="text-lg font-semibold mb-2">No public workspaces found</h3>
                    <p className="text-gh-text-secondary">
                        {filter ? "None match your search." : "This user doesn't have any public workspaces yet."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {filteredWorkspaces.map((ws) => (
                        <div
                            key={ws.id}
                            className="border border-gh-border rounded-lg p-5 bg-gh-bg/50 hover:bg-gh-bg transition-colors"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <Link
                                    to={`/workspace/${ws.id}`}
                                    className="font-semibold text-primary hover:underline"
                                >
                                    {ws.name}
                                </Link>
                                <span className="text-xs px-2 py-0.5 rounded-full border border-gh-border text-gh-text-secondary capitalize">
                                    {ws.visibility}
                                </span>
                            </div>
                            <p className="text-sm text-gh-text-secondary mb-4 line-clamp-2 min-h-[40px]">
                                {ws.description || "No description provided."}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gh-text-secondary">
                                <div className="flex items-center gap-4">
                                    {ws.starsCount > 0 && (
                                        <span className="flex items-center gap-1 hover:text-[#58A6FF] transition-colors cursor-pointer">
                                            <span className="material-symbols-outlined !text-[14px]">star</span>
                                            {ws.starsCount}
                                        </span>
                                    )}
                                </div>
                                <span>Updated {formatDistanceToNow(ws.updatedAt)} ago</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserWorkspacesTab;
