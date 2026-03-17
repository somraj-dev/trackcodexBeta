import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/infra/api";
import { ReactionPicker, ReactionList } from "../../components/common/ReactionSystem";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface User {
  id: string;
  username: string;
}

interface Milestone {
  id: string;
  title: string;
  closedIssues: number;
  openIssues: number;
  dueDate?: string;
}

interface Issue {
  id: string;
  number: number;
  title: string;
  issueTitle?: string;
  body: string;
  status: "OPEN" | "CLOSED";
  stateReason?: string;
  createdAt: string;
  closedAt?: string;
  author: {
    username: string;
  };
  comments: any[];
  labels: Label[];
  assignees: { userId: string; user: User }[];
  milestoneId?: string;
  milestone?: Milestone;
}

const IssueDetail: React.FC = () => {
  const { id: repoId, number } = useParams<{ id: string; number: string }>();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [updatingTitle, setUpdatingTitle] = useState(false);

  const [repoLabels, setRepoLabels] = useState<Label[]>([]);
  const [repoAssignees, setRepoAssignees] = useState<User[]>([]);
  const [repoMilestones, setRepoMilestones] = useState<Milestone[]>([]);
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showMilestoneDropdown, setShowMilestoneDropdown] = useState(false);

  useEffect(() => {
    fetchIssue();
    fetchRepoMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoId, number]);

  const fetchRepoMeta = async () => {
    if (!repoId) return;
    try {
      const [labels, assignees, milestones] = await Promise.all([
        api.repositories.getLabels(repoId),
        api.repositories.getAssignees(repoId),
        api.repositories.getMilestones(repoId),
      ]);
      setRepoLabels(labels);
      setRepoAssignees(assignees);
      setRepoMilestones(milestones);
    } catch (err) {
      console.error("Failed to fetch repo meta", err);
    }
  };

  const fetchIssue = async () => {
    if (!repoId || !number) return;
    setLoading(true);
    try {
      const data = await api.repositories.getIssue(repoId, number);
      setIssue(data);
      setEditedTitle(data.title);
    } catch (err) {
      console.error("Failed to fetch issue", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (stateReason: "completed" | "not_planned") => {
    if (!repoId || !number || !issue || closing) return;
    setClosing(true);
    try {
      await api.repositories.toggleIssueState(repoId, number, "close", stateReason);
      await fetchIssue();
    } catch (err) {
      console.error(err);
      alert("Failed to close issue");
    } finally {
      setClosing(false);
    }
  };

  const handleReopen = async () => {
    if (!repoId || !number || !issue || reopening) return;
    setReopening(true);
    try {
      await api.repositories.toggleIssueState(repoId, number, "reopen");
      await fetchIssue();
    } catch (err) {
      console.error(err);
      alert("Failed to reopen issue");
    } finally {
      setReopening(false);
    }
  };

  const handlePostComment = async () => {
    if (!repoId || !number || !newComment.trim() || postingComment) return;
    setPostingComment(true);
    try {
      await api.repositories.addIssueComment(repoId, number, { body: newComment });
      setNewComment("");
      await fetchIssue();
    } catch (err) {
      console.error(err);
      alert("Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  const handleUpdateTitle = async () => {
    if (!repoId || !number || !editedTitle.trim() || updatingTitle) return;
    setUpdatingTitle(true);
    try {
      await api.repositories.updateIssue(repoId, number, { title: editedTitle });
      setIsEditingTitle(false);
      await fetchIssue();
    } catch (err) {
      console.error(err);
      alert("Failed to update title");
    } finally {
      setUpdatingTitle(false);
    }
  };

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

  const handleAddAssignee = async (userId: string) => {
    if (!repoId || !number) return;
    try {
      await api.repositories.addIssueAssignee(repoId, number, userId);
      await fetchIssue();
    } catch (err) {
      console.error(err);
      alert("Failed to add assignee");
    }
  };

  const handleRemoveAssignee = async (userId: string) => {
    if (!repoId || !number) return;
    try {
      await api.repositories.removeIssueAssignee(repoId, number, userId);
      await fetchIssue();
    } catch (err) {
      console.error(err);
      alert("Failed to remove assignee");
    }
  };

  const handleToggleLabel = async (labelId: string) => {
    if (!repoId || !number || !issue) return;
    const hasLabel = issue.labels?.some((l: any) => l.id === labelId);
    try {
       if (hasLabel) {
         await api.repositories.updateIssue(repoId, number, { removeLabelId: labelId });
       } else {
         await api.repositories.updateIssue(repoId, number, { addLabelId: labelId });
       }
       await fetchIssue();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetMilestone = async (milestoneId: string | null) => {
    if (!repoId || !number) return;
    try {
      await api.repositories.updateIssue(repoId, number, { milestoneId });
      await fetchIssue();
      setShowMilestoneDropdown(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-bold text-gh-text">Issue not found</h3>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (issue.status === "CLOSED") {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-500 flex items-center gap-1">
          <span className="material-symbols-outlined !text-[16px]">
            check_circle
          </span>
          Closed
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-500 flex items-center gap-1">
        <span className="material-symbols-outlined !text-[16px]">
          radio_button_unchecked
        </span>
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
              {isEditingTitle ? (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="flex-1 bg-gh-bg border border-primary rounded-md px-3 py-1.5 text-lg font-bold text-gh-text focus:ring-1 focus:ring-primary outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleUpdateTitle}
                    disabled={updatingTitle || !editedTitle.trim()}
                    className="px-3 py-1.5 bg-primary text-white rounded-md text-sm font-bold hover:bg-opacity-90 transition-all disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingTitle(false);
                      setEditedTitle(issue.title);
                    }}
                    className="text-sm text-primary hover:underline px-2"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 group">
                  <h1 className="text-2xl font-bold text-gh-text mb-2">
                    {issue.issueTitle || issue.title}
                  </h1>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="text-gh-text-secondary hover:text-primary mb-2 opacity-0 group-hover:opacity-100 transition-all"
                    title="Edit title"
                  >
                    <span className="material-symbols-outlined !text-[18px]">edit</span>
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-gh-text-secondary">
                {getStatusBadge()}
                <span className="font-mono">#{issue.number}</span>
                <span>
                  opened by{" "}
                  <span className="font-medium text-gh-text">
                    {issue.author.username}
                  </span>
                </span>
                <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                {issue.closedAt && (
                  <span>
                    closed {new Date(issue.closedAt).toLocaleDateString()}
                    {issue.stateReason &&
                      ` as ${issue.stateReason.replace("_", " ")}`}
                  </span>
                )}
              </div>
            </div>

            {issue.status === "OPEN" ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleClose("completed")}
                  disabled={closing}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <span
                    className={`material-symbols-outlined !text-[18px] ${closing ? "animate-spin" : ""}`}
                  >
                    {closing ? "sync" : "check_circle"}
                  </span>
                  {closing ? "Closing..." : "Close as completed"}
                </button>
                <button
                  onClick={() => handleClose("not_planned")}
                  disabled={closing}
                  className="px-4 py-2 bg-gh-bg-tertiary text-gh-text rounded-lg font-medium hover:bg-gh-border transition-all disabled:opacity-50"
                >
                  Close as not planned
                </button>
              </div>
            ) : (
              <button
                onClick={handleReopen}
                disabled={reopening}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <span
                  className={`material-symbols-outlined !text-[18px] ${reopening ? "animate-spin" : ""}`}
                >
                  {reopening ? "sync" : "refresh"}
                </span>
                {reopening ? "Reopening..." : "Reopen Issue"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-[1fr_300px] gap-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Description */}
            {issue.body && (
              <div className="bg-gh-bg-secondary border border-gh-border rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-gh-text whitespace-pre-wrap">{issue.body}</p>
                </div>
                <div className="flex items-center gap-2">
                  <ReactionPicker 
                    onSelect={(emoji) => handleToggleReaction(issue.id, emoji)}
                  />
                  <ReactionList 
                    reactions={localReactions[issue.id] || []} 
                    onToggle={(emoji) => handleToggleReaction(issue.id, emoji)}
                  />
                </div>
              </div>
            )}

            {/* Comments */}
            {issue.comments && issue.comments.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gh-text">Comments</h3>
                {issue.comments.map((comment: any) => (
                  <div
                    key={comment.id}
                    className="bg-gh-bg-secondary border border-gh-border rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-gh-text">
                        {comment.author.username}
                      </span>
                      <span className="text-xs text-gh-text-secondary">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gh-text mb-3">{comment.body}</p>
                    <div className="flex items-center gap-2">
                      <ReactionPicker 
                        onSelect={(emoji) => handleToggleReaction(comment.id, emoji)}
                      />
                      <ReactionList 
                        reactions={localReactions[comment.id] || []} 
                        onToggle={(emoji) => handleToggleReaction(comment.id, emoji)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Post Comment Form */}
            {issue.status === "OPEN" && (
              <div className="bg-gh-bg-secondary border border-gh-border rounded-xl flex overflow-hidden">
                <div className="hidden sm:block p-4 border-r border-gh-border bg-gh-bg">
                  <div className="size-10 rounded-full bg-gh-bg-tertiary flex items-center justify-center overflow-hidden">
                    <span className="material-symbols-outlined text-gh-text-secondary">
                      person
                    </span>
                  </div>
                </div>
                <div className="flex-1 p-4 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <button className="text-sm font-medium border-b-2 border-primary text-gh-text pb-1">
                      Write
                    </button>
                    <button className="text-sm font-medium border-b-2 border-transparent text-gh-text-secondary hover:text-gh-text pb-1 transition-colors">
                      Preview
                    </button>
                  </div>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Leave a comment"
                    className="w-full bg-gh-bg border border-gh-border rounded-md p-3 text-gh-text focus:border-primary outline-none focus:ring-1 focus:ring-primary min-h-[120px] resize-y font-mono text-sm mb-3"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gh-text-secondary flex items-center gap-1">
                      <span className="material-symbols-outlined !text-[14px]">
                        markdown
                      </span>
                      Markdown is supported
                    </p>
                    <button
                      onClick={handlePostComment}
                      disabled={!newComment.trim() || postingComment}
                      className="px-4 py-1.5 bg-[#238636] border border-[#2ea043] text-white rounded-md font-bold hover:bg-[#2ea043] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {postingComment ? "Commenting..." : "Comment"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Assignees */}
            <div className="bg-gh-bg-secondary border border-gh-border rounded-xl p-4 relative">
              <div className="flex items-center justify-between mb-3">
                 <h4 className="text-sm font-bold text-gh-text">Assignees</h4>
                 <button 
                  onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  className="text-gh-text-secondary hover:text-primary"
                 >
                   <span className="material-symbols-outlined !text-[18px]">settings</span>
                 </button>
              </div>
              
              {showAssigneeDropdown && (
                <div className="absolute right-0 top-10 w-64 bg-gh-bg-secondary border border-gh-border rounded-md shadow-xl z-20 p-2 animate-in fade-in slide-in-from-top-2">
                  <div className="text-xs font-bold text-gh-text-secondary px-2 py-1 border-b border-gh-border mb-1">
                    Assign up to 10 people to this issue
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {repoAssignees.map((u: User) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          const isAssigned = issue?.assignees?.some((a) => a.userId === u.id);
                          if (isAssigned) {
                            handleRemoveAssignee(u.id);
                          } else {
                            handleAddAssignee(u.id);
                          }
                        }}
                        className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gh-bg-tertiary rounded text-sm text-gh-text"
                      >
                        <span>{u.username}</span>
                        {issue?.assignees?.some((a) => a.userId === u.id) && (
                          <span className="material-symbols-outlined !text-[16px] text-primary">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {issue.assignees && issue.assignees.length > 0 ? (
                <div className="space-y-2">
                  {issue.assignees.map((assignee: any) => (
                    <div
                      key={assignee.id}
                      className="flex items-center gap-2"
                    >
                      <div className="size-5 rounded-full bg-gh-bg-tertiary flex items-center justify-center overflow-hidden">
                        <span className="material-symbols-outlined !text-[14px] text-gh-text-secondary">person</span>
                      </div>
                      <span className="text-sm text-gh-text font-medium">
                        {assignee.user.username}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gh-text-secondary">
                  No one assigned
                </p>
              )}
            </div>

            {/* Labels */}
            <div className="bg-gh-bg-secondary border border-gh-border rounded-xl p-4 relative">
              <div className="flex items-center justify-between mb-3">
                 <h4 className="text-sm font-bold text-gh-text">Labels</h4>
                 <button 
                  onClick={() => setShowLabelDropdown(!showLabelDropdown)}
                  className="text-gh-text-secondary hover:text-primary"
                 >
                   <span className="material-symbols-outlined !text-[18px]">settings</span>
                 </button>
              </div>

              {showLabelDropdown && (
                <div className="absolute right-0 top-10 w-64 bg-gh-bg-secondary border border-gh-border rounded-md shadow-xl z-20 p-2 animate-in fade-in slide-in-from-top-2">
                  <div className="text-xs font-bold text-gh-text-secondary px-2 py-1 border-b border-gh-border mb-1">
                    Apply labels to this issue
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {repoLabels.map((l: Label) => (
                      <button
                        key={l.id}
                        onClick={() => handleToggleLabel(l.id)}
                        className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gh-bg-tertiary rounded text-sm text-gh-text text-left"
                      >
                        <div className="flex items-center gap-2">
                          <div className="size-2 rounded-full" style={{ backgroundColor: l.color }} />
                          <span>{l.name}</span>
                        </div>
                        {issue?.labels?.some((il) => il.id === l.id) && (
                          <span className="material-symbols-outlined !text-[16px] text-primary">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {issue.labels && issue.labels.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {issue.labels.map((label: any) => (
                    <span
                      key={label.id}
                      className="px-2 py-1 rounded-full text-xs font-medium border"
                      style={{
                        backgroundColor: `${label.color}15`,
                        color: label.color,
                        borderColor: `${label.color}40`,
                      }}
                    >
                      {label.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gh-text-secondary">No labels</p>
              )}
            </div>

            {/* Milestone */}
            <div className="bg-gh-bg-secondary border border-gh-border rounded-xl p-4 relative">
              <div className="flex items-center justify-between mb-3">
                 <h4 className="text-sm font-bold text-gh-text">Milestone</h4>
                 <button 
                  onClick={() => setShowMilestoneDropdown(!showMilestoneDropdown)}
                  className="text-gh-text-secondary hover:text-primary"
                 >
                   <span className="material-symbols-outlined !text-[18px]">settings</span>
                 </button>
              </div>

              {showMilestoneDropdown && (
                <div className="absolute right-0 top-10 w-64 bg-gh-bg-secondary border border-gh-border rounded-md shadow-xl z-20 p-2 animate-in fade-in slide-in-from-top-2">
                  <div className="text-xs font-bold text-gh-text-secondary px-2 py-1 border-b border-gh-border mb-1">
                    Set milestone
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <button
                        onClick={() => handleSetMilestone(null)}
                        className="w-full text-left px-2 py-1.5 hover:bg-gh-bg-tertiary rounded text-sm text-gh-text border-b border-gh-border opacity-70"
                    >
                      Clear milestone
                    </button>
                    {repoMilestones.map((m: any) => (
                      <button
                        key={m.id}
                        onClick={() => handleSetMilestone(m.id)}
                        className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gh-bg-tertiary rounded text-sm text-gh-text text-left"
                      >
                        <span>{m.title}</span>
                        {issue.milestoneId === m.id && (
                          <span className="material-symbols-outlined !text-[16px] text-primary">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {issue.milestone ? (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[18px] text-gh-text-secondary">
                      flag
                    </span>
                    <span className="text-sm text-gh-text font-bold">
                      {issue.milestone.title}
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gh-bg-tertiary h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-green-500 h-full" 
                      style={{ width: `${(issue.milestone.closedIssues / (issue.milestone.openIssues + issue.milestone.closedIssues)) * 100 || 0}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gh-text-secondary">No milestone</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;



