import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/infra/api";
import { formatDistanceToNow } from "../../utils/dateUtils";
import { CommunityPost } from "../../types";

interface UserCommunityTabProps {
    userId: string;
}

const UserCommunityTab: React.FC<UserCommunityTabProps> = ({ userId }) => {
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // 'all', 'discussion', 'article', 'question'

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                const data = await api.community.list({ authorId: userId });
                setPosts(data);
            } catch (error) {
                console.error("Failed to fetch user community posts", error);
            } finally {
                setLoading(false);
            }
        };
        if (userId) {
            fetchPosts();
        }
    }, [userId]);

    const filteredPosts = posts.filter((post) => {
        if (filter === "all") return true;
        return post.type === filter;
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
                    All activity
                </button>
                <button
                    onClick={() => setFilter("article")}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filter === "article" ? "bg-gh-bg-secondary text-gh-text font-medium" : "text-gh-text-secondary hover:bg-gh-bg-secondary/50"
                        }`}
                >
                    Articles
                </button>
                <button
                    onClick={() => setFilter("discussion")}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filter === "discussion" ? "bg-gh-bg-secondary text-gh-text font-medium" : "text-gh-text-secondary hover:bg-gh-bg-secondary/50"
                        }`}
                >
                    Discussions
                </button>
                <button
                    onClick={() => setFilter("question")}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filter === "question" ? "bg-gh-bg-secondary text-gh-text font-medium" : "text-gh-text-secondary hover:bg-gh-bg-secondary/50"
                        }`}
                >
                    Questions
                </button>
            </div>

            {filteredPosts.length === 0 ? (
                <div className="text-center py-12 border border-gh-border rounded-lg bg-gh-bg-secondary/30">
                    <span className="material-symbols-outlined !text-4xl text-gh-text-secondary mb-3">
                        forum
                    </span>
                    <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                    <p className="text-gh-text-secondary">
                        This user hasn't engaged in this type of community activity yet.
                    </p>
                </div>
            ) : (
                <ul className="divide-y divide-gh-border">
                    {filteredPosts.map((post) => (
                        <li key={post.id} className="py-5">
                            <div className="flex gap-4">
                                <div className="mt-1 shrink-0 text-gh-text-secondary">
                                    <span className="material-symbols-outlined !text-xl">
                                        {post.type === "article" ? "article" : post.type === "question" ? "help" : "forum"}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <Link
                                        to={`/community/post/${post.id}`}
                                        className="text-lg font-semibold text-primary hover:underline"
                                    >
                                        {post.title}
                                    </Link>
                                    <p className="text-sm text-gh-text-secondary mt-1 mb-3 line-clamp-2">
                                        {post.content.replace(/<[^>]*>?/gm, '')}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-gh-text-secondary">
                                        {post.tags && post.tags.map((tag: string) => (
                                            <span key={tag} className="px-2 py-0.5 bg-[#1F242C] text-[#8B949E] rounded-full">
                                                {tag}
                                            </span>
                                        ))}

                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined !text-[14px]">thumb_up</span>
                                            {post.upvotes}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined !text-[14px]">chat_bubble</span>
                                            {post.comments}
                                        </span>
                                        {(post as any).time && (
                                            <span>
                                                {formatDistanceToNow((post as any).time)} ago
                                            </span>
                                        )}
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

export default UserCommunityTab;
