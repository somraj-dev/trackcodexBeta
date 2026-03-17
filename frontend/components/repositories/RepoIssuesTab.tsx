import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Repository } from "../../types";
import { api } from "../../services/infra/api";

interface IssueLabel {
  id: string;
  name: string;
  color: string;
}

interface IssueAssignee {
  id: string;
  username: string;
  avatar?: string;
}

interface Milestone {
  id: string;
  title: string;
  dueOn?: string;
}

interface Issue {
  id: string;
  number: number;
  title: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  author?: {
    username: string;
    avatar?: string;
  };
  labels?: IssueLabel[];
  assignees?: IssueAssignee[];
  milestone?: Milestone;
  _count?: {
    comments: number;
  };
}

interface RepoIssuesTabProps {
  repo: Repository;
}

const RepoIssuesTab: React.FC<RepoIssuesTabProps> = ({ repo }) => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"OPEN" | "CLOSED">("OPEN");
  const [activeTab, setActiveTab] = useState<"issues" | "labels" | "milestones">("issues");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<string | undefined>();
  const [creating, setCreating] = useState(false);

  // Metadata State for form options
  const [availableLabels, setAvailableLabels] = useState<IssueLabel[]>([]);
  const [availableAssignees, setAvailableAssignees] = useState<IssueAssignee[]>([]);
  const [availableMilestones, setAvailableMilestones] = useState<Milestone[]>([]);

  const fetchIssues = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.repositories.getIssues(repo.id, filter);
      setIssues(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch issues", err);
    } finally {
      setLoading(false);
    }
  }, [repo.id, filter]);

  const fetchMetadata = React.useCallback(async () => {
    try {
      const [labels, assignees, milestones] = await Promise.all([
        api.repositories.getLabels(repo.id),
        api.repositories.getAssignees(repo.id),
        api.repositories.getMilestones(repo.id)
      ]);
      setAvailableLabels(labels || []);
      setAvailableAssignees(assignees || []);
      setAvailableMilestones(milestones || []);
    } catch (err) {
      console.error("Failed to fetch metadata", err);
    }
  }, [repo.id]);

  useEffect(() => {
    fetchIssues();
    fetchMetadata();
  }, [fetchIssues, fetchMetadata]);

  const handleCreateIssue = async () => {
    if (!newTitle.trim() || creating) return;
    setCreating(true);
    try {
      const issue = await api.repositories.createIssue(repo.id, {
        title: newTitle,
        body: newBody,
        labelIds: selectedLabels,
        assigneeIds: selectedAssignees,
        milestoneId: selectedMilestone,
      });
      setShowCreateModal(false);
      setNewTitle("");
      setNewBody("");
      setSelectedLabels([]);
      setSelectedAssignees([]);
      setSelectedMilestone(undefined);
      navigate(`/repo/${repo.id}/issues/${issue.number}`);
    } catch (err) {
      console.error(err);
      alert("Failed to create issue");
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (issue: Issue) => {
    if (issue.status === "CLOSED") {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 flex items-center gap-1">
          <span className="material-symbols-outlined !text-[14px]">
            check_circle
          </span>
          Closed
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-500 flex items-center gap-1">
        <span className="material-symbols-outlined !text-[14px]">
          radio_button_unchecked
        </span>
        Open
      </span>
    );
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-gh-text-secondary">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium">Loading issues...</p>
      </div>
    );
  }
  return (
    <div className="p-6">
      {/* Issues Sub-Navigation */}
      <div className="flex items-center gap-4 mb-6 border-b border-gh-border pb-4">
        <button
          onClick={() => setActiveTab("issues")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === "issues"
              ? "bg-primary text-white"
              : "text-gh-text-secondary hover:text-gh-text hover:bg-gh-bg-secondary"
          }`}
        >
          Issues
        </button>
        <button
          onClick={() => setActiveTab("labels")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === "labels"
              ? "bg-primary text-white"
              : "text-gh-text-secondary hover:text-gh-text hover:bg-gh-bg-secondary"
          }`}
        >
          Labels
        </button>
        <button
          onClick={() => setActiveTab("milestones")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === "milestones"
              ? "bg-primary text-white"
              : "text-gh-text-secondary hover:text-gh-text hover:bg-gh-bg-secondary"
          }`}
        >
          Milestones
        </button>
      </div>

      {activeTab === "issues" && (
        <>
          {/* Header with Filters */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFilter("OPEN")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${filter === "OPEN"
                  ? "bg-primary text-white"
                  : "text-gh-text hover:bg-gh-bg-secondary border border-gh-border"
                  }`}
              >
                <span className="material-symbols-outlined !text-[16px]">
                  radio_button_unchecked
                </span>
                Open
              </button>
              <button
                onClick={() => setFilter("CLOSED")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${filter === "CLOSED"
                  ? "bg-primary text-white"
                  : "text-gh-text hover:bg-gh-bg-secondary border border-gh-border"
                  }`}
              >
                <span className="material-symbols-outlined !text-[16px]">
                  check_circle
                </span>
                Closed
              </button>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#238636] text-white rounded-lg font-medium hover:bg-[#2ea043] transition-all flex items-center gap-2 text-sm"
            >
              New Issue
            </button>
          </div>

      {/* Issue List */}
      {issues.length === 0 ? (
        <div className="bg-gh-bg-secondary border border-gh-border rounded-xl p-16 text-center">
          <span className="material-symbols-outlined !text-[64px] text-gh-text-secondary opacity-30">
            adjust
          </span>
          <h4 className="text-lg font-bold text-gh-text mt-4">No issues</h4>
          <p className="text-sm text-gh-text-secondary mt-2">
            {filter === "OPEN"
              ? "There are no open issues"
              : "No closed issues found"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <div
              key={issue.id}
              onClick={() =>
                navigate(`/repo/${repo.id}/issues/${issue.number}`)
              }
              className="bg-gh-bg-secondary border border-gh-border rounded-xl p-4 hover:border-primary transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <span
                  className={`material-symbols-outlined !text-[28px] mt-0.5 ${issue.status === "CLOSED"
                    ? "text-purple-500"
                    : "text-green-500"
                    }`}
                >
                  {issue.status === "CLOSED"
                    ? "check_circle"
                    : "radio_button_unchecked"}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-bold text-gh-text group-hover:text-primary truncate transition-colors">
                      {issue.title}
                    </h3>
                    {getStatusBadge(issue)}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gh-text-secondary flex-wrap">
                    <span className="font-mono">#{issue.number}</span>
                    <span>
                      opened by{" "}
                      <span className="font-medium text-gh-text">
                        {issue.author?.username || "unknown"}
                      </span>
                    </span>
                    <span>
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </span>

                    {issue.labels && issue.labels.length > 0 && (
                      <div className="flex items-center gap-1">
                        {issue.labels.slice(0, 3).map((label: IssueLabel) => (
                          <span
                            key={label.id}
                            className="px-2 py-0.5 rounded-full text-xs font-medium dynamic-bg"
                            style={
                              {
                                "--dynamic-bg": `${label.color}20`,
                                color: label.color,
                              } as React.CSSProperties
                            }
                          >
                            {label.name}
                          </span>
                        ))}
                        {issue.labels.length > 3 && (
                          <span className="text-gh-text-secondary">
                            +{issue.labels.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {issue.assignees && issue.assignees.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined !text-[14px]">
                          person
                        </span>
                        <span>{issue.assignees.length} assigned</span>
                      </div>
                    )}

                    {issue.milestone && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined !text-[14px]">
                          flag
                        </span>
                        {issue.milestone.title}
                      </span>
                    )}

                    {issue._count && issue._count.comments > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined !text-[14px]">
                          comment
                        </span>
                        {issue._count.comments}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      )}

      {activeTab === "labels" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gh-text">Labels</h3>
            <button className="px-4 py-2 bg-[#238636] text-white rounded-md text-sm font-medium hover:bg-[#2ea043] transition-colors">
              New label
            </button>
          </div>
          <div className="border border-gh-border rounded-md bg-gh-bg-secondary overflow-hidden">
            <div className="px-4 py-3 border-b border-gh-border bg-gh-bg font-bold text-sm text-gh-text">
              {availableLabels.length} labels
            </div>
            {availableLabels.length === 0 ? (
              <div className="p-8 text-center text-gh-text-secondary">
                No labels found
              </div>
            ) : (
              <div className="divide-y divide-gh-border">
                {availableLabels.map((label) => (
                  <div key={label.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4 justify-between hover:bg-gh-bg transition-colors">
                    <div className="w-1/4">
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium border dynamic-bg"
                        style={{
                          "--dynamic-bg": `${label.color}20`,
                          color: label.color,
                          borderColor: `${label.color}40`,
                        } as React.CSSProperties}
                      >
                        {label.name}
                      </span>
                    </div>
                    <div className="flex-1 text-sm text-gh-text-secondary">
                      Placeholder for label description...
                    </div>
                    <div className="flex gap-4 text-sm">
                      <button className="text-gh-text-secondary hover:text-primary transition-colors">Edit</button>
                      <button className="text-gh-text-secondary hover:text-red-500 transition-colors">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "milestones" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gh-text">Milestones</h3>
            <button className="px-4 py-2 bg-[#238636] text-white rounded-md text-sm font-medium hover:bg-[#2ea043] transition-colors">
              New milestone
            </button>
          </div>
          <div className="border border-gh-border rounded-md bg-gh-bg-secondary overflow-hidden">
            <div className="px-4 py-3 border-b border-gh-border bg-gh-bg flex gap-6 text-sm">
              <span className="font-bold text-gh-text">{availableMilestones.length} Open</span>
              <span className="text-gh-text-secondary hover:text-gh-text cursor-pointer transition-colors">0 Closed</span>
            </div>
            {availableMilestones.length === 0 ? (
              <div className="p-16 text-center text-gh-text-secondary space-y-4">
                <span className="material-symbols-outlined !text-[48px] opacity-50">flag</span>
                <h4 className="text-xl font-bold text-gh-text">You haven't created any milestones.</h4>
                <p>Use milestones to track progress on groups of issues or pull requests.</p>
              </div>
            ) : (
              <div className="divide-y divide-gh-border">
                {availableMilestones.map((milestone) => (
                  <div key={milestone.id} className="p-4 flex flex-col md:flex-row gap-4 hover:bg-gh-bg transition-colors">
                    <div className="flex-1 space-y-2">
                      <h4 className="text-xl font-bold text-gh-text hover:text-primary cursor-pointer transition-colors">
                        {milestone.title}
                      </h4>
                      <div className="flex gap-4 text-sm text-gh-text-secondary">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined !text-[16px]">calendar_today</span>
                          No due date
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined !text-[16px]">update</span>
                          Last updated recently
                        </span>
                      </div>
                    </div>
                    <div className="w-full md:w-1/3 flex flex-col justify-end">
                      <div className="w-full bg-gh-border h-2.5 rounded-full overflow-hidden mb-2">
                        <div className="bg-[#238636] h-full rounded-full dynamic-width" style={{ "--dynamic-width": '0%' } as React.CSSProperties}></div>
                      </div>
                      <div className="flex justify-between text-xs text-gh-text-secondary font-medium">
                        <span>0% complete</span>
                        <span>0 open</span>
                        <span>0 closed</span>
                      </div>
                      <div className="flex justify-end gap-3 mt-4 text-sm">
                        <button className="text-primary hover:underline">Edit</button>
                        <button className="text-primary hover:underline">Close</button>
                        <button className="text-red-500 hover:underline">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Issue Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gh-bg-secondary border border-gh-border rounded-xl max-w-4xl w-full flex flex-col md:flex-row h-full max-h-[85vh] overflow-hidden shadow-2xl">
            {/* Main Form Area */}
            <div className="flex-[3] flex flex-col border-r border-gh-border overflow-y-auto">
              <div className="p-4 border-b border-gh-border flex items-center justify-between sticky top-0 bg-gh-bg-secondary z-10">
                <h2 className="text-xl font-bold text-gh-text flex items-center gap-2">
                  <span className="material-symbols-outlined !text-[#238636]">
                    adjust
                  </span>
                  Create New Issue
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="md:hidden text-gh-text-secondary hover:text-gh-text"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6 space-y-4 flex-1">
                <div>
                  <label className="block text-sm font-bold text-gh-text mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Title"
                    className="w-full bg-gh-bg border border-gh-border rounded-md px-3 py-2 text-gh-text focus:border-primary outline-none focus:ring-1 focus:ring-primary transition-all"
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
                  onClick={handleCreateIssue}
                  disabled={!newTitle.trim() || creating}
                  className="px-6 py-2 bg-[#238636] border border-[#2ea043] text-white rounded-md font-bold hover:bg-[#2ea043] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {creating ? "Submitting..." : "Submit new issue"}
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
                {/* Assignees */}
                <div>
                  <h3 className="text-sm font-bold text-gh-text mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[16px]">
                      person_add
                    </span>
                    Assignees
                  </h3>
                  <div className="text-xs text-gh-text-secondary mb-2">
                    {selectedAssignees.length === 0
                      ? "No one assigned"
                      : `${selectedAssignees.length} assigned`}
                  </div>
                  <div className="space-y-1">
                    {availableAssignees.map((user) => (
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
                    {availableAssignees.length === 0 && (
                      <span className="text-xs italic text-gh-text-secondary">No assignees available in workspace</span>
                    )}
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
                  <div className="text-xs text-gh-text-secondary mb-2">
                    {selectedLabels.length === 0 ? "None yet" : ""}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {availableLabels
                      .filter((l) => selectedLabels.includes(l.id))
                      .map((label) => (
                        <span
                          key={label.id}
                          className="px-2 py-0.5 rounded-full text-xs font-medium dynamic-bg"
                          style={{
                            "--dynamic-bg": `${label.color}20`,
                            color: label.color,
                            border: `1px solid ${label.color}40`,
                          } as React.CSSProperties}
                        >
                          {label.name}
                        </span>
                      ))}
                  </div>
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
                          className="w-3 h-3 rounded-full dynamic-bg"
                          style={{ "--dynamic-bg": label.color } as React.CSSProperties}
                        />
                        {label.name}
                      </label>
                    ))}
                    {availableLabels.length === 0 && (
                      <span className="text-xs italic text-gh-text-secondary">No labels defined in repository</span>
                    )}
                  </div>
                </div>

                <hr className="border-gh-border" />

                {/* Milestone */}
                <div>
                  <h3 className="text-sm font-bold text-gh-text mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[16px]">
                      flag
                    </span>
                    Milestone
                  </h3>
                  <select
                    id="issue-milestone-select"
                    title="Select milestone"
                    value={selectedMilestone || ""}
                    onChange={(e) => setSelectedMilestone(e.target.value || undefined)}
                    className="w-full bg-gh-bg border border-gh-border rounded-md px-2 py-1.5 text-xs text-gh-text focus:border-primary outline-none"
                  >
                    <option value="">No milestone</option>
                    {availableMilestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepoIssuesTab;



