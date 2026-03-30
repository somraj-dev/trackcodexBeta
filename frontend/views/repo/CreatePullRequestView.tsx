import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

const CreatePullRequestView = () => {
  const { owner, repo: repoName } = useParams<{ owner: string; repo: string }>();
  const navigate = useNavigate();
  
  const [repo, setRepo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [baseBranch, setBaseBranch] = useState("main");
  const [headBranch, setHeadBranch] = useState("");

  // Metadata State
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  const [availableLabels, setAvailableLabels] = useState<IssueLabel[]>([]);
  const [availableAssignees, setAvailableAssignees] = useState<IssueAssignee[]>([]);
  const [availableMilestones, setAvailableMilestones] = useState<Milestone[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!owner || !repoName) return;
    setLoading(true);
    try {
      const data = await api.repositories.getByName(owner, repoName);
      setRepo(data);
      
      const [branches, labels, assignees, milestones] = await Promise.all([
        api.repositories.getBranches(data.id).catch(() => []),
        api.repositories.getLabels(data.id).catch(() => []),
        api.repositories.getAssignees(data.id).catch(() => []),
        api.repositories.getMilestones(data.id).catch(() => [])
      ]);
      
      setAvailableBranches(branches || []);
      setAvailableLabels(labels || []);
      setAvailableAssignees(assignees || []);
      setAvailableMilestones(milestones || []);
      
      if (branches && branches.length > 0) {
        setBaseBranch(branches.includes("main") ? "main" : branches[0]);
        setHeadBranch(branches.length > 1 ? (branches.includes("dev") ? "dev" : branches[1]) : branches[0]);
      }
    } catch (err) {
      console.error("Failed to fetch repository metadata", err);
    } finally {
      setLoading(false);
    }
  }, [owner, repoName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async () => {
    if (!title.trim() || creating || !repo || baseBranch === headBranch) return;
    setCreating(true);
    try {
       const pr = await api.repositories.createPull(repo.id, {
        title,
        body,
        base: baseBranch,
        head: headBranch,
        labelIds: selectedLabels,
        assigneeIds: selectedAssignees,
        reviewerIds: selectedReviewers,
        milestoneId: selectedMilestone || undefined,
      });
      navigate(`/repo/${repo.id}/pulls/${pr.number}`);
    } catch (err) {
      console.error(err);
      alert("Failed to create pull request");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0d1117]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 border-4 border-[#2f81f7] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-[#8b949e] animate-pulse">
            Comparing branches...
          </p>
        </div>
      </div>
    );
  }

  const isMergeable = baseBranch !== headBranch;

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-sans">
      <div className="max-w-[1280px] mx-auto px-6 py-6 animate-in fade-in duration-500">
        {/* Header Area */}
        <div className="flex items-center gap-3 mb-6">
           <button 
             type="button"
             onClick={() => navigate(-1)} 
             className="flex items-center justify-center size-8 bg-[#161b22] border border-[#30363d] rounded-full hover:bg-[#30363d] transition-all text-[#c9d1d9]"
             aria-label="Go back"
           >
             <span className="material-symbols-outlined !text-[18px]">keyboard_arrow_up</span>
           </button>
           <h1 className="text-[14px] font-bold text-[#f0f6fc]">Open a pull request</h1>
        </div>

        {/* Branch Selection Bar */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-md px-4 py-3 mb-8 flex flex-col md:flex-row items-center gap-4 shadow-sm">
           <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#8b949e] !text-[18px]">call_split</span>
              <div className="flex items-center bg-[#0d1117] border border-[#30363d] rounded-md px-2 py-1 text-[13px] font-semibold text-[#f0f6fc]">
                <label htmlFor="base-branch-select" className="text-[#8b949e] uppercase text-[9px] mr-2">base:</label>
                <select 
                  id="base-branch-select"
                  title="Select base branch"
                  value={baseBranch} 
                  onChange={(e) => setBaseBranch(e.target.value)}
                  className="bg-transparent outline-none cursor-pointer"
                >
                  {availableBranches.map(b => <option key={b} value={b} className="bg-[#161b22]">{b}</option>)}
                </select>
              </div>
              <span className="material-symbols-outlined text-[#8b949e] !text-[16px]">arrow_back</span>
              <div className="flex items-center bg-[#0d1117] border border-[#30363d] rounded-md px-2 py-1 text-[13px] font-semibold text-[#f0f6fc]">
                <label htmlFor="head-branch-select" className="text-[#8b949e] uppercase text-[9px] mr-2">compare:</label>
                <select 
                  id="head-branch-select"
                  title="Select compare branch"
                  value={headBranch} 
                  onChange={(e) => setHeadBranch(e.target.value)}
                  className="bg-transparent outline-none cursor-pointer"
                >
                  {availableBranches.map(b => <option key={b} value={b} className="bg-[#161b22]">{b}</option>)}
                </select>
              </div>
           </div>
           
           <div className="flex-1 flex items-center gap-2 md:pl-4 border-l-0 md:border-l border-[#30363d]">
              {isMergeable ? (
                <>
                  <span className="size-4 bg-[#238636] text-white rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined !text-[12px] font-black">check</span>
                  </span>
                  <span className="text-[#238636] text-[13px] font-semibold">Able to merge.</span>
                  <span className="text-[#8b949e] text-[13px]">These branches can be automatically merged.</span>
                </>
              ) : (
                <>
                  <span className="size-4 bg-[#f85149] text-white rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined !text-[12px] font-black">close</span>
                  </span>
                  <span className="text-[#f85149] text-[13px] font-semibold">Invalid comparison.</span>
                  <span className="text-[#8b949e] text-[13px]">Choose different branches to compare.</span>
                </>
              )}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
           {/* Editor Area */}
           <div className="space-y-6">
              <div className="space-y-2">
                 <label htmlFor="pr-title" className="block text-[14px] font-bold text-[#f0f6fc] mb-2">
                   Add a title <span className="text-[#f85149] font-normal">*</span>
                 </label>
                 <input
                   id="pr-title"
                   type="text"
                   value={title}
                   onChange={(e) => setTitle(e.target.value)}
                   placeholder="Title"
                   className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-[5px] text-[14px] text-[#f0f6fc] focus:border-[#2f81f7] focus:ring-1 focus:ring-[#2f81f7] outline-none transition-all placeholder:text-[#484f58]"
                   autoFocus
                 />
              </div>

              <div className="space-y-2">
                 <label htmlFor="pr-body" className="block text-[14px] font-bold text-[#f0f6fc] mb-2">
                    Add a description
                 </label>
                 <div className="border border-[#30363d] rounded-md bg-[#0d1117] overflow-hidden">
                    <div className="flex items-center justify-between bg-[#161b22] px-2 border-b border-[#30363d]">
                       <div className="flex">
                          <button 
                            type="button"
                            onClick={() => setActiveTab("write")}
                            className={`px-4 py-2 text-[14px] border-b-2 transition-all ${activeTab === 'write' ? 'border-[#f78166] text-[#f0f6fc] bg-[#0d1117] font-semibold' : 'border-transparent text-[#8b949e] hover:text-[#f0f6fc]'}`}
                          >
                            Write
                          </button>
                          <button 
                             type="button"
                             onClick={() => setActiveTab("preview")}
                             className={`px-4 py-2 text-[14px] border-b-2 transition-all ${activeTab === 'preview' ? 'border-[#f78166] text-[#f0f6fc] bg-[#0d1117] font-semibold' : 'border-transparent text-[#8b949e] hover:text-[#f0f6fc]'}`}
                          >
                            Preview
                          </button>
                       </div>
                       
                       {activeTab === 'write' && (
                         <div className="hidden md:flex items-center gap-1.5 px-2 text-[#8b949e]">
                            <button type="button" className="p-1 hover:bg-[#30363d] hover:text-[#2f81f7] rounded" title="Heading"><span className="material-symbols-outlined !text-[20px]">title</span></button>
                            <button type="button" className="p-1 hover:bg-[#30363d] hover:text-[#2f81f7] rounded" title="Bold"><span className="material-symbols-outlined !text-[20px]">format_bold</span></button>
                            <button type="button" className="p-1 hover:bg-[#30363d] hover:text-[#2f81f7] rounded" title="Italic"><span className="material-symbols-outlined !text-[20px]">format_italic</span></button>
                            <div className="h-4 w-[1px] bg-[#30363d] mx-1"></div>
                            <button type="button" className="p-1 hover:bg-[#30363d] hover:text-[#2f81f7] rounded" title="Quote"><span className="material-symbols-outlined !text-[20px]">format_quote</span></button>
                            <button type="button" className="p-1 hover:bg-[#30363d] hover:text-[#2f81f7] rounded" title="Code"><span className="material-symbols-outlined !text-[20px]">code</span></button>
                            <button type="button" className="p-1 hover:bg-[#30363d] hover:text-[#2f81f7] rounded" title="Link"><span className="material-symbols-outlined !text-[20px]">link</span></button>
                            <div className="h-4 w-[1px] bg-[#30363d] mx-1"></div>
                            <button type="button" className="p-1 hover:bg-[#30363d] hover:text-[#2f81f7] rounded" title="Bulleted List"><span className="material-symbols-outlined !text-[20px]">format_list_bulleted</span></button>
                            <button type="button" className="p-1 hover:bg-[#30363d] hover:text-[#2f81f7] rounded" title="Numbered List"><span className="material-symbols-outlined !text-[20px]">format_list_numbered</span></button>
                            <button type="button" className="p-1 hover:bg-[#30363d] hover:text-[#2f81f7] rounded" title="Task List"><span className="material-symbols-outlined !text-[20px]">checklist</span></button>
                            <div className="h-4 w-[1px] bg-[#30363d] mx-1"></div>
                            <button type="button" className="p-1 hover:bg-[#30363d] hover:text-[#2f81f7] rounded font-bold text-[13px]">@</button>
                            <button type="button" className="p-1 hover:bg-[#30363d] hover:text-[#2f81f7] rounded font-bold text-[13px]">#</button>
                         </div>
                       )}
                    </div>

                    {activeTab === 'write' ? (
                       <div className="p-2 min-h-[350px]">
                          <textarea
                            id="pr-body"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Type your description here..."
                            className="w-full min-h-[350px] bg-transparent text-[14px] text-[#f0f6fc] focus:outline-none resize-none p-2 leading-normal"
                          />
                       </div>
                    ) : (
                       <div className="p-4 bg-[#0d1117] min-h-[350px] text-[14px] text-[#f0f6fc] prose prose-invert max-w-none">
                          {body ? body : <p className="text-[#8b949e] italic">Nothing to preview</p>}
                       </div>
                    )}

                    <div className="flex items-center justify-between px-3 py-2 border-t border-[#30363d] text-[12px] text-[#8b949e]">
                       <div className="flex items-center gap-4">
                          <button type="button" className="flex items-center gap-1.5 hover:text-[#2f81f7] transition-colors">
                             <span className="material-symbols-outlined !text-[16px]">attachment</span>
                             Paste, drop, or click to add files
                          </button>
                          <button type="button" className="flex items-center gap-1.5 hover:text-[#2f81f7] transition-colors">
                             <span className="material-symbols-outlined !text-[16px]">auto_fix</span>
                             Write with Copilot
                          </button>
                       </div>
                       <span className="material-symbols-outlined !text-[16px] opacity-40">markdown</span>
                    </div>
                 </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => navigate(-1)} 
                    className="px-4 py-[5px] text-[14px] font-bold text-[#c9d1d9] bg-[#21262d] border border-[#30363d] rounded-md hover:bg-[#30363d] transition-all"
                  >
                    Cancel
                  </button>
                  <div className="flex items-center">
                    <button 
                      type="button"
                      onClick={handleSubmit}
                      disabled={!title.trim() || creating || !isMergeable}
                      className="px-4 py-[5px] bg-[#238636] border border-[#2ea043] hover:bg-[#2ea043] text-white rounded-l-md font-bold text-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {creating ? "Creating..." : "Create pull request"}
                    </button>
                    <button type="button" aria-label="More options" className="px-2 py-[5px] bg-[#238636] border border-[#2ea043] border-l-0 hover:bg-[#2ea043] text-white rounded-r-md disabled:opacity-50 transition-all">
                       <span className="material-symbols-outlined !text-[18px]">keyboard_arrow_down</span>
                    </button>
                  </div>
              </div>
           </div>

           {/* Sidebar Area */}
           <div className="space-y-0 divide-y divide-[#30363d]">
              {[
                { id: 'reviewers', label: "Reviewers", selected: selectedReviewers, set: setSelectedReviewers },
                { id: 'assignees', label: "Assignees", selected: selectedAssignees, set: setSelectedAssignees },
                { id: 'labels', label: "Labels", selected: selectedLabels, set: setSelectedLabels },
                { id: 'projects', label: "Projects", selected: [], set: () => {} },
                { id: 'milestone', label: "Milestone", selected: selectedMilestone ? [selectedMilestone] : [], set: (val: any) => setSelectedMilestone(val) }
              ].map((section) => (
                <div key={section.id} className="py-4 first:pt-0">
                   <div className="flex items-center justify-between mb-2">
                     <h3 className="text-[12px] font-bold text-[#8b949e]">{section.label}</h3>
                     <button type="button" aria-label={`Edit ${section.label}`} className="text-[#8b949e] hover:text-[#2f81f7] transition-colors">
                       <span className="material-symbols-outlined !text-[18px]">settings</span>
                     </button>
                   </div>
                   {section.selected.length === 0 ? (
                      <p className="text-[12px] text-[#8b949e]">
                        No {section.label.toLowerCase()}
                      </p>
                   ) : (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {section.id === 'labels' ? (
                          section.selected.map(id => {
                             const label = availableLabels.find(l => l.id === id);
                             return label ? (
                               <span key={label.id} className="px-2 py-0.5 rounded-full text-[10px] font-bold border" style={{ backgroundColor: `${label.color}10`, borderColor: `${label.color}40`, color: label.color }}>
                                 {label.name}
                               </span>
                             ) : null;
                          })
                        ) : (
                          section.selected.map(id => (
                            <div key={id} className="px-2 py-0.5 bg-[#161b22] border border-[#30363d] rounded-md text-[11px] font-medium">
                               {id}
                            </div>
                          ))
                        )}
                      </div>
                   )}
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePullRequestView;
