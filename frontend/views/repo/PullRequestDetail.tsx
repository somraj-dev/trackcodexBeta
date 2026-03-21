import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import diffLang from "react-syntax-highlighter/dist/esm/languages/hljs/diff";
import { githubGist } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { api } from "../../services/infra/api";
import { ReactionPicker, ReactionList } from "../../components/common/ReactionSystem";

SyntaxHighlighter.registerLanguage("diff", diffLang);

interface PR {
  id: string;
  number: number;
  title: string;
  body: string;
  status: "OPEN" | "CLOSED" | "MERGED";
  createdAt: string;
  head: string;
  base: string;
  author: { username: string };
  diffStats?: { changedFiles: number; additions: number; deletions: number };
  reviews?: any[];
}

interface CIRun {
  id: string;
  name: string;
  status: "SUCCESS" | "FAILURE" | "PENDING";
  conclusion?: string;
}

const PullRequestDetail: React.FC = () => {
  const { id: repoId, number } = useParams<{ id: string; number: string }>();
  const navigate = useNavigate();
  const [pr, setPr] = useState<PR | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commits, setCommits] = useState<any[]>([]);
  const [diff, setDiff] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "conversation" | "files" | "commits"
  >("conversation");
  const [reviewStatus, setReviewStatus] = useState<
    "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED"
  >("COMMENTED");
  const [showReviewOverlay, setShowReviewOverlay] = useState(false);
  const [reviewBody, setReviewBody] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [merging, setMerging] = useState(false);
  const [mergeMethod, setMergeMethod] = useState<"merge" | "squash" | "rebase">("merge");
  const [showMergeDropdown, setShowMergeDropdown] = useState(false);
  const [ciRuns, setCiRuns] = useState<CIRun[]>([]);
  const [localReactions, setLocalReactions] = useState<{ [key: string]: any[] }>({});

  const handleToggleReaction = (targetId: string, emoji: string) => {
    setLocalReactions(prev => {
      const current = prev[targetId] || [];
      const existing = current.find(r => r.emoji === emoji);
      if (existing) {
        return {
          ...prev,
          [targetId]: current.filter(r => r.emoji !== emoji)
        };
      } else {
        return {
          ...prev,
          [targetId]: [...current, { emoji, count: 1, users: ["you"] }]
        };
      }
    });
  };

  const fetchPRData = React.useCallback(async () => {
    if (!repoId || !number) return;
    try {
      const [pullRes, diffRes, commitsRes, commentsRes, ciRes] = await Promise.all([
        api.repositories.getPull(repoId, number),
        api.repositories.getPullDiff(repoId, number),
        api.repositories.getCommits(repoId), 
        api.repositories.getPullComments(repoId, number),
        api.repositories.getCIStatus(repoId, "HEAD")
      ]);
      setPr(pullRes);
      setDiff(diffRes.diff);
      setCommits(commitsRes);
      setComments(commentsRes);
      setCiRuns(ciRes);
    } catch (error) {
      console.error("Failed to fetch PR data", error);
    } finally {
      setLoading(false);
    }
  }, [repoId, number]);

  useEffect(() => {
    fetchPRData();
  }, [repoId, number, fetchPRData]);

  const handleMerge = async () => {
    if (!repoId || !number || !pr || merging) return;
    setMerging(true);
    try {
      await api.repositories.mergePull(repoId, number, mergeMethod);
      await fetchPRData();
      alert("Pull request merged successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to merge pull request");
    } finally {
      setMerging(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!pr || submittingReview) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(
        `/api/v1/repositories/${repoId}/pulls/${number}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: reviewStatus, body: reviewBody }),
        },
      );
      if (!res.ok) throw new Error("Review submission failed");
      setReviewBody("");
      await fetchPRData();
    } catch (err) {
      console.error(err);
      alert("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!pr) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-bold text-gh-text">
          Pull request not found
        </h3>
      </div>
    );
  }

  const handlePostComment = async () => {
    if (!pr || !commentBody.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(
        `/api/v1/repositories/${repoId}/pulls/${number}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: commentBody }),
        },
      );
      if (!res.ok) throw new Error("Comment submission failed");
      setCommentBody("");
      await fetchPRData();
    } catch (err) {
      console.error(err);
      alert("Failed to submit comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const getStatusBadge = () => {
    if (pr.status === "MERGED") {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-500">
          Merged
        </span>
      );
    }
    if (pr.status === "CLOSED") {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-500">
          Closed
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-500">
        Open
      </span>
    );
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-gh-bg">
      {/* Header */}
      <div className="border-b border-gh-border bg-gh-bg-secondary w-full">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate(`/repo/${repoId}`)}
            className="text-sm text-gh-text-secondary hover:text-primary mb-3 flex items-center gap-1"
          >
            <span className="material-symbols-outlined !text-[16px]">
              arrow_back
            </span>
            Back to repository
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gh-text mb-2">
                {pr.title}
              </h1>
              <div className="flex items-center gap-3 text-sm text-gh-text-secondary">
                {getStatusBadge()}
                <span className="font-mono">#{pr.number}</span>
                <span>
                  opened by{" "}
                  <span className="font-medium text-gh-text">
                    {pr.author.username}
                  </span>
                </span>
                <span>{new Date(pr.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gh-border bg-gh-bg-secondary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("conversation")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "conversation"
                  ? "border-primary text-primary"
                  : "border-transparent text-gh-text-secondary hover:text-gh-text"
              }`}
            >
              Conversation
            </button>
            <button
              onClick={() => setActiveTab("files")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "files"
                  ? "border-primary text-primary"
                  : "border-transparent text-gh-text-secondary hover:text-gh-text"
              }`}
            >
              Files Changed {pr.diffStats && `(${pr.diffStats.changedFiles})`}
            </button>
            <button
              onClick={() => setActiveTab("commits")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "commits"
                  ? "border-primary text-primary"
                  : "border-transparent text-gh-text-secondary hover:text-gh-text"
              }`}
            >
              Commits
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === "conversation" && (
          <div className="space-y-6">
            {/* Description */}
            {pr.body && (
              <div className="bg-gh-bg-secondary border border-gh-border rounded-xl p-6">
                <p className="text-gh-text whitespace-pre-wrap mb-4">{pr.body}</p>
                <div className="flex items-center gap-2">
                  <ReactionPicker 
                    onSelect={(emoji) => handleToggleReaction(pr.id, emoji)}
                  />
                  <ReactionList 
                    reactions={localReactions[pr.id] || []} 
                    onToggle={(emoji) => handleToggleReaction(pr.id, emoji)}
                  />
                </div>
              </div>
            )}

            {/* Timeline: Reviews and Comments Interleaved */}
            <div className="space-y-4">
              {[...(pr.reviews || []), ...comments]
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((item: any) => {
                  const isReview = Boolean(item.reviewer);
                  const author = isReview ? item.reviewer : item.author;

                  return (
                    <div
                      key={`${isReview ? "rev" : "com"}-${item.id}`}
                      className="bg-gh-bg-secondary border border-gh-border rounded-xl p-4"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-gh-text">
                          {author?.username || "unknown"}
                        </span>
                        {isReview && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.status === "APPROVED"
                                ? "bg-green-500/20 text-green-500"
                                : item.status === "CHANGES_REQUESTED"
                                  ? "bg-red-500/20 text-red-500"
                                  : "bg-gray-500/20 text-[#888888]"
                            }`}
                          >
                            {item.status.replace("_", " ")}
                          </span>
                        )}
                        {!isReview && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-[#888888]">
                            Commented
                          </span>
                        )}
                        <span className="text-xs text-gh-text-secondary">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gh-text-secondary whitespace-pre-wrap mb-3">
                        {item.body}
                      </p>
                      <div className="flex items-center gap-2">
                        <ReactionPicker 
                          onSelect={(emoji) => handleToggleReaction(item.id, emoji)}
                        />
                        <ReactionList 
                          reactions={localReactions[item.id] || []} 
                          onToggle={(emoji) => handleToggleReaction(item.id, emoji)}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* CI Status Checks */}
            {ciRuns.length > 0 && (
              <div className="bg-gh-bg-secondary border border-gh-border rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-gh-border bg-gh-bg flex justify-between items-center">
                  <h3 className="text-sm font-bold text-gh-text flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[18px]">Task</span>
                    CI Status Checks
                  </h3>
                  <span className="text-xs text-gh-text-secondary">{ciRuns.length} checks</span>
                </div>
                <div className="divide-y divide-gh-border">
                  {ciRuns.map((run: any) => (
                    <div key={run.id} className="px-4 py-3 flex items-center justify-between hover:bg-gh-bg-tertiary transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined !text-[20px] ${
                          run.status === "SUCCESS" ? "text-green-500" :
                          run.status === "FAILURE" ? "text-red-500" : "text-yellow-500 animate-pulse"
                        }`}>
                          {run.status === "SUCCESS" ? "check_circle" :
                           run.status === "FAILURE" ? "cancel" : "pending"}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gh-text">{run.name}</p>
                          <p className="text-xs text-gh-text-secondary">{run.conclusion || "Running..."}</p>
                        </div>
                      </div>
                      <button className="text-xs text-primary hover:underline">Details</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Merge Action Box */}
            {pr.status === "OPEN" && (
              <div className="bg-gh-bg-secondary border border-gh-border rounded-xl p-4">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 size-8 rounded-full flex items-center justify-center ${
                    ciRuns.length > 0 && ciRuns.every(r => r.status === "SUCCESS") ? "bg-green-500" : "bg-gh-border"
                  }`}>
                    <span className="material-symbols-outlined text-white !text-[20px]">
                      {ciRuns.length > 0 && ciRuns.every(r => r.status === "SUCCESS") ? "done_all" : "merge"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gh-text mb-1">
                      {ciRuns.length > 0 && ciRuns.every(r => r.status === "SUCCESS") ? "This branch has no conflicts" : "Ready to merge"}
                    </h3>
                    <p className="text-sm text-gh-text-secondary mb-4">
                      {ciRuns.length > 0 && ciRuns.every(r => r.status === "SUCCESS") 
                        ? "Merging can be performed automatically." 
                        : "Review required. Checks may be pending or failed."}
                    </p>
                    <div className="flex items-center">
                      <div className="flex border border-primary rounded-lg overflow-hidden">
                        <button
                          onClick={handleMerge}
                          disabled={merging}
                          className="px-4 py-2 bg-primary text-white font-medium hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center gap-2 border-r border-white/20"
                        >
                          <span className={`material-symbols-outlined !text-[18px] ${merging ? "animate-spin" : ""}`}>
                            {merging ? "sync" : "merge"}
                          </span>
                          {merging ? "Merging..." : 
                            mergeMethod === "merge" ? "Merge Pull Request" :
                            mergeMethod === "squash" ? "Squash and Merge" : "Rebase and Merge"
                          }
                        </button>
                        <button
                          onClick={() => setShowMergeDropdown(!showMergeDropdown)}
                          className="px-2 bg-primary text-white hover:bg-opacity-90 transition-all relative"
                        >
                          <span className="material-symbols-outlined !text-[18px]">arrow_drop_down</span>
                          {showMergeDropdown && (
                            <div className="absolute right-0 top-full mt-1 w-64 bg-gh-bg-secondary border border-gh-border rounded-md shadow-xl z-30 p-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); setMergeMethod("merge"); setShowMergeDropdown(false); }}
                                className={`w-full text-left px-3 py-2 text-sm rounded ${mergeMethod === "merge" ? "bg-primary text-white" : "text-gh-text hover:bg-gh-bg-tertiary"}`}
                              >
                                <div className="font-bold">Create a merge commit</div>
                                <div className="text-[10px] opacity-70">All commits from this branch will be added to the base branch via a merge commit.</div>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setMergeMethod("squash"); setShowMergeDropdown(false); }}
                                className={`w-full text-left px-3 py-2 text-sm rounded mt-1 ${mergeMethod === "squash" ? "bg-primary text-white" : "text-gh-text hover:bg-gh-bg-tertiary"}`}
                              >
                                <div className="font-bold">Squash and merge</div>
                                <div className="text-[10px] opacity-70">The {commits.length} commits from this branch will be combined into one commit in the base branch.</div>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setMergeMethod("rebase"); setShowMergeDropdown(false); }}
                                className={`w-full text-left px-3 py-2 text-sm rounded mt-1 ${mergeMethod === "rebase" ? "bg-primary text-white" : "text-gh-text hover:bg-gh-bg-tertiary"}`}
                              >
                                <div className="font-bold">Rebase and merge</div>
                                <div className="text-[10px] opacity-70">The {commits.length} commits from this branch will be rebased and added to the base branch.</div>
                              </button>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add Review */}
            {pr.status === "OPEN" && (
              <div className="bg-gh-bg-secondary border border-gh-border rounded-xl p-6">
                <h3 className="text-lg font-bold text-gh-text mb-4">
                  Add your review
                </h3>
                <label htmlFor="review-comment" className="sr-only">
                  Review comment
                </label>
                <textarea
                  id="review-comment"
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  placeholder="Leave a comment..."
                  className="w-full bg-gh-bg border border-gh-border rounded-lg p-3 text-gh-text placeholder-gh-text-secondary focus:outline-none focus:border-primary resize-none"
                  rows={4}
                  aria-label="Review comment"
                />
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <label htmlFor="review-status" className="sr-only">
                      Review status
                    </label>
                    <select
                      id="review-status"
                      value={reviewStatus}
                      onChange={(e) => setReviewStatus(e.target.value as any)}
                      className="bg-gh-bg border border-gh-border rounded-lg px-3 py-2 text-gh-text focus:outline-none focus:border-primary"
                      aria-label="Select review status"
                    >
                      <option value="COMMENTED">Comment</option>
                      <option value="APPROVED">Approve</option>
                      <option value="CHANGES_REQUESTED">Request Changes</option>
                    </select>
                  </div>
                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition-all disabled:opacity-50"
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </div>
            )}

            {/* General Comment Form */}
            {pr.status === "OPEN" && (
              <div className="bg-gh-bg-secondary border border-gh-border rounded-xl p-6">
                <h3 className="text-lg font-bold text-gh-text mb-4 flex gap-2 items-center">
                  <span className="material-symbols-outlined !text-[18px]">chat_bubble</span>
                  Add a comment
                </h3>
                <textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Leave a comment..."
                  className="w-full bg-gh-bg border border-gh-border rounded-lg p-3 text-gh-text placeholder-gh-text-secondary focus:outline-none focus:border-primary resize-none"
                  rows={4}
                />
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handlePostComment}
                    disabled={submittingComment || !commentBody.trim()}
                    className="px-6 py-2 bg-[#238636] border border-[#2ea043] text-white rounded-md font-bold hover:bg-[#2ea043] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {submittingComment ? "Commenting..." : "Comment"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "files" && (
          <div className="bg-gh-bg-secondary border border-gh-border rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                {pr.diffStats && (
                  <>
                    <span className="text-green-500 font-medium">
                      +{pr.diffStats.additions}
                    </span>
                    <span className="text-red-500 font-medium">
                      -{pr.diffStats.deletions}
                    </span>
                    <span className="text-gh-text-secondary">
                      {pr.diffStats.changedFiles} files changed
                    </span>
                  </>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowReviewOverlay(!showReviewOverlay)}
                  className="px-3 py-1 bg-gh-bg-secondary border border-gh-border text-gh-text rounded-md text-xs font-bold hover:bg-gh-bg-tertiary transition-all flex items-center gap-2"
                >
                  Review changes
                  <span className="material-symbols-outlined !text-[16px]">expand_more</span>
                </button>

                {showReviewOverlay && (
                  <div className="absolute right-0 top-full mt-2 w-[400px] bg-gh-bg-secondary border border-gh-border rounded-xl shadow-2xl z-50 p-6 animate-in fade-in zoom-in-95 duration-200">
                    <h3 className="text-sm font-bold text-gh-text mb-4">
                      Finish your review
                    </h3>
                    <textarea
                      value={reviewBody}
                      onChange={(e) => setReviewBody(e.target.value)}
                      placeholder="Leave a comment..."
                      className="w-full bg-gh-bg border border-gh-border rounded-lg p-3 text-sm text-gh-text placeholder-gh-text-secondary focus:outline-none focus:border-primary resize-none mb-4"
                      rows={4}
                    />
                    <div className="space-y-2 mb-6">
                      {[
                        { id: "COMMENTED", label: "Comment", desc: "Submit general feedback without explicit approval." },
                        { id: "APPROVED", label: "Approve", desc: "Submit feedback and approve merging these changes." },
                        { id: "CHANGES_REQUESTED", label: "Request changes", desc: "Submit feedback that must be addressed before merging." }
                      ].map((opt) => (
                        <label key={opt.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gh-bg-tertiary cursor-pointer transition-colors border border-transparent">
                          <input
                            type="radio"
                            name="review-status"
                            value={opt.id}
                            checked={reviewStatus === opt.id}
                            onChange={() => setReviewStatus(opt.id as any)}
                            className="mt-1 accent-primary"
                          />
                          <div>
                            <div className="text-xs font-bold text-gh-text">{opt.label}</div>
                            <div className="text-[10px] text-gh-text-secondary">{opt.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="flex justify-end pt-4 border-t border-gh-border">
                      <button
                        onClick={handleSubmitReview}
                        disabled={submittingReview}
                        className="px-4 py-2 bg-[#238636] border border-[#2ea043] text-white rounded-md text-xs font-bold hover:bg-[#2ea043] transition-colors disabled:opacity-50"
                      >
                        {submittingReview ? "Submitting..." : "Submit review"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {diff ? (
              <div className="border border-gh-border rounded-lg overflow-hidden">
                <SyntaxHighlighter
                  language="diff"
                  style={githubGist}
                  customStyle={{
                    margin: 0,
                    padding: "1rem",
                    fontSize: "0.875rem",
                    lineHeight: "1.5",
                    backgroundColor: "transparent",
                  }}
                  wrapLines={true}
                  lineProps={(lineNumber) => {
                    const line = diff.split('\n')[lineNumber - 1];
                    const style: React.CSSProperties = { display: "block", padding: "0 4px" };
                    if (line.startsWith('+')) {
                      style.backgroundColor = 'rgba(46, 160, 67, 0.15)';
                    } else if (line.startsWith('-')) {
                      style.backgroundColor = 'rgba(248, 81, 73, 0.15)';
                    } else if (line.startsWith('@@')) {
                      style.color = '#8b949e';
                      style.backgroundColor = 'rgba(56, 139, 253, 0.1)';
                    }
                    return { style };
                  }}
                >
                  {diff}
                </SyntaxHighlighter>
              </div>
            ) : (
              <pre className="bg-gh-bg p-4 rounded-lg overflow-x-auto text-xs font-mono text-gh-text whitespace-pre">
                No changes
              </pre>
            )}
          </div>
        )}

        {activeTab === "commits" && (
          <div className="space-y-0">
            {commits.map((commit, i) => (
              <div
                key={commit.sha}
                className={`bg-gh-bg-secondary flex gap-4 p-4 items-start ${
                  i === 0 ? "rounded-t-xl border-t border-l border-r border-gh-border" : ""
                } ${
                  i === commits.length - 1
                    ? "rounded-b-xl border border-gh-border"
                    : "border-l border-r border-b border-gh-border"
                }`}
              >
                <div className="mt-1">
                  <span className="material-symbols-outlined !text-[20px] text-gh-text-secondary opacity-50">
                    commit
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-bold text-gh-text truncate">
                      {commit.commit.message.split("\n")[0]}
                    </p>
                    <div className="flex gap-2">
                       <button className="text-xs px-2 py-1 font-mono bg-gh-bg border border-gh-border rounded text-gh-text-secondary hover:text-primary transition-colors">
                        {commit.sha.substring(0, 7)}
                       </button>
                       <button className="text-gh-text-secondary hover:text-primary transition-colors flex items-center justify-center bg-gh-bg border border-gh-border rounded px-2">
                        <span className="material-symbols-outlined !text-[14px]">code</span>
                       </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gh-text-secondary">
                    <span className="font-medium text-gh-text">
                       {commit.author?.username || commit.commit.author.name}
                    </span>
                    committed on {new Date(commit.commit.author.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            {commits.length === 0 && (
               <div className="bg-gh-bg-secondary border border-gh-border rounded-xl p-8 text-center text-gh-text-secondary">
                No commits found for this pull request.
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PullRequestDetail;



