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

// AssignTaskModal removed to be replaced by CreateProjectModal with mode="task"

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
  const [deploymentStep, setDeploymentStep] = useState(0); // 0: build, 1: summary, 2: domains, 3: ready
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

  // Expanded Step 3 Settings States
  const [buildCommand, setBuildCommand] = useState("");
  const [isBuildOverride, setIsBuildOverride] = useState(false);
  const [outputDirectory] = useState("frontend/dist");
  const [installCommand, setInstallCommand] = useState("");
  const [isInstallOverride, setIsInstallOverride] = useState(false);
  const [envVars, setEnvVars] = useState([{ key: "EXAMPLE_NAME", value: "I9JU23NF394R6HH" }]);

  const isNextEnabled = projectName.trim() !== "" && endDate !== "";

  const handleDateSave = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatted = `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
    setEndDate(formatted);
    setShowDatePicker(false);
  };

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [buildLogs, setBuildLogs] = useState<string>("");

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let logTimer: NodeJS.Timeout;

    if (showProgress && !isDeployed) {
      // 1. Poll build status
      timer = setInterval(async () => {
        if (!activeProjectId) return;
        
        try {
          const status = await projectService.getBuildStatus(activeProjectId);
          
          if (status.buildStatus === "BUILDING") {
            setDeploymentStep(0);
          } else if (status.buildStatus === "READY") {
            setDeploymentStep(1);
            // After 2s, move to Domains -> Success
            setTimeout(() => {
              setDeploymentStep(2);
              setTimeout(() => {
                setDeploymentStep(3);
                setTimeout(() => setIsDeployed(true), 1500);
              }, 2000);
            }, 2000);
          } else if (status.buildStatus === "ERROR") {
            // Handle error in UI
            console.error("Build failed");
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 3000);

      // 2. Increment UI timer locally for visual effect
      const uiTimer = setInterval(() => {
        setDeployTime(prev => prev + 1);
      }, 1000);

      // 3. Poll logs if available
      logTimer = setInterval(async () => {
        if (!activeProjectId) return;
        try {
          const status = await projectService.getBuildStatus(activeProjectId);
          const latestDeployId = status.latestDeployment?.id || status.activeDeployId;
          
          if (latestDeployId) {
            const logData = await projectService.getBuildLogs(activeProjectId, latestDeployId);
            if (logData.logs) {
              setBuildLogs(logData.logs);
            }
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
    if (mode === 'task' && step === 1) {
      handleDeploy();
    } else if (mode === 'goal' && step === 2) {
      handleDeploy();
    } else if (step < 3) {
      setStep(step + 1);
    } else {
      handleDeploy();
    }
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
      // Legacy fields
      logo: selectedIcon === "rocket" ? "🚀" : selectedIcon === "flag" ? "🚩" : selectedIcon === "star" ? "⭐" : selectedIcon === "bolt" ? "⚡" : "⬡",
      logoBg: V.bg,
      domain: `${name.toLowerCase().replace(/\s+/g, '-')}.trackcodex.com`,
    };

    // Show progress immediately
    setShowProgress(true);
    
    // Trigger deploy via onDeploy (which calls projectService.createProject)
    const result = await onDeploy(newProject);
    if (result && result.id) {
      setActiveProjectId(result.id);
    }
  };

  const modeLabel = mode === 'project' ? 'Project' : mode === 'goal' ? 'Goal' : 'Task';
  const modeLabelLower = mode === 'project' ? 'project' : mode === 'goal' ? 'goal' : 'task';

  if (!isOpen) return null;

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

  return (
    <div className="cpm-overlay">
      <div onClick={onClose} className="cpm-backdrop" />
      <div className="cpm-container">
        <div className="cpm-header">
          <div className="cpm-header-left">
            <div className="cpm-header-icon">
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
            <h2 className="cpm-header-title">
              {step === 1 ? `Create ${modeLabel}` : (step === 2 && mode === 'goal') ? "Upload Goal Files" : step === 2 ? "Import Git Repository" : `New ${modeLabel}`}
            </h2>
          </div>
          <button title="Close modal" aria-label="Close modal" onClick={onClose} className="cpm-close-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="cpm-body no-scrollbar">
          {step === 1 && (
            <>
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

              <div className="cpm-flex-row">
                <div style={{ flex: 1 }}>
                  <label className="cpm-label">{mode === 'goal' ? 'Goal Type' : 'Assign'}</label>
                  <div 
                    onClick={() => setIsAssignModalOpen(true)}
                    className="cpm-select-box"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="cpm-avatar">Y</div>
                      <span style={{ fontSize: 14 }}>You</span>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--gh-text-secondary)" }}>▾</span>
                  </div>
                </div>
                <div style={{ flex: 1, position: "relative" }}>
                  <label className={`cpm-label ${!endDate ? 'error' : ''}`}>{modeLabel} end date *</label>
                  <div 
                    onClick={() => { setTempDate(endDate ? (() => { const p = endDate.split('-'); return new Date(+p[2], +p[1]-1, +p[0]); })() : new Date()); setCalendarMonth(endDate ? (() => { const p = endDate.split('-'); return new Date(+p[2], +p[1]-1, 1); })() : new Date()); setShowDatePicker(true); }}
                    className={`cpm-select-box ${showDatePicker ? 'active' : ''}`}
                  >
                    <span style={{ fontSize: 14 }}>{endDate || "dd-mm-yyyy"}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>

                  {showDatePicker && (
                    <div className="cpm-date-picker">
                      <div className="cpm-calendar-header">
                        <button title="Previous month" onClick={(e) => { e.stopPropagation(); setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)); }} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "transparent", color: "var(--gh-text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>‹</button>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{calendarMonth.toLocaleString('default', { month: 'long' })} {calendarMonth.getFullYear()}</span>
                        <button title="Next month" onClick={(e) => { e.stopPropagation(); setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)); }} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "transparent", color: "var(--gh-text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>›</button>
                      </div>
                      <div style={{ padding: "8px 16px 0" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--gh-text-secondary)", padding: "4px 0" }}>{d}</div>
                          ))}
                        </div>
                      </div>
                      <div style={{ padding: "0 16px 12px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                          {(() => {
                            const days = [];
                            const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
                            const lastDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
                            const prevMonthLastDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 0).getDate();
                            
                            for (let i = firstDay - 1; i >= 0; i--) {
                              days.push(<div key={`prev-${i}`} style={{ height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--gh-text-secondary)" }}>{prevMonthLastDate - i}</div>);
                            }
                            for (let d = 1; d <= lastDate; d++) {
                              const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d);
                              const isToday = date.toDateString() === new Date().toDateString();
                              const isSelected = endDate === `${d.toString().padStart(2, '0')}-${(calendarMonth.getMonth() + 1).toString().padStart(2, '0')}-${calendarMonth.getFullYear()}`;
                              
                              days.push(
                                <div 
                                  key={d} 
                                  onClick={(e) => { e.stopPropagation(); handleDateSave(date); }}
                                  className={`cpm-day-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                                >
                                  {d}
                                </div>
                              );
                            }
                            return days;
                          })()}
                        </div>
                      </div>
                      <div style={{ padding: "16px 24px", borderTop: `1px solid var(--gh-border)`, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                        <button onClick={(e) => { e.stopPropagation(); setShowDatePicker(false); }} className="cpm-btn cpm-btn-primary" style={{ height: 28, padding: "0 12px", fontSize: 12 }}>Save</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="cpm-form-group">
                <label className="cpm-label">Choose icon</label>
                <div className="cpm-icon-picker">
                  {icons.map(icon => (
                    <button 
                      key={icon.id} 
                      title={`Select ${icon.id} icon`}
                      onClick={() => setSelectedIcon(icon.id)} 
                      className={`cpm-icon-btn ${selectedIcon === icon.id ? 'selected' : ''}`}
                    >
                      {icon.svg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cpm-form-group" style={{ marginBottom: 32 }}>
                <label className="cpm-label" htmlFor="project-desc">{modeLabel} description</label>
                <textarea 
                  id="project-desc"
                  placeholder={`Add more detail here to help remember why you created this ${modeLabelLower}`}
                  className="cpm-textarea"
                />
              </div>

              <div style={{ marginBottom: 32 }}>
                <label className="cpm-label">How will you measure progress? *</label>
                <div className="cpm-radio-group">
                  {[
                    { id: "sub-goals", label: "Completing sub-goals" },
                    { id: "action-items", label: "Completing action items" },
                    { id: "amount", label: "Tracking a number, percent, or dollar amount" },
                  ].map(opt => (
                    <label key={opt.id} className={`cpm-radio-item ${progress === opt.id ? 'selected' : ''}`} onClick={() => setProgress(opt.id)}>
                      <div className="cpm-radio-circle">
                        {progress === opt.id && <div className="cpm-radio-dot" />}
                      </div>
                      <span style={{ fontSize: 14 }}>{opt.label}</span>
                    </label>
                  ))}
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: "#FF5555", fontStyle: "italic" }}>* This field is required</div>
              </div>
            </>
          )}

          {step === 2 && (
            <div style={{ padding: "0 24px 24px" }}>
              {mode === 'goal' ? (
                <>
                  <input 
                    type="file" 
                    id="file-upload"
                    title="Choose files to upload"
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    multiple 
                    className="hidden"
                    style={{ display: 'none' }}
                  />
                  <div style={{ marginBottom: 24, textAlign: 'center' }}>
                    <div 
                      onClick={handleFileClick}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      role="button"
                      aria-label="Upload files area"
                      style={{ 
                        border: `2px dashed var(--gh-border)`, 
                        borderRadius: 16, 
                        padding: "40px 20px", 
                        background: "rgba(255,255,255,0.02)",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                        cursor: "pointer"
                      }}
                    >
                      <div style={{ fontSize: 32, opacity: 0.5 }}>📤</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Drop your files here or browse</div>
                      <div style={{ fontSize: 12, color: "var(--gh-text-secondary)" }}>Max file size up to 1 GB</div>
                    </div>
                  </div>

                  <div className="cpm-label" style={{ marginBottom: 12 }}>Uploads</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {files.map((file, i) => (
                      <div key={i} style={{ 
                        background: "var(--gh-bg)", 
                        border: `1px solid var(--gh-border)`, 
                        borderRadius: 12, 
                        padding: 12,
                        display: "flex", gap: 12, alignItems: "center"
                      }}>
                        <div style={{ 
                          width: 40, height: 40, borderRadius: 8, background: "var(--gh-bg)", 
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "var(--gh-text-secondary)" 
                        }}>
                          {file.type.toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{file.name}</div>
                          <div style={{ fontSize: 12, color: "var(--gh-text-secondary)", marginTop: 2 }}>{file.progress < 100 ? `${file.progress}%` : file.size}</div>
                          {file.progress < 100 && (
                            <div style={{ width: "100%", height: 3, background: "var(--gh-border)", borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
                              <div style={{ width: `${file.progress}%`, height: "100%", background: "var(--primary-color)" }}></div>
                            </div>
                          )}
                        </div>
                        <button 
                          title={`Remove ${file.name}`}
                          onClick={() => removeFile(i)}
                          style={{ background: "transparent", border: "none", color: "var(--gh-text-secondary)", cursor: "pointer", fontSize: 16 }}
                        >
                          {file.progress < 100 ? "✕" : "🗑"}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : showProviderSelection ? (
                <div style={{ border: "1px solid var(--gh-border)", borderRadius: 12, padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", background: "var(--gh-bg-secondary)" }}>
                  <p style={{ color: "var(--gh-text-secondary)", fontSize: 15, marginBottom: 32, textAlign: "center", fontWeight: 400 }}>
                    Select a Git provider to import an existing project from a Git Repository.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 360 }}>
                    <button onClick={() => handleConnectGithub()} style={{ width: "100%", padding: "12px", background: "#24292e", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", transition: "opacity 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.opacity="0.9"} onMouseLeave={(e)=>e.currentTarget.style.opacity="1"}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                      Continue with GitHub
                    </button>
                    <button style={{ width: "100%", padding: "12px", background: "#6b4fbb", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", transition: "opacity 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.opacity="0.9"} onMouseLeave={(e)=>e.currentTarget.style.opacity="1"}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 5.48 2h.05a.42.42 0 0 1 .4.28l2.58 7.96h7l2.58-7.96a.42.42 0 0 1 .4-.28h.05a.42.42 0 0 1 .4.28l2.44 7.51 1.22 3.78a.84.84 0 0 1-.3.94z"/></svg>
                      Continue with GitLab
                    </button>
                    <button style={{ width: "100%", padding: "12px", background: "#0052cc", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", transition: "opacity 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.opacity="0.9"} onMouseLeave={(e)=>e.currentTarget.style.opacity="1"}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.27 1.49c-.64 0-1.12.56-1.02 1.19l2.76 17.65c.08.52.53.91 1.05.91h13.88c.52 0 .97-.39 1.05-.91l2.76-17.65c.1-.63-.38-1.19-1.02-1.19H2.27zm10.74 13.9H9.79l-1.07-6.84h6.56l-1.07 6.84z"/></svg>
                      Continue with Bitbucket
                    </button>

                  </div>
                  <div style={{ marginTop: 28 }}>
                    <a href="#" style={{ color: "var(--gh-text)", fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }} onMouseEnter={(e)=>e.currentTarget.style.textDecoration="underline"} onMouseLeave={(e)=>e.currentTarget.style.textDecoration="none"}>
                      Manage Login Connections
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ position: "relative", width: 220 }}>
                      <button 
                        type="button"
                        onClick={() => setIsGitProviderDropdownOpen(!isGitProviderDropdownOpen)}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--gh-bg)", border: "1px solid var(--gh-border)", borderRadius: 6, color: "var(--gh-text)", cursor: "pointer", fontSize: 13 }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {activeGitProvider === "github" ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                          ) : (
                            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "var(--primary-color)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 8, color: "#fff", fontWeight: "bold" }}>T</span></div>
                          )}
                          <span style={{ fontWeight: 500 }}>{activeGitProvider === "github" ? (localStorage.getItem("github_username") || "somraj-dev") : "TrackCodex Workspace"}</span>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>

                      {isGitProviderDropdownOpen && (
                        <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, width: 240, background: "var(--gh-bg-secondary)", border: "1px solid var(--gh-border)", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.5)", zIndex: 100, overflow: "hidden" }}>
                          <button type="button" onClick={() => { setActiveGitProvider("github"); setIsGitProviderDropdownOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "transparent", border: "none", borderBottom: "1px solid transparent", color: "var(--gh-text)", cursor: "pointer", fontSize: 13, textAlign: "left" }} onMouseEnter={(e) => e.currentTarget.style.background="var(--bg-hover)"} onMouseLeave={(e) => e.currentTarget.style.background="transparent"}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                              <span>{localStorage.getItem("github_username") || "somraj-dev"}</span>
                            </div>
                            {activeGitProvider === "github" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
                          </button>
                          <button type="button" onClick={() => { setActiveGitProvider("trackcodex"); setIsGitProviderDropdownOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "transparent", border: "none", color: "var(--gh-text)", cursor: "pointer", fontSize: 13, textAlign: "left" }} onMouseEnter={(e) => e.currentTarget.style.background="var(--bg-hover)"} onMouseLeave={(e) => e.currentTarget.style.background="transparent"}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--primary-color)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 9, color: "#fff", fontWeight: "bold" }}>T</span></div>
                              <span>TrackCodex Workspace</span>
                            </div>
                            {activeGitProvider === "trackcodex" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
                          </button>
                          <div style={{ borderTop: "1px solid var(--gh-border)", margin: "4px 0" }}></div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setIsGitProviderDropdownOpen(false); handleConnectGithub(true); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "transparent", border: "none", color: "var(--gh-text)", cursor: "pointer", fontSize: 13, textAlign: "left" }} onMouseEnter={(e) => e.currentTarget.style.background="var(--bg-hover)"} onMouseLeave={(e) => e.currentTarget.style.background="transparent"}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            <span>Add GitHub Account</span>
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setShowProviderSelection(true); setIsGitProviderDropdownOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "transparent", border: "none", color: "var(--gh-text)", cursor: "pointer", fontSize: 13, textAlign: "left" }} onMouseEnter={(e) => e.currentTarget.style.background="var(--bg-hover)"} onMouseLeave={(e) => e.currentTarget.style.background="transparent"}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                            <span>Switch Git Provider</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, position: "relative" }}>
                      <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--gh-text-secondary)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input 
                        type="text" 
                        placeholder="Search..." 
                        value={repoSearch}
                        onChange={(e) => setRepoSearch(e.target.value)}
                        style={{ width: "100%", background: "var(--gh-bg)", border: "1px solid var(--gh-border)", borderRadius: 6, color: "var(--gh-text)", padding: "8px 12px 8px 36px", fontSize: 13, outline: "none" }}
                      />
                    </div>
                  </div>

                  <div style={{ border: "1px solid var(--gh-border)", borderRadius: 8, overflow: "hidden", marginTop: 4 }}>
                    {activeGitProvider === "github" ? (
                      isLoadingRepos ? (
                        <div style={{ padding: "32px", textAlign: "center", color: "var(--gh-text-secondary)", fontSize: 14 }}>
                          Loading repositories...
                        </div>
                      ) : githubError ? (
                        <div style={{ padding: "32px", textAlign: "center", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
                          <span style={{ color: "#ff7b72", fontSize: 14 }}>{githubError}</span>
                          <button onClick={() => handleConnectGithub()} style={{ padding: "6px 14px", background: "var(--gh-bg)", color: "var(--gh-text)", border: "1px solid var(--gh-border)", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Reconnect to GitHub</button>
                        </div>
                      ) : githubRepos.length > 0 ? (
                        githubRepos.filter(r => r.name.toLowerCase().includes(repoSearch.toLowerCase())).map((repo, idx, arr) => (
                          <div key={idx} style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: idx < arr.length - 1 ? "1px solid var(--gh-border)" : "none", background: "var(--gh-bg-secondary)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                              <div style={{width:28,height:28,borderRadius:"50%",background:"#24292e",border:"1px solid #30363d",display:"flex",alignItems:"center",justifyContent:"center"}}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                              </div>
                              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--gh-text)" }}>{repo.name}</span>
                                <span style={{ fontSize: 12, color: "var(--gh-text-secondary)", background: "transparent", border: "1px solid var(--gh-border)", padding: "0 6px", borderRadius: 12 }}>{repo.private ? "Private" : "Public"}</span>
                              </div>
                            </div>
                            <button 
                              type="button"
                              onClick={() => { setSelectedRepo({ name: repo.name, owner: repo.owner, branch: repo.branch }); setStep(3); }}
                              style={{ padding: "6px 14px", background: "var(--gh-text)", color: "var(--gh-bg)", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s ease" }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                            >
                              Import
                            </button>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: "32px", textAlign: "center", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
                          <span style={{ color: "var(--gh-text-secondary)", fontSize: 14 }}>Connect your GitHub account to import repositories.</span>
                          <button onClick={() => handleConnectGithub()} style={{ padding: "6px 14px", background: "#24292e", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Connect GitHub</button>
                        </div>
                      )
                    ) : (
                      [
                        { name: "trackcodexBeta", time: "4h ago", iconNode: <div style={{width:28,height:28,borderRadius:"50%",background:"#000",border:"1px solid #333",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="url(#bolt-grad)" stroke="currentColor" strokeWidth="1"><defs><linearGradient id="bolt-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8A2BE2"/><stop offset="100%" stopColor="#FFD700"/></linearGradient></defs><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div> },
                        { name: "trackcodex-desktop", time: "Mar 21", iconNode: <div style={{width:28,height:28,borderRadius:"50%",background:"#000",border:"1px solid #333",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="url(#bolt-grad)" stroke="currentColor" strokeWidth="1"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div> },
                        { name: "docs", time: "Mar 14", iconNode: <div style={{width:28,height:28,borderRadius:"50%",background:"#111",border:"1px solid #333",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:13,color:"#fff"}}>N</span></div> },
                        { name: "support", time: "Mar 14", iconNode: <div style={{width:28,height:28,borderRadius:"50%",background:"#111",border:"1px solid #333",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:13,color:"#fff"}}>N</span></div> },
                        { name: "Axiovital", time: "Mar 11", iconNode: <div style={{width:28,height:28,borderRadius:"50%",background:"#111",border:"1px dashed #444",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:13,color:"#666"}}>A</span></div> },
                      ].filter(r => r.name.toLowerCase().includes(repoSearch.toLowerCase())).map((repo, idx, arr) => (
                        <div key={idx} style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: idx < arr.length - 1 ? "1px solid var(--gh-border)" : "none", background: "var(--gh-bg-secondary)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            {repo.iconNode}
                            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--gh-text)" }}>{repo.name}</span>
                              <span style={{ fontSize: 13, color: "var(--gh-text-secondary)" }}>• {repo.time}</span>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => { setSelectedRepo({ name: repo.name, owner: "trackcodex", branch: "main" }); setStep(3); }}
                            style={{ padding: "6px 14px", background: "var(--gh-text)", color: "var(--gh-bg)", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s ease" }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                          >
                            Import
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && mode === 'project' && selectedRepo && (
            <>
              <div style={{ padding: "0 24px 24px" }}>
              
              {/* Repo Block */}
              <div style={{ background: "var(--gh-bg-secondary)", border: "1px solid var(--gh-border)", borderRadius: 8, padding: "16px", marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: "var(--gh-text-secondary)", marginBottom: 8 }}>Importing from GitHub</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" color="var(--gh-text)"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--gh-text)" }}>{selectedRepo.owner}/{selectedRepo.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--gh-text-secondary)", marginLeft: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
                    <span style={{ fontSize: 13, fontFamily: "monospace" }}>{selectedRepo.branch || 'main'}</span>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 14, color: "var(--gh-text)", marginBottom: 24, fontWeight: 500 }}>
                Choose where you want to create the project and give it a name.
              </div>

               {/* Vercel Team & Project Name Row */}
              <div style={{ display: "flex", gap: 16, alignItems: "flex-end", marginBottom: 24 }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <label className="cpm-label" style={{ marginBottom: 12 }}>Vercel Team</label>
                  <div 
                    onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "var(--gh-bg)", border: "1px solid var(--gh-border)", borderRadius: 6, padding: "8px 12px", cursor: "pointer", transition: "all 0.15s ease", borderColor: isTeamDropdownOpen ? "var(--gh-text)" : "var(--gh-border)" }}
                  >
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "linear-gradient(135deg, #0070F3, #F81CE5)", flexShrink: 0 }}></div>
                    <span style={{ fontSize: 14, color: "var(--gh-text)", flex: 1, fontWeight: 500 }}>{teamName}</span>
                    <span style={{ fontSize: 11, background: "var(--gh-bg-secondary)", border: "1px solid var(--gh-border)", padding: "2px 6px", borderRadius: 12, color: "var(--gh-text-secondary)", fontWeight: 500 }}>Hobby</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--gh-text-secondary)", transform: isTeamDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
                  </div>

                  {isTeamDropdownOpen && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "var(--gh-bg)", border: "1px solid var(--gh-border)", borderRadius: 8, zIndex: 5000, boxShadow: "0 10px 20px rgba(0,0,0,0.3)", overflow: "hidden", padding: 4 }}>
                      <div 
                        onClick={() => setIsTeamDropdownOpen(false)}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 6, background: "var(--bg-hover)", cursor: "pointer" }}
                      >
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg, #0070F3, #F81CE5)", flexShrink: 0 }}></div>
                        <span style={{ fontSize: 13, color: "var(--gh-text)", flex: 1, fontWeight: 500 }}>{teamName}</span>
                        <span style={{ fontSize: 11, background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: 12, color: "var(--gh-text-secondary)" }}>Hobby</span>
                      </div>
                      
                      <div style={{ height: 1, background: "var(--gh-border)", margin: "4px 0" }} />
                      
                      <div 
                        className="team-dropdown-item"
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 6, cursor: "pointer", transition: "all 0.1s" }}
                      >
                        <div style={{ width: 22, height: 22, borderRadius: "50%", border: "1px dashed var(--gh-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gh-text-secondary)" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </div>
                        <span style={{ fontSize: 13, color: "var(--gh-text)", fontWeight: 500 }}>Create a Team</span>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 24, color: "var(--gh-border)", paddingBottom: 6, fontWeight: 300 }}>/</div>
                <div style={{ flex: 1 }}>
                  <label className="cpm-label" style={{ marginBottom: 12 }}>Project Name</label>
                  <input 
                    type="text" 
                    value={projectName || selectedRepo.name} 
                    onChange={(e) => setProjectName(e.target.value)}
                    style={{ width: "100%", background: "var(--gh-bg)", border: "1px solid var(--gh-border)", borderRadius: 6, color: "var(--gh-text)", padding: "9px 12px", fontSize: 14, outline: "none", fontWeight: 500 }}
                  />
                </div>
              </div>

              {/* Application Preset */}
              <div style={{ marginBottom: 24, position: "relative" }}>
                <label className="cpm-label" style={{ marginBottom: 12 }}>Application Preset</label>
                <div 
                  onClick={() => setIsAppPresetOpen(!isAppPresetOpen)}
                  style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: "var(--gh-bg)", border: "1px solid var(--gh-border)", borderRadius: 6, padding: "8px 12px", cursor: "pointer", borderBottomLeftRadius: isAppPresetOpen ? 0 : 6, borderBottomRightRadius: isAppPresetOpen ? 0 : 6, transition: "all 0.15s ease" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 18, height: 18 }}>
                    {selectedAppPreset.icon}
                  </div>
                  <span style={{ fontSize: 14, color: "var(--gh-text)", flex: 1, fontWeight: 500 }}>{selectedAppPreset.name}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--gh-text-secondary)", transform: isAppPresetOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
                </div>

                {isAppPresetOpen && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--gh-bg)", border: "1px solid var(--gh-border)", borderTop: "none", borderBottomLeftRadius: 6, borderBottomRightRadius: 6, zIndex: 5000, maxHeight: 300, overflowY: "auto", boxShadow: "0 10px 20px rgba(0,0,0,0.3)" }}>
                    {[
                      { id: "angular", name: "Angular", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#DD0031"><path d="M12 2L20.48 4.74L19.19 18.28L12 22L4.81 18.28L3.52 4.74L12 2Z"/><path d="M12 4.4L5.8 17.6H8.2L9.4 14.8H14.6L15.8 17.6H18.2L12 4.4ZM12 7.7L13.8 12.2H10.2L12 7.7Z" fill="white"/></svg> },
                      { id: "astro", name: "Astro", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2L3 21h18L12 2z"/><path d="M12 11l-3 6h6l-3-6z" fill="currentColor"/></svg> },
                      { id: "blitz", name: "Blitz.js (Legacy)", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#673AB7"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
                      { id: "brunch", name: "Brunch", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#61D246"><path d="m18 8-3 1.5-3-1.5-3 1.5-3-1.5V2l3 1.5 3-1.5 3 1.5 3-1.5v6z"/><path d="M6 10v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10l-6 3-6-3z"/></svg> },
                      { id: "cra", name: "Create React App", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#61DAFB"><circle cx="12" cy="12" r="2"/><path d="M12 7c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5 2.24-5 5-5m0-5C5.92 2 2 4.69 2 8s3.92 6 10 6 10-2.69 10-6-3.92-6-10-6m0 12c-6.08 0-10 2.69-10 6s3.92 6 10 6 10-2.69 10-6-3.92-6-10-6"/></svg> },
                      { id: "django", name: "Django", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#092E20"><rect width="24" height="24" rx="4"/><text x="4" y="17" fill="white" fontSize="12" fontWeight="bold">dj</text></svg> },
                      { id: "vite", name: "Vite", icon: (
                        <svg width="18" height="18" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M253.513 46.3905C253.513 46.3905 186.702 11.2335 129.563 11.2335C72.424 11.2335 5.6133 46.3905 5.6133 46.3905L0 55.4335L122.95 240.233L129.563 250.318L136.176 240.233L259.126 55.4335L253.513 46.3905Z" fill="url(#vite-grad1-drop)"/>
                          <path d="M253.513 46.3905L136.176 240.233L167.318 69.3179L253.513 46.3905Z" fill="url(#vite-grad2-drop)"/>
                          <path d="M5.6133 46.3905L122.95 240.233L91.808 69.3179L5.6133 46.3905Z" fill="url(#vite-grad3-drop)"/>
                          <defs>
                            <linearGradient id="vite-grad1-drop" x1="129.563" y1="11.2335" x2="129.563" y2="250.318" gradientUnits="userSpaceOnUse"><stop stopColor="#41D1FF"/><stop offset="1" stopColor="#BD34FE"/></linearGradient>
                            <linearGradient id="vite-grad2-drop" x1="194.845" y1="46.3905" x2="194.845" y2="240.233" gradientUnits="userSpaceOnUse"><stop stopColor="#FFEA83"/><stop offset="1" stopColor="#FF7129"/></linearGradient>
                            <linearGradient id="vite-grad3-drop" x1="64.2817" y1="46.3905" x2="64.2817" y2="240.233" gradientUnits="userSpaceOnUse"><stop stopColor="#41D1FF"/><stop offset="1" stopColor="#BD34FE"/></linearGradient>
                          </defs>
                        </svg>
                      )}
                    ].map(p => (
                      <div 
                        key={p.id}
                        onClick={() => { setSelectedAppPreset(p); setIsAppPresetOpen(false); }}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", cursor: "pointer", background: selectedAppPreset.id === p.id ? "var(--bg-hover)" : "transparent", transition: "all 0.1s ease" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = selectedAppPreset.id === p.id ? "var(--bg-hover)" : "transparent"}
                      >
                         <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 18, height: 18 }}>
                           {p.icon}
                         </div>
                         <span style={{ fontSize: 13, color: "var(--gh-text)", fontWeight: 500 }}>{p.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Root Directory */}
              <div style={{ marginBottom: 24 }}>
                <label className="cpm-label" style={{ marginBottom: 12 }}>Root Directory</label>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ flex: 1, background: "var(--gh-bg-secondary)", border: "1px solid var(--gh-border)", borderRadius: 6, padding: "9px 12px", fontSize: 14, color: "var(--gh-text)", fontFamily: "monospace" }}>
                    {rootDirectory}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { setTempRootDir(rootDirectory); setIsRootDirModalOpen(true); }}
                    style={{ background: "transparent", border: "1px solid var(--gh-border)", borderRadius: 6, padding: "8px 16px", color: "var(--gh-text)", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.15s ease" }} 
                    onMouseEnter={(e) => e.currentTarget.style.background="var(--bg-hover)"} 
                    onMouseLeave={(e) => e.currentTarget.style.background="transparent"}
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Accodions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                
                {/* Build Settings Accordion */}
                <div style={{ border: "1px solid var(--gh-border)", borderRadius: 6, overflow: "hidden" }}>
                  <button 
                    type="button" 
                    onClick={() => setIsBuildSettingsOpen(!isBuildSettingsOpen)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "transparent", border: "none", padding: "12px 16px", color: "var(--gh-text)", cursor: "pointer", fontSize: 13, transition: "all 0.15s ease", fontWeight: 600 }} 
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ transform: isBuildSettingsOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><polyline points="9 18 15 12 9 6"/></svg>
                    Build and Output Settings
                  </button>

                  {isBuildSettingsOpen && (
                    <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 20 }}>
                      
                      {/* Build Command */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 13, color: "var(--gh-text-secondary)", fontWeight: 500 }}>Build Command</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--gh-text-secondary)", opacity: 0.6 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        </div>
                        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                          <input 
                            type="text" 
                            value={isBuildOverride ? buildCommand : ""} 
                            onChange={(e) => setBuildCommand(e.target.value)}
                            disabled={!isBuildOverride}
                            placeholder="`npm run build` or `vite build` "
                            style={{ width: "100%", background: "var(--gh-bg-secondary)", border: "1px solid var(--gh-border)", borderRadius: 6, padding: "10px 12px", paddingRight: 44, fontSize: 13, color: isBuildOverride ? "var(--gh-text)" : "var(--gh-text-secondary)", fontFamily: "monospace", opacity: isBuildOverride ? 1 : 0.6 }} 
                          />
                          <div 
                            onClick={() => setIsBuildOverride(!isBuildOverride)}
                            style={{ position: "absolute", right: 8, width: 32, height: 18, background: isBuildOverride ? "#fff" : "#333", borderRadius: 10, cursor: "pointer", transition: "all 0.2s" }}
                          >
                            <div style={{ width: 14, height: 14, background: isBuildOverride ? "#000" : "#fff", borderRadius: "50%", position: "absolute", top: 2, left: isBuildOverride ? 16 : 2, transition: "all 0.2s" }} />
                          </div>
                        </div>
                      </div>

                      {/* Output Directory */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 13, color: "var(--gh-text-secondary)", fontWeight: 500 }}>Output Directory</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--gh-text-secondary)", opacity: 0.6 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        </div>
                        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                          <input 
                            type="text" 
                            value={outputDirectory} 
                            disabled
                            style={{ width: "100%", background: "var(--gh-bg-secondary)", border: "1px solid var(--gh-border)", borderRadius: 6, padding: "10px 12px", fontSize: 13, color: "var(--gh-text-secondary)", fontFamily: "monospace" }} 
                          />
                          <button type="button" style={{ position: "absolute", right: 8, background: "transparent", border: "none", color: "var(--gh-text-secondary)", cursor: "pointer" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                        </div>
                      </div>

                      {/* Install Command */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 13, color: "var(--gh-text-secondary)", fontWeight: 500 }}>Install Command</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--gh-text-secondary)", opacity: 0.6 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        </div>
                        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                          <input 
                            type="text" 
                            value={isInstallOverride ? installCommand : ""} 
                            onChange={(e) => setInstallCommand(e.target.value)}
                            disabled={!isInstallOverride}
                            placeholder="`yarn install`, `pnpm install`, `npm install`, or `bun install` "
                            style={{ width: "100%", background: "var(--gh-bg-secondary)", border: "1px solid var(--gh-border)", borderRadius: 6, padding: "10px 12px", paddingRight: 44, fontSize: 13, color: isInstallOverride ? "var(--gh-text)" : "var(--gh-text-secondary)", fontFamily: "monospace", opacity: isInstallOverride ? 1 : 0.6 }} 
                          />
                          <div 
                            onClick={() => setIsInstallOverride(!isInstallOverride)}
                            style={{ position: "absolute", right: 8, width: 32, height: 18, background: isInstallOverride ? "var(--primary-color)" : "#333", borderRadius: 10, cursor: "pointer", transition: "all 0.2s" }}
                          >
                            <div style={{ width: 14, height: 14, background: "#fff", borderRadius: "50%", position: "absolute", top: 2, left: isInstallOverride ? 16 : 2, transition: "all 0.2s" }} />
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* Environment Variables Accordion */}
                <div style={{ border: "1px solid var(--gh-border)", borderRadius: 6, overflow: "hidden" }}>
                  <button 
                    type="button" 
                    onClick={() => setIsEnvVarsOpen(!isEnvVarsOpen)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "transparent", border: "none", padding: "12px 16px", color: "var(--gh-text)", cursor: "pointer", fontSize: 13, transition: "all 0.15s ease", fontWeight: 600 }} 
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ transform: isEnvVarsOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><polyline points="9 18 15 12 9 6"/></svg>
                    Environment Variables
                  </button>

                  {isEnvVarsOpen && (
                    <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 20 }}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: "var(--gh-text-secondary)", marginBottom: 8, fontWeight: 500 }}>Key</div>
                          {envVars.map((ev, i) => (
                            <input 
                              key={`k-${i}`}
                              type="text" 
                              value={ev.key} 
                              onChange={(e) => {
                                const newVars = [...envVars];
                                newVars[i].key = e.target.value;
                                setEnvVars(newVars);
                              }}
                              placeholder="EXAMPLE_KEY"
                              style={{ width: "100%", background: "transparent", border: "1px solid var(--gh-border)", borderRadius: 6, padding: "10px 12px", fontSize: 13, color: "var(--gh-text)", fontFamily: "monospace", marginBottom: 8, outline: "none" }} 
                            />
                          ))}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: "var(--gh-text-secondary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
                            Value
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.6 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                          </div>
                          {envVars.map((ev, i) => (
                            <div key={`v-row-${i}`} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                              <input 
                                type="text" 
                                value={ev.value} 
                                onChange={(e) => {
                                  const newVars = [...envVars];
                                  newVars[i].value = e.target.value;
                                  setEnvVars(newVars);
                                }}
                                placeholder="EXAMPLE_VALUE"
                                style={{ width: "100%", background: "transparent", border: "1px solid var(--gh-border)", borderRadius: 6, padding: "10px 12px", fontSize: 13, color: "var(--gh-text)", fontFamily: "monospace", outline: "none" }} 
                              />
                              <button 
                                type="button"
                                onClick={() => setEnvVars(envVars.length > 1 ? envVars.filter((_, idx) => idx !== i) : [{key: "", value: ""}])}
                                style={{ background: "transparent", border: "1px solid var(--gh-border)", borderRadius: 6, height: 38, width: 38, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gh-text-secondary)", cursor: "pointer" }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <button 
                          type="button"
                          onClick={() => setEnvVars([...envVars, { key: "", value: "" }])}
                          style={{ width: "fit-content", display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "1px solid var(--gh-border)", borderRadius: 6, padding: "8px 16px", color: "var(--gh-text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Add More
                        </button>

                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                          <button type="button" style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "1px solid var(--gh-border)", borderRadius: 6, padding: "8px 16px", color: "var(--gh-text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                            Import .env
                          </button>
                          <span style={{ fontSize: 12, color: "var(--gh-text-secondary)" }}>
                            or paste the .env contents above. <a href="#" style={{ color: "var(--primary-color)", textDecoration: "none" }}>Learn more ↗</a>
                          </span>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              </div>

              {/* Deploy Button */}
              <div style={{ marginTop: 24 }}>
                <button 
                  onClick={handleDeploy}
                  disabled={!projectName.trim() && !(selectedRepo?.name)}
                  style={{ width: "100%", background: "var(--gh-text)", color: "var(--gh-bg)", border: "none", borderRadius: 6, padding: "12px 16px", fontSize: 15, fontWeight: 600, cursor: (!projectName.trim() && !(selectedRepo?.name)) ? "not-allowed" : "pointer", transition: "all 0.1s ease", opacity: (!projectName.trim() && !(selectedRepo?.name)) ? 0.6 : 1 }}
                  onMouseEnter={(e) => { if (projectName.trim() || selectedRepo?.name) e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { if (projectName.trim() || selectedRepo?.name) e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  Deploy
                </button>
              </div>

            </div>

            {isRootDirModalOpen && (
              <div style={{ position: "fixed", inset: 0, zIndex: 6000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                <div onClick={() => setIsRootDirModalOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} />
                <div style={{ position: "relative", width: "100%", maxWidth: 500, background: "var(--gh-bg)", border: "1px solid var(--gh-border)", borderRadius: 12, boxShadow: "0 24px 48px rgba(0,0,0,0.5)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  
                  {/* Header */}
                  <div style={{ padding: "24px 24px 16px" }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 12px", color: "var(--gh-text)" }}>Root Directory</h3>
                    <p style={{ fontSize: 13, color: "var(--gh-text-secondary)", lineHeight: 1.5, margin: 0 }}>
                      Select the directory containing your source code. For monorepos, create a separate project for each directory you want to deploy.
                    </p>
                  </div>

                  {/* Repo Badge */}
                  <div style={{ padding: "0 24px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--gh-text)", fontSize: 14, fontWeight: 600 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                      {selectedRepo?.owner}/{selectedRepo?.name}
                    </div>
                  </div>

                  {/* Directory List */}
                  <div style={{ flex: 1, borderTop: "1px solid var(--gh-border)", borderBottom: "1px solid var(--gh-border)", overflowY: "auto", maxHeight: 400 }}>
                    {[
                      { name: `${selectedRepo?.name} (root)`, path: "./", level: 0, isFramework: true },
                      { name: "auth", path: "./auth", level: 1 },
                      { name: "backend", path: "./backend", level: 1 },
                      { name: "components", path: "./components", level: 1 },
                      { name: "config", path: "./config", level: 1 },
                      { name: "context", path: "./context", level: 1 },
                    ].map(dir => (
                      <div 
                        key={dir.path}
                        onClick={() => setTempRootDir(dir.path)}
                        style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: 12, 
                          padding: "12px 24px", 
                          cursor: "pointer", 
                          background: tempRootDir === dir.path ? "var(--bg-hover)" : "transparent",
                          borderLeft: tempRootDir === dir.path ? "2px solid var(--gh-text)" : "2px solid transparent",
                          transition: "all 0.1s ease",
                          paddingLeft: 24 + (dir.level * 20)
                        }}
                      >
                        <div style={{ position: "relative", width: 18, height: 18, border: "2px solid", borderColor: tempRootDir === dir.path ? "var(--gh-text)" : "var(--gh-border)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {tempRootDir === dir.path && <div style={{ width: 8, height: 8, background: "var(--gh-text)", borderRadius: "50%" }} />}
                        </div>
                        
                        {dir.level > 0 && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "var(--gh-text-secondary)" }}><polyline points="9 18 15 12 9 6"/></svg>}
                        
                        <span style={{ fontSize: 13, color: tempRootDir === dir.path ? "var(--gh-text)" : "var(--gh-text-secondary)", fontWeight: tempRootDir === dir.path ? 600 : 500, flex: 1 }}>{dir.name}</span>
                        
                        {dir.isFramework && (
                           <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 18, height: 18 }}>
                             {selectedAppPreset.icon}
                           </div>
                        )}
                        {!dir.isFramework && (
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "var(--gh-text-secondary)", opacity: 0.5 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <button 
                      onClick={() => setIsRootDirModalOpen(false)}
                      style={{ padding: "8px 24px", background: "transparent", border: "1px solid var(--gh-border)", borderRadius: 6, color: "var(--gh-text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => { setRootDirectory(tempRootDir); setIsRootDirModalOpen(false); }}
                      style={{ padding: "8px 24px", background: "var(--gh-text)", border: "none", borderRadius: 6, color: "var(--gh-bg)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                    >
                      Continue
                    </button>
                  </div>

                </div>
              </div>
            )}
          </>
        )}
        </div>

        {step !== 3 && (
          <div className="cpm-footer">
            <button onClick={handleBack} className="cpm-btn cpm-btn-secondary">{step === 1 ? "Cancel" : "Back"}</button>
            <button 
              onClick={handleNext}
              disabled={(step === 1 && !isNextEnabled)}
              className={`cpm-btn ${(mode === 'goal' && step === 2) ? 'cpm-btn-black' : 'cpm-btn-primary'}`}
            >
              {(mode === 'task' && step === 1) ? "Create Task" : (mode === 'goal' && step === 2) ? "Create Goal" : (<>Next <span style={{ fontSize: 16 }}>›</span></>)}
            </button>
          </div>
        )}
        {showProgress && !isDeployed && (
           <div style={{ position: "fixed", inset: 0, zIndex: 7000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
             <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }} />
             <div style={{ position: "relative", width: "100%", maxWidth: 640, background: "var(--gh-bg)", border: "1px solid var(--gh-border)", borderRadius: 16, boxShadow: "0 30px 60px rgba(0,0,0,0.6)", overflow: "hidden", display: "flex", flexDirection: "column", padding: 32 }}>
               
               <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                 <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--gh-text)" }}>Deployment</h2>
                 {deploymentStep < 3 && (
                   <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--gh-text-secondary)", fontSize: 13, fontWeight: 500 }}>
                     <div className="cpm-spinner" style={{ borderTopColor: "var(--gh-text)" }}></div>
                     Deployment started {deployTime}s ago...
                   </div>
                 )}
                 {deploymentStep === 3 && (
                   <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#10b981", fontSize: 14, fontWeight: 600 }}>
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                     Deployment Ready!
                   </div>
                 )}
               </div>

               <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1px solid var(--gh-border)", borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
                 {/* Step 1: Build Logs */}
                 <div style={{ padding: 16, borderBottom: "1px solid var(--gh-border)", background: deploymentStep === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: deploymentStep === 0 ? 12 : 0 }}>
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "var(--gh-text-secondary)", transform: deploymentStep >= 0 ? "rotate(90deg)" : "none" }}><polyline points="9 18 15 12 9 6"/></svg>
                     <span style={{ fontSize: 14, fontWeight: 600, color: deploymentStep >= 0 ? "var(--gh-text)" : "var(--gh-text-secondary)", flex: 1 }}>Build Logs</span>
                     {deploymentStep === 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12, color: "var(--gh-text-secondary)" }}>{deployTime}s</span>
                          <div className="cpm-spinner-small"></div>
                        </div>
                     )}
                     {deploymentStep > 0 && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                   </div>

                   {deploymentStep === 0 && (
                      <div style={{ 
                        background: "#000", 
                        borderRadius: 6, 
                        padding: 12, 
                        fontFamily: "monospace", 
                        fontSize: 11, 
                        color: "#ccc", 
                        maxHeight: 180, 
                        overflowY: "auto",
                        border: "1px solid #222",
                        lineHeight: 1.5
                      }}>
                        {buildLogs ? (
                          buildLogs.split('\n').map((line, i) => (
                            <div key={i} style={{ whiteSpace: "pre-wrap" }}>
                              <span style={{ color: "#555", marginRight: 8 }}>{i + 1}</span>
                              {line}
                            </div>
                          ))
                        ) : (
                          <div style={{ color: "#555", fontStyle: "italic" }}>Waiting for build logs...</div>
                        )}
                      </div>
                   )}
                 </div>

                 {/* Step 2: Deployment Summary */}
                 <div style={{ padding: 16, borderBottom: "1px solid var(--gh-border)", background: deploymentStep === 1 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "var(--gh-text-secondary)" }}><polyline points="9 18 15 12 9 6"/></svg>
                     <span style={{ fontSize: 14, fontWeight: 600, color: deploymentStep >= 1 ? "var(--gh-text)" : "var(--gh-text-secondary)", flex: 1 }}>Deployment Summary</span>
                     {deploymentStep === 1 && <div className="cpm-spinner-small"></div>}
                     {deploymentStep < 1 && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gh-text-secondary)" strokeWidth="2" style={{ opacity: 0.5 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                     {deploymentStep > 1 && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                   </div>
                 </div>

                 {/* Step 3: Assigning Custom Domains */}
                 <div style={{ padding: 16, background: deploymentStep === 2 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "var(--gh-text-secondary)" }}><polyline points="9 18 15 12 9 6"/></svg>
                     <span style={{ fontSize: 14, fontWeight: 600, color: deploymentStep >= 2 ? "var(--gh-text)" : "var(--gh-text-secondary)", flex: 1 }}>Assigning Custom Domains</span>
                     {deploymentStep === 2 && <div className="cpm-spinner-small"></div>}
                     {deploymentStep < 2 && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gh-text-secondary)" strokeWidth="2" style={{ opacity: 0.5 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                     {deploymentStep > 2 && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                   </div>
                 </div>
               </div>

               <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 8px", marginBottom: 32 }}>
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gh-text-secondary)" strokeWidth="2"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.28 1.15-.28 2.35 0 3.5-.73 1.02-1.08 2.25-1 3.5 0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85V22"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                 <span style={{ fontSize: 13, color: "var(--gh-text-secondary)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                   {projectName || "Deploying project..."}
                 </span>
               </div>

               <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                 <button 
                   onClick={resetAll}
                   style={{ padding: "10px 24px", background: "transparent", border: "1px solid var(--gh-border)", borderRadius: 8, color: "var(--gh-text)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                 >
                   Cancel Deployment
                 </button>
               </div>

             </div>
           </div>
        )}

        {isDeployed && (
          <div style={{ position: "fixed", inset: 0, zIndex: 7000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)" }} />
            <div style={{ 
              position: "relative", 
              width: "100%", 
              maxWidth: 680, 
              height: "92vh",
              background: "var(--gh-bg)", 
              border: "1px solid var(--gh-border)", 
              borderRadius: 20, 
              boxShadow: "0 40px 80px rgba(0,0,0,0.8)", 
              overflow: "hidden", 
              display: "flex", 
              flexDirection: "column",
              animation: "cpm-success-entry 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
            }}>
              
              <div style={{ flex: 1, overflowY: "auto", padding: "40px" }}>
                <h1 style={{ fontSize: 40, fontWeight: 800, margin: "0 0 16px", color: "var(--gh-text)", letterSpacing: "-0.02em" }}>Congratulations!</h1>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32, fontSize: 16, color: "var(--gh-text-secondary)", fontWeight: 500 }}>
                  You just deployed a new project to 
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--gh-text)", background: "var(--gh-bg-secondary)", padding: "4px 10px", borderRadius: 12, border: "1px solid var(--gh-border)" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6" }} />
                    {teamName}
                  </div>
                </div>

                {/* Plugin Section */}
                <div style={{ border: "1px solid var(--gh-border)", borderRadius: 12, padding: 24, marginBottom: 40, background: "var(--gh-bg-secondary)" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--gh-text)", flex: 1 }}>Install Coding Agent Plugin</h3>
                      <div style={{ display: "flex", gap: 12 }}>
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m7.5 4.21 4.5 2.6 4.5-2.6m-9 15.58V14.6L3 12.18V8.42l4.5 2.6m9 9.16V14.6l4.5-2.42V8.42l-4.5 2.6m-4.5 10.33V17.2m0-5.2V7.42"/></svg>
                         <div style={{ width: 1, height: 18, background: "var(--gh-border)" }} />
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gh-text-secondary)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                      </div>
                   </div>
                   <p style={{ fontSize: 14, color: "var(--gh-text-secondary)", lineHeight: 1.6, margin: "0 0 24px" }}>
                     Turn your coding agent into a Vercel expert, simply copy and run this in your terminal to install the plugin. Available for Claude and Cursor, Codex coming soon.
                   </p>
                   <div style={{ background: "#000", borderRadius: 10, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, border: "1px solid #333" }}>
                      <span style={{ color: "var(--primary-color)", fontWeight: 700, fontSize: 15 }}>$</span>
                      <code style={{ color: "#fff", flex: 1, fontFamily: "monospace", fontSize: 14 }}>npx plugins add vercel/vercel-plugin</code>
                      <button style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
                   </div>
                </div>

                <div style={{ marginBottom: 40 }}>
                   <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--gh-text)", marginBottom: 20 }}>Next Steps</h3>
                   <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                         <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--gh-bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--gh-border)" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gh-text)" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v6l4 2"/></svg>
                         </div>
                         <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--gh-text)" }}>Instant Previews</div>
                            <div style={{ fontSize: 13, color: "var(--gh-text-secondary)" }}>Push a new branch to preview changes instantly</div>
                         </div>
                      </div>

                      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                         <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--gh-bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--gh-border)" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gh-text)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                         </div>
                         <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--gh-text)" }}>Add Domain</div>
                            <div style={{ fontSize: 13, color: "var(--gh-text-secondary)" }}>Add a custom domain to your project</div>
                         </div>
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gh-text-secondary)" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                      </div>

                      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                         <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--gh-bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--gh-border)" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gh-text)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                         </div>
                         <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--gh-text)" }}>Enable Speed Insights</div>
                            <div style={{ fontSize: 13, color: "var(--gh-text-secondary)" }}>Track how users experience your site over time</div>
                         </div>
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gh-text-secondary)" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                      </div>
                   </div>
                </div>
              </div>

              <div style={{ padding: "24px 40px", borderTop: "1px solid var(--gh-border)", background: "var(--gh-bg)" }}>
                <button 
                  onClick={() => { onClose(); resetAll(); }}
                  style={{ width: "100%", padding: "16px", background: "var(--gh-text)", border: "none", borderRadius: 10, color: "var(--gh-bg)", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "transform 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.01)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                >
                  Continue to Dashboard
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
