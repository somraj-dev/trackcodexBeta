import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/infra/api";
import { formatDistanceToNow } from "date-fns";

// Assuming a simplified Library resource type
interface LibraryResource {
    id: string;
    title: string;
    description: string;
    type: string;
    tags: string[];
    stars: number;
    downloads: number;
    createdAt: string;
}

interface UserLibraryTabProps {
    userId: string;
}

const UserLibraryTab: React.FC<UserLibraryTabProps> = ({ userId }) => {
    const [resources, setResources] = useState<LibraryResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        const fetchResources = async () => {
            setLoading(true);
            try {
                const data = await api.library.list({ authorId: userId });
                setResources(data);
            } catch (error) {
                console.error("Failed to fetch user library resources", error);
            } finally {
                setLoading(false);
            }
        };
        if (userId) {
            fetchResources();
        }
    }, [userId]);

    const filteredResources = resources.filter((resource) => {
        if (filter === "all") return true;
        return resource.type === filter;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="size-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 py-4 border-b border-gh-border overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setFilter("all")}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filter === "all" ? "bg-gh-bg-secondary text-gh-text font-medium" : "text-gh-text-secondary hover:bg-gh-bg-secondary/50"
                        }`}
                >
                    All assets
                </button>
                <button
                    onClick={() => setFilter("snippet")}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filter === "snippet" ? "bg-gh-bg-secondary text-gh-text font-medium" : "text-gh-text-secondary hover:bg-gh-bg-secondary/50"
                        }`}
                >
                    Snippets
                </button>
                <button
                    onClick={() => setFilter("extension")}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filter === "extension" ? "bg-gh-bg-secondary text-gh-text font-medium" : "text-gh-text-secondary hover:bg-gh-bg-secondary/50"
                        }`}
                >
                    Extensions
                </button>
                <button
                    onClick={() => setFilter("guide")}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filter === "guide" ? "bg-gh-bg-secondary text-gh-text font-medium" : "text-gh-text-secondary hover:bg-gh-bg-secondary/50"
                        }`}
                >
                    Guides
                </button>
            </div>

            {filteredResources.length === 0 ? (
                <div className="text-center py-12 border border-gh-border rounded-lg bg-gh-bg-secondary/30">
                    <span className="material-symbols-outlined !text-4xl text-gh-text-secondary mb-3">
                        extension
                    </span>
                    <h3 className="text-lg font-semibold mb-2">No components published</h3>
                    <p className="text-gh-text-secondary">
                        This user hasn't published any resources to the Forge Library yet.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {filteredResources.map((resource) => (
                        <div
                            key={resource.id}
                            className="border border-gh-border rounded-lg p-5 bg-gh-bg/50 hover:border-[#58A6FF]/50 transition-colors"
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <span className="material-symbols-outlined text-[#8B949E] mt-0.5">
                                    {resource.type === "snippet" ? "data_object" : resource.type === "extension" ? "extension" : "menu_book"}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <Link
                                        to={`/library/${resource.id}`}
                                        className="font-semibold text-primary hover:underline block truncate"
                                    >
                                        {resource.title}
                                    </Link>
                                    <p className="text-sm text-gh-text-secondary mt-1 line-clamp-2 min-h-[40px]">
                                        {resource.description}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-gh-text-secondary mt-4">
                                {resource.tags && resource.tags.slice(0, 2).map((tag) => (
                                    <span key={tag} className="px-2 py-0.5 bg-gh-bg-secondary rounded-md">
                                        {tag}
                                    </span>
                                ))}

                                <span className="flex items-center gap-1 ml-auto">
                                    <span className="material-symbols-outlined !text-[14px]">star</span>
                                    {resource.stars}
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined !text-[14px]">download</span>
                                    {resource.downloads}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserLibraryTab;


