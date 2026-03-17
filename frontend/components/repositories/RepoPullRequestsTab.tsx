import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Repository } from "../../types";
import { api } from "../../services/infra/api";

interface RepoPullRequestsTabProps {
  repo: Repository;
}

const RepoPullRequestsTab: React.FC<RepoPullRequestsTabProps> = ({ repo }) => {
  const navigate = useNavigate();
  const [prs, setPrs] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [baseBranch, setBaseBranch] = useState("main");
  const [headBranch, setHeadBranch] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Metadata State
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  const [availableLabels, setAvailableLabels] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchPrs();
    fetchMetadata();
  }, [repo.id, filter]);

  const fetchMetadata = async () => {
    try {
      const [branches, labels, users] = await Promise.all([
        api.repositories.getBranches(repo.id).catch(() => []),
        api.repositories.getLabels(repo.id).catch(() => []),
        api.repositories.getAssignees(repo.id).catch(() => [])
      ]);
      setAvailableBranches(branches || []);
      setAvailableLabels(labels || []);
      setAvailableUsers(users || []);
      if (branches && branches.length > 0) {
        setBaseBranch(branches.includes("main") ? "main" : branches[0]);
        setHeadBranch(branches.length > 1 ? (branches.includes("dev") ? "dev" : branches[1]) : branches[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPrs = async () => {
    setLoading(true);
    try {
      const data = await api.repositories.getPulls(repo.id, filter);
      setPrs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch PRs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePull = async () => {
    if (!newTitle.trim() || creating || baseBranch === headBranch) return;
    setCreating(true);
    try {
      const pr = await api.repositories.createPull(repo.id, {
        title: newTitle,
        body: newBody,
        base: baseBranch,
        head: headBranch,
        labelIds: selectedLabels,
        assigneeIds: selectedAssignees,
        reviewerIds: selectedReviewers,
      });
      setShowCreateModal(false);
      setNewTitle("");
      setNewBody("");
      setSelectedLabels([]);
      setSelectedAssignees([]);
      setSelectedReviewers([]);
      navigate(`/repo/${repo.id}/pulls/${pr.number}`);
    } catch (err) {
      console.error(err);
      alert("Failed to create pull request");
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (pr: any) => {
    if (pr.status === "MERGED") {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500">
          Merged
        </span>
      );
    }
    if (pr.status === "CLOSED") {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-500">
          Closed
        </span>
      );
    }
    if (pr.draft) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-[#888888]">
          Draft
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-500">
        Open
      </span>
    );
  };

  const getReviewStatus = (pr: any) => {
    if (!pr.reviews || pr.reviews.length === 0) return null;

    const approved = pr.reviews.filter(
      (r: any) => r.status === "APPROVED",
    ).length;
    const changesRequested = pr.reviews.filter(
      (r: any) => r.status === "CHANGES_REQUESTED",
    ).length;

    if (changesRequested > 0) {
      return (
        <span className="text-red-500 text-xs flex items-center gap-1">
          <span className="material-symbols-outlined !text-[14px]">error</span>
          Changes requested
        </span>
      );
    }
    if (approved > 0) {
      return (
        <span className="text-green-500 text-xs flex items-center gap-1">
          <span className="material-symbols-outlined !text-[14px]">
            check_circle
          </span>
          {approved} approved
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-gh-text-secondary">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium">Fetching pull requests...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilter("OPEN")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${filter === "OPEN"
                ? "bg-primary text-white"
                : "text-gh-text hover:bg-gh-bg-secondary border border-gh-border"
              }`}
          >
            <span className="material-symbols-outlined !text-[16px] inline-block mr-1">
              call_split
            </span>
            Open
          </button>
          <button
            onClick={() => setFilter("CLOSED")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${filter === "CLOSED"
                ? "bg-primary text-white"
                : "text-gh-text hover:bg-gh-bg-secondary border border-gh-border"
              }`}
          >
            <span className="material-symbols-outlined !text-[16px] inline-block mr-1">
              close
            </span>
            Closed
          </button>
          <button
            onClick={() => setFilter("MERGED")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${filter === "MERGED"
                ? "bg-primary text-white"
                : "text-gh-text hover:bg-gh-bg-secondary border border-gh-border"
              }`}
          >
            <span className="material-symbols-outlined !text-[16px] inline-block mr-1">
              merge
            </span>
            </button>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-[#238636] text-white rounded-lg font-medium hover:bg-[#2ea043] transition-all flex items-center gap-2 text-sm"
        >
          <span className="material-symbols-outlined !text-[18px]">add</span>
          New Pull Request
        </button>
      </div>

      {/* PR List */}
      {prs.length === 0 ? (
        <div className="bg-gh-bg-secondary border border-gh-border rounded-xl p-16 text-center">
          <span className="material-symbols-outlined !text-[64px] text-gh-text-secondary opacity-30">
            merge
          </span>
          <h4 className="text-lg font-bold text-gh-text mt-4">
            No pull requests
          </h4>
          <p className="text-sm text-gh-text-secondary mt-2">
            {filter === "OPEN"
              ? "There are no open pull requests"
              : `No ${filter.toLowerCase()} pull requests found`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {prs.map((pr) => (
            <div
              key={pr.id}
              onClick={() =>
                navigate(`/repo/${repo.id}/pulls/${pr.number}`)
              }
              className="bg-gh-bg-secondary border border-gh-border rounded-xl p-4 hover:border-primary transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <span
                  className={`material-symbols-outlined !text-[28px] mt-0.5 ${pr.status === "MERGED"
                      ? "text-purple-500"
                      : pr.status === "CLOSED"
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                >
                  {pr.status === "MERGED"
                    ? "merge"
                    : pr.status === "CLOSED"
                      ? "close"
                      : "call_split"}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-bold text-gh-text group-hover:text-primary truncate transition-colors">
                      {pr.title}
                    </h3>
                    {getStatusBadge(pr)}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gh-text-secondary flex-wrap">
                    <span className="font-mono">#{pr.number}</span>
                    <span>
                      opened by{" "}
                      <span className="font-medium text-gh-text">
                        {pr.author?.username || "unknown"}
                      </span>
                    </span>
                    <span>{new Date(pr.createdAt).toLocaleDateString()}</span>

                    {pr.diffStats && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-500 font-medium">
                          +{pr.diffStats.additions}
                        </span>
                        <span className="text-red-500 font-medium">
                          -{pr.diffStats.deletions}
                        </span>
                        <span className="text-gh-text-secondary">
                          {pr.diffStats.changedFiles} files
                        </span>
                      </div>
                    )}

                    {getReviewStatus(pr)}

                    {pr._count?.comments > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined !text-[14px]">
                          comment
                        </span>
                        {pr._count.comments}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Pull Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gh-bg-secondary border border-gh-border rounded-xl max-w-5xl w-full flex flex-col md:flex-row h-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Main Form Area */}
            <div className="flex-[3] flex flex-col border-r border-gh-border overflow-y-auto">
              <div className="p-4 border-b border-gh-border flex items-center justify-between sticky top-0 bg-gh-bg-secondary z-10">
                <h2 className="text-xl font-bold text-gh-text flex items-center gap-2">
                  <span className="material-symbols-outlined !text-[#238636]">
                    call_split
                  </span>
                  Open a pull request
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="md:hidden text-gh-text-secondary hover:text-gh-text"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Branch Selector Area */}
              <div className="p-4 bg-gh-bg border-b border-gh-border flex items-center gap-3">
                <span className="material-symbols-outlined text-gh-text-secondary font-light">compare_arrows</span>
                <div className="flex items-center gap-2 bg-gh-bg-secondary border border-gh-border rounded-md px-3 py-1.5 text-sm">
                  <span className="text-gh-text-secondary">base:</span>
                  <select
                    value={baseBranch}
                    onChange={(e) => setBaseBranch(e.target.value)}
                    className="bg-transparent text-gh-text font-mono font-medium outline-none cursor-pointer"
                  >
                    {availableBranches.map((b) => (
                      <option key={b} value={b} className="bg-gh-bg-secondary">{b}</option>
                    ))}
                  </select>
                </div>
                <span className="material-symbols-outlined text-gh-text-secondary !text-[16px]">arrow_back</span>
                <div className="flex items-center gap-2 bg-gh-bg-secondary border border-gh-border rounded-md px-3 py-1.5 text-sm">
                  <span className="text-gh-text-secondary">compare:</span>
                  <select
                    value={headBranch}
                    onChange={(e) => setHeadBranch(e.target.value)}
                    className="bg-transparent text-gh-text font-mono font-medium outline-none cursor-pointer"
                  >
                    {availableBranches.map((b) => (
                      <option key={b} value={b} className="bg-gh-bg-secondary">{b}</option>
                    ))}
                  </select>
                </div>
                {baseBranch === headBranch && (
                  <span className="text-xs text-red-500 ml-2">Base and head must be different</span>
                )}
              </div>

              <div className="p-6 space-y-4 flex-1">
                <div>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Title"
                    className="w-full bg-gh-bg border border-gh-border rounded-md px-3 py-2 text-gh-text font-medium text-lg focus:border-primary outline-none focus:ring-1 focus:ring-primary transition-all"
                    autoFocus
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-gh-text">
                      Add a description
                    </label>
                    <div className="flex space-x-2">
                      <button className="text-xs px-2 py-1 bg-gh-bg border border-gh-border rounded-md text-gh-text font-medium z-10">
                        Write
                      </button>
                      <button className="text-xs px-2 py-1 text-gh-text-secondary hover:text-gh-text font-medium z-10">
                        Preview
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                    placeholder="Leave a comment"
                    rows={12}
                    className="w-full bg-gh-bg border border-gh-border rounded-md px-3 py-2 text-gh-text focus:border-primary outline-none focus:ring-1 focus:ring-primary resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-gh-text-secondary mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined !text-[14px]">
                      markdown
                    </span>
                    Markdown is supported
                  </p>
                </div>
              </div>
              <div className="p-4 border-t border-gh-border bg-gh-bg flex justify-end gap-3 sticky bottom-0">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gh-text-secondary hover:text-gh-text text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePull}
                  disabled={!newTitle.trim() || creating || baseBranch === headBranch}
                  className="px-6 py-2 bg-[#238636] border border-[#2ea043] text-white rounded-md font-bold hover:bg-[#2ea043] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {creating ? "Creating..." : "Create pull request"}
                </button>
              </div>
            </div>

            {/* Sidebar (Desktop only) */}
            <div className="flex-1 min-w-[250px] hidden md:block overflow-y-auto bg-gh-bg p-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 text-gh-text-secondary hover:text-gh-text"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              
              <div className="space-y-6">
                {/* Reviewers */}
                <div>
                  <h3 className="text-sm font-bold text-gh-text mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[16px]">
                      visibility
                    </span>
                    Reviewers
                  </h3>
                  <div className="space-y-1">
                    {availableUsers.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center gap-2 text-sm text-gh-text cursor-pointer hover:bg-gh-bg-secondary p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedReviewers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedReviewers([...selectedReviewers, user.id]);
                            } else {
                              setSelectedReviewers(
                                selectedReviewers.filter((id) => id !== user.id),
                              );
                            }
                          }}
                          className="rounded border-gh-border bg-gh-bg text-primary focus:ring-primary focus:ring-offset-gh-bg"
                        />
                        {user.username}
                      </label>
                    ))}
                    {availableUsers.length === 0 && (
                      <span className="text-xs italic text-gh-text-secondary">No reviewers available</span>
                    )}
                  </div>
                </div>

                <hr className="border-gh-border" />

                {/* Assignees */}
                <div>
                  <h3 className="text-sm font-bold text-gh-text mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[16px]">
                      person_add
                    </span>
                    Assignees
                  </h3>
                  <div className="space-y-1">
                    {availableUsers.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center gap-2 text-sm text-gh-text cursor-pointer hover:bg-gh-bg-secondary p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAssignees.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAssignees([...selectedAssignees, user.id]);
                            } else {
                              setSelectedAssignees(
                                selectedAssignees.filter((id) => id !== user.id),
                              );
                            }
                          }}
                          className="rounded border-gh-border bg-gh-bg text-primary focus:ring-primary focus:ring-offset-gh-bg"
                        />
                        {user.username}
                      </label>
                    ))}
                  </div>
                </div>

                <hr className="border-gh-border" />

                {/* Labels */}
                <div>
                  <h3 className="text-sm font-bold text-gh-text mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[16px]">
                      label
                    </span>
                    Labels
                  </h3>
                  <div className="space-y-1 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                    {availableLabels.map((label) => (
                      <label
                        key={label.id}
                        className="flex items-center gap-2 text-sm text-gh-text cursor-pointer hover:bg-gh-bg-secondary p-1.5 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLabels.includes(label.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLabels([...selectedLabels, label.id]);
                            } else {
                              setSelectedLabels(
                                selectedLabels.filter((id) => id !== label.id),
                              );
                            }
                          }}
                          className="rounded border-gh-border bg-gh-bg text-primary focus:ring-primary focus:ring-offset-gh-bg"
                        />
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        {label.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepoPullRequestsTab;



