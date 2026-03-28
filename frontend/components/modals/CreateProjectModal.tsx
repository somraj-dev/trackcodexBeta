import React, { useState, useRef, useEffect } from "react";
import { Project } from "../../types/project";
import { auth, githubProvider, isFirebaseConfigured } from "../../lib/firebase";
import { signInWithPopup, GithubAuthProvider, linkWithPopup } from "firebase/auth";
import { projectService } from "../../services/infra/projectService";
import "../../styles/CreateProjectModal.css";

const V = {
  bg: "var(--gh-bg)",
  card: "var(--gh-bg-secondary)",
  cardHover: "var(--bg-hover)",
  border: "var(--gh-border)",
  borderLight: "var(--gh-border)",
  text: "var(--gh-text)",
  textSecondary: "var(--gh-text-secondary)",
  textTertiary: "var(--gh-text-secondary)",
  accent: "var(--primary-color)",
  green: "var(--gh-success)",
  font: "var(--font-sans, 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
};

export interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (p: Project) => Promise<any>;
  mode?: 'project' | 'goal' | 'task';
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onDeploy, mode = "project" }) => {
  const [progress, setProgress] = useState("action-items");
  const [selectedIcon, setSelectedIcon] = useState("rocket");
  const [projectName, setProjectName] = useState("");
  const [step, setStep] = useState(1);
  const [repoSearch, setRepoSearch] = useState("");
  const [endDate, setEndDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Git Provider States
  const [isGitProviderDropdownOpen, setIsGitProviderDropdownOpen] = useState(false);
  const [activeGitProvider, setActiveGitProvider] = useState<"github" | "trackcodex">("github");
  const [showProviderSelection, setShowProviderSelection] = useState(false);

  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [githubError, setGithubError] = useState("");

  const fetchGithubRepos = async (token: string) => {
    setIsLoadingRepos(true);
    setGithubError("");
    try {
      const res = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json"
        }
      });
      if (!res.ok) {
        if (res.status === 401) {
           localStorage.removeItem("github_access_token");
           throw new Error("GitHub token expired. Please reconnect.");
        }
        throw new Error("Failed to fetch repositories.");
      }
      const data = await res.json();
      setGithubRepos(data.map((r: any) => ({
        name: r.name,
        owner: r.owner.login,
        branch: r.default_branch,
        private: r.private,
        updatedAt: r.updated_at
      })));
      if (data.length > 0) {
        localStorage.setItem("github_username", data[0].owner.login);
      }
    } catch (err: any) {
      setGithubError(err.message);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleConnectGithub = async (forcePrompt: boolean = false) => {
    try {
      setIsLoadingRepos(true);
      setGithubError("");

      if (!isFirebaseConfigured) {
        throw new Error("Firebase Authentication is not configured. GitHub connection unavailable.");
      }

      if (forcePrompt) {
        githubProvider.setCustomParameters({ prompt: 'select_account' });
      } else {
        githubProvider.setCustomParameters({});
      }

      let result;
      if (auth.currentUser) {
        try {
           result = await linkWithPopup(auth.currentUser, githubProvider);
        } catch (err: any) {
           if (err.code === 'auth/credential-already-in-use' || err.code === 'auth/provider-already-linked') {
             result = await signInWithPopup(auth, githubProvider);
           } else {
             throw err;
           }
        }
      } else {
         result = await signInWithPopup(auth, githubProvider);
      }
      
      const credential = GithubAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
         localStorage.setItem("github_access_token", credential.accessToken);
         await fetchGithubRepos(credential.accessToken);
         setActiveGitProvider("github");
         setShowProviderSelection(false);
      } else {
         throw new Error("No GitHub access token received.");
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
         setGithubError(err.message || "Failed to connect to GitHub");
      }
      setIsLoadingRepos(false);
    }
  };

  useEffect(() => {
    if (activeGitProvider === "github" && !showProviderSelection) {
       const token = localStorage.getItem("github_access_token");
       if (token && githubRepos.length === 0) {
          fetchGithubRepos(token);
       }
    }
  }, [activeGitProvider, showProviderSelection]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<{name: string, size: string, progress: number, type: string}[]>([]);

  const handleFileClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(f => ({
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        progress: 100,
        type: f.name.split('.').pop() || 'file'
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files).map(f => ({
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        progress: 100,
        type: f.name.split('.').pop() || 'file'
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  /* Step 3 States */
  const [teamName, setTeamName] = useState("Quantaforze");
  const [isAppPresetOpen, setIsAppPresetOpen] = useState(false);
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [deploymentStep, setDeploymentStep] = useState(0); 
  const [deployTime, setDeployTime] = useState(0);
  const [isDeployed, setIsDeployed] = useState(false);
  const [selectedAppPreset, setSelectedAppPreset] = useState({ 
    id: "vite", 
    name: "Vite", 
    icon: (
      <svg width="18" height="18" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M253.513 46.3905C253.513 46.3905 186.702 11.2335 129.563 11.2335C72.424 11.2335 5.6133 46.3905 5.6133 46.3905L0 55.4335L122.95 240.233L129.563 250.318L136.176 240.233L259.126 55.4335L253.513 46.3905Z" fill="url(#vite-grad1)"/>
        <path d="M253.513 46.3905L136.176 240.233L167.318 69.3179L253.513 46.3905Z" fill="url(#vite-grad2)"/>
        <path d="M5.6133 46.3905L122.95 240.233L91.808 69.3179L5.6133 46.3905Z" fill="url(#vite-grad3)"/>
        <defs>
          <linearGradient id="vite-grad1" x1="129.563" y1="11.2335" x2="129.563" y2="250.318" gradientUnits="userSpaceOnUse"><stop stopColor="#41D1FF"/><stop offset="1" stopColor="#BD34FE"/></linearGradient>
          <linearGradient id="vite-grad2" x1="194.845" y1="46.3905" x2="194.845" y2="240.233" gradientUnits="userSpaceOnUse"><stop stopColor="#FFEA83"/><stop offset="1" stopColor="#FF7129"/></linearGradient>
          <linearGradient id="vite-grad3" x1="64.2817" y1="46.3905" x2="64.2817" y2="240.233" gradientUnits="userSpaceOnUse"><stop stopColor="#41D1FF"/><stop offset="1" stopColor="#BD34FE"/></linearGradient>
        </defs>
      </svg>
    )
  });
  const [rootDirectory, setRootDirectory] = useState("./");
  const [isRootDirModalOpen, setIsRootDirModalOpen] = useState(false);
  const [tempRootDir, setTempRootDir] = useState("./");
  const [isBuildSettingsOpen, setIsBuildSettingsOpen] = useState(false);
  const [isEnvVarsOpen, setIsEnvVarsOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<{name: string, owner: string, branch: string} | null>(null);

  const [buildCommand, setBuildCommand] = useState("");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [buildLogs, setBuildLogs] = useState<string>("");

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let logTimer: NodeJS.Timeout;

    if (showProgress && !isDeployed) {
      timer = setInterval(async () => {
        if (!activeProjectId) return;
        try {
          const status = await projectService.getBuildStatus(activeProjectId);
          if (status.buildStatus === "BUILDING") {
            setDeploymentStep(0);
          } else if (status.buildStatus === "READY") {
            setDeploymentStep(1);
            setTimeout(() => {
              setDeploymentStep(2);
              setTimeout(() => {
                setDeploymentStep(3);
                setTimeout(() => setIsDeployed(true), 1500);
              }, 2000);
            }, 2000);
          }
        } catch (err) {}
      }, 3000);

      const uiTimer = setInterval(() => {
        setDeployTime(prev => prev + 1);
      }, 1000);

      logTimer = setInterval(async () => {
        if (!activeProjectId) return;
        try {
          const status = await projectService.getBuildStatus(activeProjectId);
          const latestDeployId = status.latestDeployment?.id || status.activeDeployId;
          if (latestDeployId) {
            const logData = await projectService.getBuildLogs(activeProjectId, latestDeployId);
            if (logData.logs) setBuildLogs(logData.logs);
          }
        } catch (err) {}
      }, 5000);
      
      return () => {
        clearInterval(timer);
        clearInterval(uiTimer);
        clearInterval(logTimer);
      };
    }
  }, [showProgress, activeProjectId, isDeployed]);

  const resetAll = () => {
    setStep(1);
    setProjectName("");
    setEndDate("");
    setSelectedRepo(null);
    setSelectedIcon("rocket");
    setShowProgress(false);
    setDeploymentStep(0);
    setDeployTime(0);
    setIsDeployed(false);
    setActiveProjectId(null);
    setBuildLogs("");
  };

  const handleNext = () => {
    if (mode === 'task' && step === 1) handleDeploy();
    else if (mode === 'goal' && step === 2) handleDeploy();
    else if (step < 3) setStep(step + 1);
    else handleDeploy();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onClose();
  };

  const handleDeploy = async () => {
    const name = projectName || selectedRepo?.name || "new-project";
    const repoOwner = selectedRepo?.owner || "somraj-dev";
    const repoName = selectedRepo?.name || "unknown";
    const branch = selectedRepo?.branch || "main";

    const newProject: Project = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name: name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      repoUrl: `https://github.com/${repoOwner}/${repoName}`,
      branch: branch,
      framework: selectedAppPreset.name,
      status: "building",
      createdAt: new Date().toISOString(),
      userId: auth.currentUser?.uid || "guest",
      logo: selectedIcon === "rocket" ? "🚀" : selectedIcon === "flag" ? "🚩" : selectedIcon === "star" ? "⭐" : selectedIcon === "bolt" ? "⚡" : "⬡",
      logoBg: V.bg,
      domain: `${name.toLowerCase().replace(/\s+/g, '-')}.trackcodex.com`,
    };

    setShowProgress(true);
    const result = await onDeploy(newProject);
    if (result && result.id) setActiveProjectId(result.id);
  };

  const handleDateSave = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatted = `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
    setEndDate(formatted);
    setShowDatePicker(false);
  };

  const isNextEnabled = projectName.trim() !== "" && endDate !== "";
  const modeLabel = mode === 'project' ? 'Project' : mode === 'goal' ? 'Goal' : 'Task';
  const modeLabelLower = modeLabel.toLowerCase();

  const icons = [
    { id: "flag", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> },
    { id: "rocket", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-5c1.62-2.2 5-3 5-3"/><path d="M12 15v5s3.03-.55 5-2c2.2-1.62 3-5 3-5"/></svg> },
    { id: "suitcase", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> },
    { id: "heart", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
    { id: "coin", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg> },
    { id: "bolt", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
    { id: "mail", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><rect x="2" y="5" width="20" height="14" rx="2"/></svg> },
    { id: "star", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg> },
  ];

  if (!isOpen) return null;

  const isDatePickerExpanded = showDatePicker ? "true" : "false";
  const isGitDropdownExpanded = isGitProviderDropdownOpen ? "true" : "false";
  const isBuildSettingsExpanded = isBuildSettingsOpen ? "true" : "false";

  return (
    <div className="cpm-overlay">
      <div onClick={onClose} className="cpm-backdrop" aria-hidden="true" />
      <div className="cpm-container" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="cpm-header">
          <div className="cpm-header-left">
            <div className="cpm-header-icon" aria-hidden="true">
              {step === 1 ? (
                mode === 'task' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3h18v18H3z"/><path d="m9 12 2 2 4-4"/></svg>
                )
              ) : (mode === 'goal' && step === 2) ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
              )}
            </div>
            <h2 id="modal-title" className="cpm-header-title">
              {step === 1 ? `Create ${modeLabel}` : (step === 2 && mode === 'goal') ? "Upload Goal Files" : step === 2 ? "Import Git Repository" : `New ${modeLabel}`}
            </h2>
          </div>
          <button 
            type="button"
            title="Close modal" 
            aria-label="Close modal" 
            onClick={onClose} 
            className="cpm-close-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="cpm-body no-scrollbar">
          {step === 1 && (
            <div className="space-y-6">
              <div className="cpm-form-group">
                <label className={`cpm-label ${!projectName ? 'error' : ''}`} htmlFor="project-name">{modeLabel} name *</label>
                <input 
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Launch marketing site"
                  className="cpm-input"
                />
              </div>

              <div className="cpm-assign-row">
                <div className="cpm-assign-item">
                  <label className="cpm-label" htmlFor="project-assign">{mode === 'goal' ? 'Goal Type' : 'Assign'}</label>
                  <button 
                    id="project-assign"
                    type="button"
                    onClick={() => setIsAssignModalOpen(true)}
                    className="cpm-select-box"
                    aria-haspopup="listbox"
                    title={mode === 'goal' ? 'Select Goal Type' : 'Select Assignee'}
                  >
                    <div className="cpm-git-header-row">
                      <div className="cpm-avatar" aria-hidden="true">Y</div>
                      <span className="text-[14px]">You</span>
                    </div>
                    <span className="text-[12px] text-gh-text-secondary" aria-hidden="true">▾</span>
                  </button>
                </div>
                <div className="cpm-assign-item">
                  <label className={`cpm-label ${!endDate ? 'error' : ''}`} htmlFor="project-date">{modeLabel} end date *</label>
                  <button 
                    id="project-date"
                    type="button"
                    onClick={() => setShowDatePicker(true)}
                    className={`cpm-select-box ${showDatePicker ? 'active' : ''}`}
                    aria-haspopup="grid"
                    aria-expanded={showDatePicker ? "true" : "false"}
                    title="Select end date"
                  >
                    <span className="text-[14px]">{endDate || "dd-mm-yyyy"}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </button>

                  {showDatePicker && (
                    <div className="cpm-date-picker" role="dialog" aria-label="Select date">
                      <div className="cpm-calendar-header">
                        <button type="button" aria-label="Previous month" className="cpm-calendar-header-btn" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>‹</button>
                        <span className="cpm-calendar-header-title" aria-live="polite">{calendarMonth.toLocaleString('default', { month: 'long' })} {calendarMonth.getFullYear()}</span>
                        <button type="button" aria-label="Next month" className="cpm-calendar-header-btn" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>›</button>
                      </div>
                      <div className="p-4 pt-2">
                        <div className="cpm-calendar-grid" role="grid" aria-label="January 2026">
                          <div className="cpm-calendar-grid mb-1" role="row">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="cpm-calendar-weekday" role="columnheader">{d}</div>)}
                          </div>
                          {(() => {
                            const cells = [];
                            const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
                            const lastDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
                            const prevMonthLastDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 0).getDate();
                            
                            // Previous month's days
                            for (let i = firstDay - 1; i >= 0; i--) {
                              cells.push(<div key={`prev-${i}`} className="cpm-calendar-day-prev" role="gridcell" aria-disabled="true">{prevMonthLastDate - i}</div>);
                            }
                            
                            // Current month's days
                            for (let d = 1; d <= lastDate; d++) {
                              const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d);
                              const isSelectedDate = endDate === `${d.toString().padStart(2, '0')}-${(calendarMonth.getMonth() + 1).toString().padStart(2, '0')}-${calendarMonth.getFullYear()}`;
                              cells.push(
                                <button 
                                  key={d} 
                                  type="button"
                                  onClick={() => handleDateSave(date)} 
                                  className={`cpm-day-cell ${isSelectedDate ? 'selected' : ''}`} 
                                  role="gridcell" 
                                  aria-selected={isSelectedDate ? "true" : "false"}
                                >
                                  {d}
                                </button>
                              );
                            }

                            // Group cells into rows of 7
                            const rows = [];
                            for (let i = 0; i < cells.length; i += 7) {
                              rows.push(
                                <div key={`row-${i}`} role="row" className="cpm-calendar-grid">
                                  {cells.slice(i, i + 7)}
                                </div>
                              );
                            }
                            return rows;
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="cpm-form-group">
                <label className="cpm-label">Choose icon</label>
                <div className="cpm-icon-picker">
                  {icons.map(icon => (
                    <button key={icon.id} onClick={() => setSelectedIcon(icon.id)} className={`cpm-icon-btn ${selectedIcon === icon.id ? 'selected' : ''}`} aria-pressed={selectedIcon === icon.id ? "true" : "false"}>
                      {icon.svg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cpm-form-group">
                <label className="cpm-label" htmlFor="project-desc">{modeLabel} description</label>
                <textarea id="project-desc" placeholder={`Add more detail about this ${modeLabelLower}`} className="cpm-textarea" />
              </div>

              <div>
                <label className="cpm-label">Measurement Method *</label>
                <div className="cpm-radio-group" role="radiogroup" aria-label="Measurement Method">
                  {["Completing sub-goals", "Completing action items", "Tracking a metric"].map(label => (
                    <button 
                      key={label} 
                      type="button"
                      className={`cpm-radio-item ${progress === label ? 'selected' : ''}`} 
                      onClick={() => setProgress(label)}
                      role="radio"
                      aria-checked={progress === label ? "true" : "false"}
                    >
                      <div className="cpm-radio-circle" aria-hidden="true">{progress === label && <div className="cpm-radio-dot" />}</div>
                      <span className="text-[14px]">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="px-6 pb-6">
              {mode === 'goal' ? (
                <div className="space-y-6">
                  <button 
                    type="button"
                    onClick={handleFileClick} 
                    className="cpm-upload-area" 
                    role="button" 
                    aria-label="Upload files"
                  >
                    <div className="text-[32px] opacity-50" aria-hidden="true">📤</div>
                    <div className="text-[14px] font-semibold">Drop files here or browse</div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" title="File upload" />
                  </button>
                  <div className="space-y-2">
                    {files.map((file, i) => (
                      <div key={i} className="cpm-upload-item">
                        <div className="cpm-upload-icon">{file.type.toUpperCase()}</div>
                        <div className="cpm-upload-info">
                          <div className="cpm-upload-name">{file.name}</div>
                          <div className="cpm-upload-meta">{file.size}</div>
                        </div>
                        <button onClick={() => removeFile(i)} className="cpm-upload-remove-btn">🗑</button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : showProviderSelection ? (
                <div className="cpm-git-provider-header">
                  <p className="cpm-git-provider-desc">Select a Git provider to import your project.</p>
                  <div className="cpm-git-provider-list">
                    <button onClick={() => handleConnectGithub()} className="cpm-git-provider-btn github">Connect GitHub</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="cpm-git-header-row gap-4">
                    <div className="relative w-[200px]">
                      <button onClick={() => setIsGitProviderDropdownOpen(!isGitProviderDropdownOpen)} className="cpm-git-select-trigger" aria-expanded={isGitProviderDropdownOpen ? "true" : "false"}>
                        <span className="font-semibold">{activeGitProvider === "github" ? (localStorage.getItem("github_username") || "somraj-dev") : "Workspace"}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                      {isGitProviderDropdownOpen && (
                        <div className="cpm-git-dropdown" role="listbox">
                           <button onClick={() => { setActiveGitProvider("github"); setIsGitProviderDropdownOpen(false); }} className="cpm-git-dropdown-item">GitHub Account</button>
                           <button onClick={() => { setShowProviderSelection(true); setIsGitProviderDropdownOpen(false); }} className="cpm-git-dropdown-item">Switch Provider</button>
                        </div>
                      )}
                    </div>
                    <div className="cpm-git-search-container flex-1">
                      <input type="text" placeholder="Search repositories..." className="cpm-git-search-input" value={repoSearch} onChange={(e) => setRepoSearch(e.target.value)} title="Search repositories" />
                    </div>
                  </div>
                  <div className="cpm-repo-list">
                    {isLoadingRepos ? <div className="p-8 text-center text-gh-text-secondary">Loading...</div> : 
                     githubRepos.filter(r => r.name.toLowerCase().includes(repoSearch.toLowerCase())).map((repo, idx) => (
                      <div key={idx} className="cpm-repo-item">
                        <span className="text-[14px] font-medium text-gh-text">{repo.name}</span>
                        <button onClick={() => { setSelectedRepo({ name: repo.name, owner: repo.owner, branch: repo.branch }); setStep(3); }} className="cpm-btn cpm-btn-primary h-8 px-4 text-[13px]">Import</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && selectedRepo && (
            <div className="px-6 pb-6 space-y-8">
              <div className="cpm-repo-summary">
                <div className="cpm-repo-summary-label">Importing from GitHub</div>
                <div className="cpm-repo-summary-main">
                  <span className="text-[14px] font-semibold">{selectedRepo.owner}/{selectedRepo.name}</span>
                  <div className="cpm-repo-branch-info">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9"/></svg>
                    <span className="text-[13px] font-mono">{selectedRepo.branch || 'main'}</span>
                  </div>
                </div>
              </div>

              <div className="cpm-assign-row gap-6">
                <div className="cpm-assign-item flex-1">
                  <label className="cpm-label mb-3" htmlFor="team-select">Vercel Team</label>
                  <button onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)} className="cpm-git-select-trigger w-full" id="team-select">
                    <span className="font-medium">{teamName}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                </div>
                <div className="cpm-assign-item flex-1">
                  <label className="cpm-label mb-3" htmlFor="import-name">Project Name</label>
                  <input id="import-name" className="cpm-git-search-input py-[7px]" value={projectName || selectedRepo.name} onChange={(e) => setProjectName(e.target.value)} />
                </div>
              </div>

              <div className="border-t border-gh-border pt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <label className="cpm-label mb-0">Root Directory</label>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-mono bg-gh-bg-secondary p-1 px-2 rounded border border-gh-border">{rootDirectory}</span>
                    <button onClick={() => setIsRootDirModalOpen(true)} className="text-[13px] text-primary-color hover:underline bg-transparent border-none cursor-pointer">Edit</button>
                  </div>
                </div>

                <div className="border border-gh-border rounded-lg overflow-hidden">
                  <button 
                    onClick={() => setIsBuildSettingsOpen(!isBuildSettingsOpen)} 
                    className={`cpm-build-trigger ${isBuildSettingsOpen ? 'active' : ''}`}
                    aria-expanded={isBuildSettingsExpanded}
                  >
                    <span className="text-[12px] font-bold text-gh-text uppercase tracking-wider">Build and Output Settings</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`cpm-chevron ${isBuildSettingsOpen ? 'rotated' : ''}`}><polyline points="18 15 12 9 6 15"/></svg>
                  </button>
                  {isBuildSettingsOpen && (
                    <div className="p-4 bg-gh-bg-secondary border-t border-gh-border">
                      <input className="cpm-git-search-input w-full bg-gh-bg" placeholder="npm run build" value={buildCommand} onChange={(e) => setBuildCommand(e.target.value)} />
                    </div>
                  )}
                </div>
              </div>

              <button onClick={handleDeploy} className="cpm-btn cpm-btn-primary w-full py-4 text-[15px] font-bold shadow-lg">Deploy Project</button>
            </div>
          )}
        </div>

        {step !== 3 && (
          <div className="cpm-footer">
            <button onClick={handleBack} className="cpm-btn cpm-btn-secondary">{step === 1 ? "Cancel" : "Back"}</button>
            <button onClick={handleNext} disabled={step === 1 && !isNextEnabled} className="cpm-btn cpm-btn-primary">
              Next <span className="ml-1" aria-hidden="true">›</span>
            </button>
          </div>
        )}

        {isRootDirModalOpen && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-5">
            <div onClick={() => setIsRootDirModalOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
            <div className="relative w-full max-w-[500px] bg-gh-bg border border-gh-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="p-6">
                <h3 className="text-[20px] font-bold mb-2">Root Directory</h3>
                <p className="text-[13px] text-gh-text-secondary">Select the directory containing your source code.</p>
              </div>
              <div className="flex-1 border-t border-gh-border overflow-y-auto max-h-[300px]" role="listbox">
                {["./ (root)", "./auth", "./backend", "./frontend"].map(dir => (
                  <div key={dir} onClick={() => { setRootDirectory(dir); setIsRootDirModalOpen(false); }} className="p-4 px-6 hover:bg-gh-bg-secondary cursor-pointer border-l-2 border-transparent hover:border-gh-text transition-colors text-[14px]">
                    {dir}
                  </div>
                ))}
              </div>
              <div className="p-4 px-6 bg-gh-bg-secondary flex justify-end">
                <button onClick={() => setIsRootDirModalOpen(false)} className="cpm-btn cpm-btn-secondary px-6 py-2">Close</button>
              </div>
            </div>
          </div>
        )}

        {showProgress && !isDeployed && (
          <div className="fixed inset-0 z-[7000] flex items-center justify-center p-5">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md" aria-hidden="true" />
            <div className="relative w-full max-w-[500px] bg-gh-bg border border-gh-border rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="cpm-spinner w-12 h-12 mb-6" aria-hidden="true"></div>
              <h2 className="text-[24px] font-bold mb-2">Deploying Project</h2>
              <p className="text-gh-text-secondary text-[14px] mb-8">This will take about a minute...</p>
              <div className="w-full bg-gh-bg-secondary border border-gh-border rounded-lg p-4 font-mono text-[11px] text-left text-gh-text-secondary min-h-[100px] max-h-[200px] overflow-y-auto">
                {buildLogs || "Connecting to build server..."}
              </div>
              <button onClick={resetAll} className="mt-8 text-gh-text-secondary hover:text-gh-text text-[13px] font-medium bg-transparent border-none cursor-pointer">Cancel</button>
            </div>
          </div>
        )}

        {isDeployed && (
          <div className="fixed inset-0 z-[7000] flex items-center justify-center p-5">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" aria-hidden="true" />
            <div className="relative w-full max-w-[600px] bg-gh-bg border border-gh-border rounded-3xl p-10 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-primary-color/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h1 className="text-[32px] font-black mb-4">You're all set!</h1>
              <p className="text-gh-text-secondary mb-10 leading-relaxed">Your project <strong>{projectName}</strong> has been deployed to TrackCodex.</p>
              <button onClick={() => { onClose(); resetAll(); }} className="cpm-btn cpm-btn-primary w-full py-4 text-[16px] font-bold">Launch Dashboard</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateProjectModal;
