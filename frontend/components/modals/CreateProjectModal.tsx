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
  const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);

  // Git Provider States
  const [isGitProviderDropdownOpen, setIsGitProviderDropdownOpen] = useState(false);
  const [activeGitProvider, setActiveGitProvider] = useState<"github" | "trackcodex">("github");
  const [showProviderSelection, setShowProviderSelection] = useState(false);

  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [githubError, setGithubError] = useState("");

  const loadDummyRepos = () => {
    setGithubRepos([
      { name: 'trackcodexBeta', owner: 'somraj-dev', branch: 'main', private: false },
      { name: 'docs', owner: 'somraj-dev', branch: 'main', private: false },
      { name: 'landing-page', owner: 'somraj-dev', branch: 'master', private: false },
      { name: 'api-server', owner: 'somraj-dev', branch: 'main', private: true }
    ]);
  };

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
      loadDummyRepos();
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
       } else if (!token && githubRepos.length === 0) {
          loadDummyRepos();
       }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const TEAM_OPTIONS_INITIAL = [
    { id: "personal", name: "Quantaforze", type: "Hobby", initials: "Q", color: "bg-[#1e40af]", isMember: true },
    { id: "stratahub-1", name: "Core Engineering", type: "Pro", initials: "CE", color: "bg-[#059669]", isMember: true },
    { id: "stratahub-2", name: "Frontend Platform", type: "Pro", initials: "FP", color: "bg-[#7c3aed]", isMember: false }
  ];
  const [teamOptions, setTeamOptions] = useState(TEAM_OPTIONS_INITIAL);
  const [selectedTeam, setSelectedTeam] = useState(TEAM_OPTIONS_INITIAL[0]);
  
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamPlan, setNewTeamPlan] = useState<'trial' | 'pro'>('trial');

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) return;
    const newTeam = {
      id: `stratahub-${Date.now()}`,
      name: newTeamName,
      type: newTeamPlan === 'trial' ? 'Pro Trial' : 'Pro',
      initials: newTeamName.substring(0, 2).toUpperCase(),
      color: "bg-[#0284c7]",
      isMember: true
    };
    setTeamOptions(prev => [...prev, newTeam]);
    setSelectedTeam(newTeam);
    setIsCreateTeamModalOpen(false);
    setIsTeamDropdownOpen(false);
    setNewTeamName("");
    setNewTeamPlan('trial');
  };
  
  const [isAppPresetOpen, setIsAppPresetOpen] = useState(false);
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [deploymentStep, setDeploymentStep] = useState(0); 
  const [deployTime, setDeployTime] = useState(0);
  const [isDeployed, setIsDeployed] = useState(false);
  const APP_PRESETS = [
    { id: "vite", name: "Vite", icon: <div className="w-6 h-6 flex items-center justify-center bg-gradient-to-br from-[#41D1FF] to-[#BD34FE] rounded font-bold text-[14px] text-white">⚡</div> },
    { id: "angular", name: "Angular", icon: <div className="w-5 h-5 bg-red-600 rounded-sm flex items-center justify-center font-bold text-white text-[11px]">A</div> },
    { id: "astro", name: "Astro", icon: <div className="w-5 h-5 flex items-center justify-center font-bold text-white text-[12px]">🚀</div> },
    { id: "blitz", name: "Blitz.js (Legacy)", icon: <div className="w-5 h-5 flex items-center justify-center font-bold text-[#8a2be2] text-[16px]">⚡</div> },
    { id: "brunch", name: "Brunch", icon: <div className="w-5 h-5 flex items-center justify-center font-bold text-green-500 text-[16px]">🍽️</div> },
    { id: "cra", name: "Create React App", icon: <div className="w-5 h-5 flex items-center justify-center font-bold text-blue-400 text-[16px]">⚛️</div> },
    { id: "django", name: "Django", icon: <div className="w-5 h-5 flex items-center justify-center font-bold text-green-700 text-[14px]">dj</div> }
  ];

  const [selectedAppPreset, setSelectedAppPreset] = useState(APP_PRESETS[0]);
  const [rootDirectory, setRootDirectory] = useState("./");
  const [isRootDirModalOpen, setIsRootDirModalOpen] = useState(false);
  const [tempRootDir, setTempRootDir] = useState("./");
  const [isBuildSettingsOpen, setIsBuildSettingsOpen] = useState(false);
  const [isEnvVarsOpen, setIsEnvVarsOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<{name: string, owner: string, branch: string} | null>(null);

  const [buildCommand, setBuildCommand] = useState("");
  const [outputDirectory, setOutputDirectory] = useState("");
  const [installCommand, setInstallCommand] = useState("");
  const [envVars, setEnvVars] = useState([{key: '', value: ''}]);
  
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
        {step === 1 || (step === 2 && mode === 'goal') ? (
          <div className="cpm-header flex justify-between items-center px-6 py-6 border-b border-gh-border relative">
            <div className="flex items-center gap-3">
              {step === 1 ? (
                <div className="cpm-header-icon step-1"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg></div>
              ) : (mode === 'goal' && step === 2) ? (
                <div className="cpm-header-icon step-2 flex items-center justify-center bg-gh-border rounded-lg w-10 h-10">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
              ) : (
                <div className="cpm-header-icon step-2"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg></div>
              )}
              <h2 className="text-[18px] font-bold tracking-tight">
                {step === 1 ? `Create ${modeLabel}` : (step === 2 && mode === 'goal') ? "Upload Goal Files" : step === 2 ? "Import Git Repository" : `New ${modeLabel}`}
              </h2>
            </div>
            <button 
              onClick={onClose} 
              className="cpm-close-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        ) : (
          <div className="absolute top-8 left-8 right-8 z-50 flex items-start justify-between pointer-events-none">
            {step > 1 && (
              <button 
                title="Go Back"
                onClick={handleBack} 
                className="pointer-events-auto flex items-center justify-center w-[36px] h-[36px] rounded-full bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-[#333] hover:border-[#555] text-[#A1A1AA] hover:text-white transition-all cursor-pointer shadow-lg group"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:-translate-x-0.5 transition-transform"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              </button>
            )}
            <button title="Close" onClick={onClose} className="pointer-events-auto text-[#666] hover:text-white transition-colors cursor-pointer bg-transparent border-none ml-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        )}

        <div className="cpm-body no-scrollbar" style={{ padding: (step === 3 || (step === 2 && mode !== 'goal')) ? '0' : '24px 24px 0', paddingBottom: (step === 3 || (step === 2 && mode !== 'goal')) ? '0' : (showDatePicker ? '320px' : (isGitProviderDropdownOpen ? '100px' : '0')), transition: 'padding 0.2s', backgroundColor: (step === 3 || (step === 2 && mode !== 'goal')) ? '#0a0a0a' : 'transparent' }}>
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
                    onClick={() => setShowDatePicker(!showDatePicker)}
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
                        <div role="grid" aria-label="Select date">
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
            <>
              {mode === 'goal' ? (
                <div className="px-6 pb-6">
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
                </div>
              ) : (
                <div className="p-10 bg-[#0a0a0a] min-h-[600px] text-left">
                  <h1 className="text-[32px] font-bold text-white tracking-tight mb-8">Import Git Repository</h1>
                  
                  {showProviderSelection ? (
                    <div className="max-w-[500px] mx-auto border border-[#333] bg-[#111] rounded-xl p-10 flex flex-col items-center">
                      <p className="text-[15px] font-medium text-[#A1A1AA] mb-8 text-center px-4">Select a Git provider to import an existing project from a Git Repository.</p>
                      
                      <div className="w-full space-y-3">
                         <button onClick={() => handleConnectGithub()} className="w-full flex items-center justify-center gap-3 bg-[#24292e] hover:bg-[#2f363d] text-white rounded-md py-3 text-[14px] font-bold transition-colors border border-[#3c444c] shadow-sm">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"></path>
                            </svg>
                            Continue with GitHub
                         </button>
                         <button className="w-full flex items-center justify-center gap-3 bg-[#6b4fbb] hover:bg-[#795ccf] text-white rounded-md py-3 text-[14px] font-bold transition-colors shadow-sm">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                              <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51a1.05 1.05 0 0 1 2 0l2.44 7.51h4.3l2.44-7.51a1.05 1.05 0 0 1 2 0l2.44 7.51 1.22 3.78a.84.84 0 0 1-.3.94z"/>
                            </svg>
                            Continue with GitLab
                         </button>
                         <button className="w-full flex items-center justify-center gap-3 bg-[#0052cc] hover:bg-[#0065ff] text-white rounded-md py-3 text-[14px] font-bold transition-colors shadow-sm">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M1.32 1.9A1 1 0 0 0 .34 3.03l3.55 18a1 1 0 0 0 .98.8h14.26a1 1 0 0 0 .98-.81l3.55-18A1 1 0 0 0 22.68 1.9H1.32zM15 14.7H9.1l-1.3-8.8h8.4l-1.2 8.8z"/>
                            </svg>
                            Continue with Bitbucket
                         </button>
                      </div>
                      
                      <button className="mt-8 text-[14px] font-semibold text-white hover:underline flex items-center gap-2">
                        Manage Login Connections
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6 max-w-[900px]">
                      <div className="flex items-center gap-4 pb-6">
                        <div className="relative w-[280px]">
                          <button onClick={() => setIsGitProviderDropdownOpen(!isGitProviderDropdownOpen)} className={`w-full flex items-center justify-between text-white transition-colors border rounded-md px-3.5 py-2.5 h-12 ${isGitProviderDropdownOpen ? 'bg-[#111] border-[#555]' : 'bg-[#000] border-[#333] hover:border-[#555]'}`}>
                             <div className="flex items-center gap-3">
                               <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"></path></svg>
                               <span className="text-[14px] font-medium">{localStorage.getItem("github_username") || "somraj-dev"}</span>
                             </div>
                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" className={`transition-transform duration-200 ${isGitProviderDropdownOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
                          </button>
                          
                          {isGitProviderDropdownOpen && (
                            <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-[#0a0a0a] border border-[#333] rounded-md shadow-2xl z-50 overflow-hidden">
                              <div className="p-1.5 flex flex-col gap-0.5">
                                <button onClick={() => setIsGitProviderDropdownOpen(false)} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#1a1a1a] rounded text-white text-[15px] transition-colors">
                                   <div className="flex items-center gap-3">
                                     <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"></path></svg>
                                     <span className="font-medium">{localStorage.getItem("github_username") || "somraj-dev"}</span>
                                   </div>
                                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                                </button>
                                <div className="h-[1px] bg-[#222] my-1 mx-2" />
                                <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#1a1a1a] rounded text-[#A1A1AA] hover:text-white transition-colors text-[15px]">
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                  <span className="font-medium">Add GitHub Account</span>
                                </button>
                                <button onClick={() => { setShowProviderSelection(true); setIsGitProviderDropdownOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#1a1a1a] rounded text-[#A1A1AA] hover:text-white transition-colors text-[15px]">
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                                  <span className="font-medium">Switch Git Provider</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 relative">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" className="absolute left-4 top-1/2 -translate-y-1/2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                          <input type="text" placeholder="Search..." className="w-full h-12 bg-[#000] border border-[#333] rounded-md pl-[42px] pr-4 text-[14px] text-white outline-none focus:border-[#555] transition-colors" value={repoSearch} onChange={(e) => setRepoSearch(e.target.value)} />
                        </div>
                      </div>
                      
                      <div className="border border-[#333] rounded-md overflow-hidden bg-[#0A0A0A]">
                        {isLoadingRepos ? <div className="p-10 text-center text-[#888] text-[14px]">Loading repositories...</div> : 
                          githubRepos.filter(r => r.name.toLowerCase().includes(repoSearch.toLowerCase())).map((repo, idx) => {
                            const isVite = idx === 0 || idx === 1;
                            const isNext = idx === 2 || idx === 3;
                            return (
                          <div key={idx} className="flex items-center justify-between p-5 py-4 border-b border-[#333] hover:bg-[#111] transition-colors last:border-b-0">
                            <div className="flex items-center gap-5">
                              <div className={`w-9 h-9 flex items-center justify-center rounded-full text-[15px] font-black border tracking-tighter ${isVite ? 'bg-gradient-to-br from-[#41D1FF] to-[#BD34FE] border-[#333]' : isNext ? 'bg-black text-white border-[#555]' : 'bg-[#1a1a1a] text-[#888] border-[#333]'}`}>
                                {isVite ? '⚡' : isNext ? 'N' : repo.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex items-baseline gap-2">
                                 <span className="text-[15px] font-bold text-white tracking-wide">{repo.name}</span>
                                 <span className="text-[14px] font-medium text-[#888]">· {idx % 2 === 0 ? "4h ago" : "Mar 14"}</span>
                              </div>
                            </div>
                            <button onClick={() => { setSelectedRepo({ name: repo.name, owner: repo.owner, branch: repo.branch }); setStep(3); }} className="bg-[#EDEDED] hover:bg-white text-black font-bold text-[14px] px-5 py-1.5 rounded transition-colors">
                              Import
                            </button>
                          </div>
                          )})}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {step === 3 && selectedRepo && (
            <div className="p-10 bg-[#0a0a0a] min-h-[600px] text-left">
              <h1 className="text-[32px] font-bold text-white tracking-tight mb-8">New Project</h1>
              
              <div className="bg-[#111] border border-[#333] rounded-xl p-5 mb-10">
                <div className="text-[14px] text-[#A1A1AA] mb-4">Importing from GitHub</div>
                <div className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                     <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"></path>
                  </svg>
                  <span className="text-[15px] font-bold text-white tracking-wide">{selectedRepo.owner}/{selectedRepo.name}</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2" className="ml-3"><path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9"/></svg>
                  <span className="text-[14px] font-mono text-[#A1A1AA]">{selectedRepo.branch || 'main'}</span>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-[15px] text-white">Choose where you want to create the project and give it a name.</p>
                
                <div className="flex items-end gap-3 pb-8 border-b border-[#333] relative z-40">
                  <div className="w-[300px]">
                    <label className="block text-[14px] text-[#A1A1AA] mb-3">TrackCodex Team</label>
                    <div className="relative">
                      <button onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)} className={`w-full flex items-center justify-between text-white transition-colors border rounded-md px-3.5 py-2.5 h-12 ${isTeamDropdownOpen ? 'bg-[#111] border-[#555]' : 'bg-[#000] border-[#333] hover:border-[#555]'}`}>
                        <div className="flex items-center gap-3">
                           {isTeamDropdownOpen ? null : <div className={`w-7 h-7 flex-shrink-0 rounded-full text-white flex items-center justify-center text-[12px] font-bold ${selectedTeam.color}`}>{selectedTeam.initials}</div>}
                           <span className="text-[14px] font-medium w-full text-left truncate">{isTeamDropdownOpen ? <input className="bg-transparent border-none outline-none text-white w-full pointer-events-auto" autoFocus defaultValue={selectedTeam.name} /> : selectedTeam.name}</span>
                           {isTeamDropdownOpen ? null : selectedTeam.type.includes('Pro') ? (
                             <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#2a1700] to-[#1a0f00] border border-[#4d2f00] flex-shrink-0 text-[#eab308] ml-1">
                               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
                               <span className="text-[10px] font-bold uppercase tracking-wider">{selectedTeam.type}</span>
                             </span>
                           ) : (
                             <span className="text-[10px] bg-[#1a1a1a] text-[#fff] px-2 py-0.5 rounded-full border border-[#333] font-medium ml-1 flex-shrink-0 uppercase tracking-wider">{selectedTeam.type}</span>
                           )}
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2" className={`transition-transform ${isTeamDropdownOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                      
                      {isTeamDropdownOpen && (
                        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-[#111] border border-[#333] rounded-md shadow-2xl z-50 overflow-hidden">
                          <div className="p-1.5 flex flex-col gap-0.5">
                            {teamOptions.map((team) => (
                              <button 
                                key={team.id} 
                                disabled={!team.isMember}
                                title={!team.isMember ? "You must be a member of this team to deploy to it" : ""}
                                onClick={() => { setSelectedTeam(team); setIsTeamDropdownOpen(false); }} 
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-[15px] transition-colors ${!team.isMember ? 'opacity-50 cursor-not-allowed' : selectedTeam.id === team.id ? 'bg-[#222] text-white' : 'hover:bg-[#1a1a1a] text-white'}`}
                              >
                                 <div className="flex items-center gap-3">
                                   <div className={`w-7 h-7 flex-shrink-0 rounded-full text-white flex items-center justify-center text-[12px] font-bold ${team.isMember ? team.color : 'bg-[#444]'}`}>{team.initials}</div>
                                   <div className="flex items-center gap-2">
                                     <span className="font-medium text-left truncate">{team.name}</span>
                                     {!team.isMember && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2" className="flex-shrink-0"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                                   </div>
                                 </div>
                                 {team.type.includes('Pro') ? (
                                   <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#2a1700] to-[#1a0f00] border border-[#4d2f00] flex-shrink-0 text-[#eab308] ml-2">
                                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
                                     <span className="text-[10px] font-bold uppercase tracking-wider">{team.type}</span>
                                   </span>
                                 ) : (
                                   <span className="text-[10px] bg-[#1a1a1a] text-[#A1A1AA] px-2 py-0.5 rounded-full border border-[#333] font-bold flex-shrink-0 uppercase tracking-wider ml-2">{team.type}</span>
                                 )}
                              </button>
                            ))}
                            <div className="h-[1px] bg-[#333] my-1 mx-2" />
                            <button onClick={() => { setIsCreateTeamModalOpen(true); setIsTeamDropdownOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#222] rounded text-[#A1A1AA] hover:text-white transition-colors text-[14px]">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                              <span className="font-medium">Create a Team</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-[#333] text-[28px] font-light px-2 h-[42px] leading-[42px]">/</div>
                  <div className="flex-1 relative z-0">
                    <label className="block text-[14px] text-[#A1A1AA] mb-3" htmlFor="import-name">Project Name</label>
                    <input id="import-name" className="w-full h-12 bg-[#000] border border-[#333] rounded-md px-3.5 py-2.5 text-[14px] font-medium text-white outline-none focus:border-white transition-colors" value={projectName || selectedRepo.name} onChange={(e) => setProjectName(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-6 pt-2">
                  <div className="relative z-30">
                    <label className="block text-[14px] text-[#A1A1AA] mb-3">Application Preset</label>
                    <button onClick={() => setIsPresetDropdownOpen(!isPresetDropdownOpen)} className={`w-full flex items-center justify-between transition-colors border rounded-md px-3.5 py-2.5 h-12 text-white ${isPresetDropdownOpen ? 'bg-[#111] border-[#555]' : 'bg-[#000] border-[#333] hover:border-[#555]'}`}>
                      <div className="flex items-center gap-3">
                        {isPresetDropdownOpen ? null : selectedAppPreset.icon}
                        <span className="text-[14px] font-medium">{isPresetDropdownOpen ? <input className="bg-transparent border-none outline-none text-white w-full pointer-events-auto" autoFocus defaultValue={selectedAppPreset.name} /> : selectedAppPreset.name}</span>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2" className={`transition-transform ${isPresetDropdownOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    
                    {isPresetDropdownOpen && (
                      <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-[#0a0a0a] border border-[#333] rounded-md shadow-2xl z-50 max-h-[300px] overflow-y-auto">
                        <div className="p-1.5 flex flex-col gap-0.5 relative">
                          {APP_PRESETS.map((preset) => (
                            <button key={preset.id} onClick={() => { setSelectedAppPreset(preset); setIsPresetDropdownOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#1a1a1a] rounded text-white text-[14px] font-medium transition-colors">
                              {preset.icon}
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[14px] text-[#A1A1AA] mb-3">Root Directory</label>
                    <div className="relative">
                      <input readOnly value={rootDirectory} className="w-full bg-[#000] border border-[#333] rounded-md px-3.5 py-2.5 text-[14px] text-white font-mono outline-none pr-20" />
                      <button onClick={() => setIsRootDirModalOpen(true)} className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-[#111] hover:bg-white hover:text-black text-white border border-[#333] rounded transition-colors text-[13px] font-bold">Edit</button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4">
                    <div className="border border-[#333] rounded-md overflow-hidden bg-[#0A0A0A]">
                      <button 
                        onClick={() => setIsBuildSettingsOpen(!isBuildSettingsOpen)} 
                        className="w-full flex items-center justify-between p-4 hover:bg-[#111] transition-colors text-left"
                      >
                         <div className="flex items-center gap-3">
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2.5" className={`transition-transform ${isBuildSettingsOpen ? 'rotate-90' : ''}`}><polyline points="9 18 15 12 9 6"/></svg>
                           <span className="text-[14px] font-medium text-[#A1A1AA]">Build and Output Settings</span>
                         </div>
                      </button>
                      {isBuildSettingsOpen && (
                        <div className="p-5 pt-2 space-y-6 bg-[#0A0A0A]">
                           <div>
                             <label className="flex items-center gap-2 text-[14px] text-[#A1A1AA] mb-3">
                               Build Command
                               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                             </label>
                             <div className="relative flex items-center bg-[#111] border border-[#333] rounded-md focus-within:border-[#555] transition-colors overflow-hidden">
                               <input className="w-full bg-transparent py-3.5 px-4 text-[14px] font-mono text-[#A1A1AA] outline-none" placeholder="`npm run build` or `vite build`" value={buildCommand} onChange={(e) => setBuildCommand(e.target.value)} />
                               <div className="pr-3">
                                 <div className="w-10 h-6 bg-[#333] rounded-full flex items-center p-1 cursor-pointer">
                                   <div className="w-4 h-4 rounded-full bg-white ml-auto" />
                                 </div>
                               </div>
                             </div>
                           </div>
                           
                           <div>
                             <label className="flex items-center gap-2 text-[14px] text-[#A1A1AA] mb-3">
                               Output Directory
                               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                             </label>
                             <div className="relative flex items-center bg-[#111] border border-[#333] rounded-md focus-within:border-[#555] transition-colors overflow-hidden">
                               <input className="w-full bg-transparent py-3.5 px-4 text-[14px] font-mono text-[#A1A1AA] outline-none" placeholder="frontend/dist" value={outputDirectory} onChange={(e) => setOutputDirectory(e.target.value)} />
                               <div className="pr-3">
                                 <div className="w-10 h-6 border border-[#444] rounded-full flex items-center p-1 cursor-pointer relative bg-transparent">
                                   <div className="w-4 h-4 flex items-center justify-center absolute right-[3px]">
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                   </div>
                                 </div>
                               </div>
                             </div>
                           </div>

                           <div>
                             <label className="flex items-center gap-2 text-[14px] text-[#A1A1AA] mb-3">
                               Install Command
                               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                             </label>
                             <div className="relative flex items-center bg-[#111] border border-[#333] rounded-md focus-within:border-[#555] transition-colors overflow-hidden">
                               <input className="w-full bg-transparent py-3.5 px-4 text-[14px] font-mono text-[#A1A1AA] outline-none" placeholder="`yarn install`, `pnpm install`, `npm install`, or `bun install`" value={installCommand} onChange={(e) => setInstallCommand(e.target.value)} />
                               <div className="pr-3">
                                 <div className="w-10 h-6 bg-[#333] rounded-full flex items-center p-1 cursor-pointer">
                                   <div className="w-4 h-4 rounded-full bg-white ml-auto" />
                                 </div>
                               </div>
                             </div>
                           </div>
                        </div>
                      )}
                    </div>

                    <div className="border border-[#333] rounded-md overflow-hidden bg-[#0A0A0A]">
                      <button 
                        onClick={() => setIsEnvVarsOpen(!isEnvVarsOpen)} 
                        className="w-full flex items-center justify-between p-4 hover:bg-[#111] transition-colors text-left"
                      >
                         <div className="flex items-center gap-3">
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2.5" className={`transition-transform ${isEnvVarsOpen ? 'rotate-90' : ''}`}><polyline points="9 18 15 12 9 6"/></svg>
                           <span className="text-[14px] font-medium text-[#A1A1AA]">Environment Variables</span>
                         </div>
                      </button>
                      {isEnvVarsOpen && (
                        <div className="p-5 pt-3 space-y-4 bg-[#0A0A0A]">
                           <div className="flex items-center gap-3">
                              <div className="w-[48%] text-[13px] text-[#A1A1AA] font-normal">Key</div>
                              <div className="w-[52%] flex items-center gap-2 text-[13px] text-[#A1A1AA] font-normal">Value <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></div>
                           </div>
                           
                           {envVars.map((env, i) => (
                             <div key={i} className="flex gap-2">
                               <input className="w-[45%] bg-[#0A0A0A] border border-[#333] rounded-md py-3 px-4 text-[14px] text-white outline-none focus:border-[#555] font-mono" placeholder="EXAMPLE_NAME" value={env.key} onChange={(e) => { const newEnv = [...envVars]; newEnv[i].key = e.target.value; setEnvVars(newEnv); }} />
                               <input className="w-[45%] bg-[#0A0A0A] border border-[#333] rounded-md py-3 px-4 text-[14px] text-[#A1A1AA] outline-none focus:border-[#555] font-mono" placeholder="I9JU23NF394R6HH" value={env.value} onChange={(e) => { const newEnv = [...envVars]; newEnv[i].value = e.target.value; setEnvVars(newEnv); }} />
                               <div className="w-[10%] flex items-center justify-end">
                                 <button title="Remove Environment Variable" aria-label="Remove Environment Variable" onClick={() => setEnvVars(envVars.filter((_, idx) => idx !== i))} className="w-[46px] h-[46px] border border-[#333] rounded-md flex items-center justify-center text-white hover:bg-[#111] transition-colors">
                                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="12" x2="20" y2="12"/></svg>
                                 </button>
                               </div>
                             </div>
                           ))}

                           <div className="pt-1 flex flex-col gap-4">
                             <button onClick={() => setEnvVars([...envVars, {key: '', value: ''}])} className="flex items-center gap-2 bg-[#000] border border-[#333] hover:bg-[#111] px-4 py-2.5 rounded-md text-[14px] font-medium text-white transition-colors self-start">
                               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                               Add More
                             </button>

                             <div className="flex items-center gap-3 pt-2 text-[14px] text-[#A1A1AA]">
                               <button className="flex items-center gap-2 bg-[#000] border border-[#333] hover:bg-[#111] px-4 py-2.5 rounded-md text-[14px] font-medium text-white transition-colors">
                                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                 Import .env
                               </button>
                               <span>or paste the .env contents above. <a href="#" className="text-[#3b82f6] hover:underline inline-flex items-center gap-1">Learn more <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a></span>
                             </div>
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-8 mb-4">
                  <button onClick={handleDeploy} className="w-full bg-[#EDEDED] hover:bg-white text-black py-3 rounded-md text-[15px] font-bold transition-colors">Deploy</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {(step === 1 || (step === 2 && mode === 'goal')) && (
          <div className="cpm-footer">
            <button onClick={handleBack} className="cpm-btn cpm-btn-secondary">{step === 1 ? "Cancel" : "Back"}</button>
            <button 
              onClick={handleNext} 
              disabled={(step === 1 && !isNextEnabled) || (step === 2 && mode === 'project' && !selectedRepo)} 
              className="cpm-btn cpm-btn-primary"
            >
              {step === 2 && mode === 'goal' ? "Deploy" : "Next"} <span className="ml-1" aria-hidden="true">›</span>
            </button>
          </div>
        )}

        {isRootDirModalOpen && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-5">
            <div onClick={() => setIsRootDirModalOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
            <div className="relative w-full max-w-[540px] bg-[#000] border border-[#333] rounded-xl shadow-2xl overflow-hidden flex flex-col text-left">
              <div className="p-8 pb-6">
                <h3 className="text-[24px] font-bold mb-4 text-white tracking-tight">Root Directory</h3>
                <p className="text-[14px] text-[#A1A1AA] leading-relaxed mb-6">Select the directory containing your source code. For monorepos, create a separate project for each directory you want to deploy.</p>
                <div className="flex items-center gap-3 text-white font-semibold text-[15px] px-1">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                     <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"></path>
                   </svg>
                   {selectedRepo?.name || "trackcodex-desktop"}
                </div>
              </div>
              <div className="flex-1 border-t border-[#333] overflow-y-auto max-h-[350px]">
                <div onClick={() => { setRootDirectory("./ (root)"); setIsRootDirModalOpen(false); }} className={`flex items-center justify-between p-4 px-8 cursor-pointer border-b border-[#333] text-[14px] ${rootDirectory === "./ (root)" ? 'bg-[#1a1a1a] text-white' : 'hover:bg-[#111] text-[#A1A1AA] hover:text-white'}`}>
                  <div className="flex items-center gap-4 font-semibold text-[14px]">
                    <div className="w-4 h-4 rounded-full border border-[white] flex items-center justify-center">
                       {rootDirectory === "./ (root)" && <div className="w-2 h-2 rounded-full bg-white"/>}
                    </div>
                    <span>{selectedRepo?.name || "trackcodex-desktop"} <span className="font-normal text-[#888] ml-1">(root)</span></span>
                  </div>
                  <div className="w-6 h-6 flex items-center justify-center bg-gradient-to-br from-[#41D1FF] to-[#BD34FE] rounded text-[12px] font-bold text-white border border-[#333]">⚡</div>
                </div>
                {["auth", "backend", "components", "config", "context"].map(dir => (
                  <div key={dir} onClick={() => { setRootDirectory(`./${dir}`); setIsRootDirModalOpen(false); }} className="flex items-center justify-between p-4 px-8 hover:bg-[#111] cursor-pointer border-b border-[#333] text-[14px] text-[#A1A1AA] hover:text-white transition-colors">
                     <div className="flex items-center gap-4">
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                       <div className="w-4 h-4 rounded-full border border-[#555] flex items-center justify-center">
                          {rootDirectory === `./${dir}` && <div className="w-2 h-2 rounded-full bg-white"/>}
                       </div>
                       <span className="font-semibold text-[14px] text-white">{dir}</span>
                     </div>
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  </div>
                ))}
              </div>
              <div className="p-4 px-6 bg-[#000] border-t border-[#333] flex justify-between">
                <button onClick={() => setIsRootDirModalOpen(false)} className="bg-transparent hover:bg-[#111] text-white font-medium px-5 py-2.5 rounded-md border border-[#333] text-[14px] transition-colors">Cancel</button>
                <button onClick={() => setIsRootDirModalOpen(false)} className="bg-white hover:bg-[#eee] text-black font-semibold px-5 py-2.5 rounded-md text-[14px] transition-colors">Continue</button>
              </div>
            </div>
          </div>
        )}

        {isCreateTeamModalOpen && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-5">
            <div onClick={() => setIsCreateTeamModalOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
            <div className="relative w-full max-w-[500px] bg-[#000] border border-[#333] rounded-xl shadow-2xl overflow-hidden flex flex-col text-left">
              <div className="p-8 pb-6 border-b border-[#333]">
                <h3 className="text-[24px] font-bold text-white tracking-tight -mt-1">Create Team</h3>
                
                <div className="mt-8 space-y-2">
                  <label className="block text-[14px] text-[#A1A1AA] font-medium">Team Name</label>
                  <input 
                    autoFocus 
                    value={newTeamName} 
                    onChange={e => setNewTeamName(e.target.value)} 
                    placeholder="my-team" 
                    className="w-full bg-[#000] border border-[#0070F3] ring-1 ring-[#0070F3] rounded-md py-3.5 px-4 text-[15px] text-white outline-none font-mono" 
                  />
                </div>

                <div className="mt-8 flex gap-4">
                  <button onClick={() => setNewTeamPlan('trial')} className={`flex-1 p-5 rounded-lg border text-left transition-colors relative ${newTeamPlan === 'trial' ? 'border-[#888] bg-[#111]' : 'border-[#333] hover:border-[#555] bg-[#000]'}`}>
                    <div className="text-[15px] font-bold text-white mb-2">Pro Trial</div>
                    <div className="text-[14px] text-[#A1A1AA]">Free for two weeks</div>
                    <div className={`absolute top-5 right-5 w-5 h-5 rounded-full border flex items-center justify-center ${newTeamPlan === 'trial' ? 'border-[#0070F3] bg-[#0070F3]' : 'border-[#333]'}`}>
                      {newTeamPlan === 'trial' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                  </button>

                  <button onClick={() => setNewTeamPlan('pro')} className={`flex-1 p-5 rounded-lg border text-left transition-colors relative ${newTeamPlan === 'pro' ? 'border-[#888] bg-[#111]' : 'border-[#333] hover:border-[#555] bg-[#000]'}`}>
                    <div className="text-[15px] font-bold text-white mb-2">Pro</div>
                    <div className="text-[14px] text-[#A1A1AA]">Get started now</div>
                    <div className={`absolute top-5 right-5 w-5 h-5 rounded-full border ${newTeamPlan === 'pro' ? 'border-[#0070F3] bg-[#0070F3]' : 'border-[#333]'}`}>
                       <div className="w-full h-full flex items-center justify-center">
                         {newTeamPlan === 'pro' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                       </div>
                    </div>
                  </button>
                </div>

                {newTeamPlan === 'trial' && (
                  <div className="mt-8 flex items-center gap-3 text-[14px] font-medium text-white bg-transparent rounded-lg pb-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    Continuing will start a 14-day Pro plan trial.
                  </div>
                )}
              </div>

              <div className="bg-[#0A0A0A] border-t-0 p-5 flex justify-between items-center bg-[#000]">
                <button onClick={() => setIsCreateTeamModalOpen(false)} className="px-5 py-2.5 rounded-md text-[14px] font-medium text-white bg-transparent border border-[#333] hover:bg-[#111] transition-colors">Cancel</button>
                <button 
                  onClick={handleCreateTeam} 
                  disabled={!newTeamName.trim()} 
                  className={`px-5 py-2.5 rounded-md text-[14px] font-bold transition-colors ${newTeamName.trim() ? 'bg-white text-black hover:bg-[#eaeaea]' : 'bg-[#333] text-[#888] cursor-not-allowed'}`}
                >
                  Continue
                </button>
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
