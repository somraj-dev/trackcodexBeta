import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/infra/api";
import { Repository } from "../../types";
import { formatDistanceToNow } from "../../utils/dateUtils";

interface UserRepositoriesTabProps {
    userId: string;
}

const UserRepositoriesTab: React.FC<UserRepositoriesTabProps> = ({ userId }) => {
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");

    useEffect(() => {
        const fetchRepos = async () => {
            setLoading(true);
            try {
                const data = await api.repositories.list({ userId });
                setRepositories(data);
            } catch (error) {
                console.error("Failed to fetch user repositories", error);
            } finally {
                setLoading(false);
            }
        };
        if (userId) {
            fetchRepos();
        }
    }, [userId]);

    const filteredRepos = repositories.filter((repo) =>
        repo.name.toLowerCase().includes(filter.toLowerCase())
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
            {/* Search Bar */}
            <div className="flex items-center gap-4 py-4 border-b border-gh-border">
                <div className="relative flex-1 max-w-lg">
                    <input
                        type="text"
                        placeholder="Find a repository..."
                        className="w-full bg-gh-bg-secondary border border-gh-border rounded-md pl-3 pr-10 py-1.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-gh-text placeholder:text-gh-text-secondary"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            {/* Repo List */}
            {filteredRepos.length === 0 ? (
                <div className="text-center py-12 border border-gh-border rounded-lg bg-gh-bg-secondary/30">
                    <h3 className="text-lg font-semibold mb-2">
                        No public repositories found
                    </h3>
                    <p className="text-gh-text-secondary">
                        {filter ? "None match your search." : "This user doesn't have any public repositories yet."}
                    </p>
                </div>
            ) : (
                <ul className="divide-y divide-gh-border">
                    {filteredRepos.map((repo) => (
                        <li key={repo.id} className="py-6 group">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-xl font-semibold break-all">
                                            <Link
                                                to={`/${(repo.owner as unknown as { username: string })?.username || "repo"}/${repo.name}`}
                                                className="text-[#58A6FF] hover:underline"
                                            >
                                                {repo.name}
                                            </Link>
                                        </h3>
                                        <span className="px-2 py-0.5 text-xs font-medium border border-gh-border rounded-full text-gh-text-secondary">
                                            {repo.isPublic ? "Public" : "Private"}
                                        </span>
                                    </div>

                                    {repo.description && (
                                        <p className="text-gh-text-secondary text-sm mb-4 max-w-2xl line-clamp-2">
                                            {repo.description}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap items-center gap-4 text-xs text-gh-text-secondary">
                                        {repo.language && (
                                            <div className="flex items-center gap-1.5">
                                                <span
                                                    className="w-3 h-3 rounded-full"
                                                    style={{
                                                        backgroundColor: repo.techColor || "#888",
                                                    }}
                                                ></span>
                                                <span>{repo.language}</span>
                                            </div>
                                        )}

                                        {repo.stars > 0 && (
                                            <Link
                                                to={`/${(repo.owner as unknown as { username: string })?.username || "repo"}/${repo.name}/stargazers`}
                                                className="flex items-center gap-1 hover:text-[#58A6FF] transition-colors"
                                            >
                                                <span className="material-symbols-outlined !text-[14px]">star</span>
                                                {repo.stars}
                                            </Link>
                                        )}

                                        {(repo as any).forksCount && ((repo as any).forksCount > 0) ? (
                                            <Link
                                                to={`/${(repo.owner as unknown as { username: string })?.username || "repo"}/${repo.name}/network/members`}
                                                className="flex items-center gap-1 hover:text-[#58A6FF] transition-colors"
                                            >
                                                <span className="material-symbols-outlined !text-[14px]">fork_right</span>
                                                {(repo as any).forksCount}
                                            </Link>
                                        ) : null}

                                        {repo.updatedAt && (
                                            <span className="whitespace-nowrap">
                                                Updated {formatDistanceToNow(repo.updatedAt)} ago
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    {/* Future: Star button component */}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default UserRepositoriesTab;
