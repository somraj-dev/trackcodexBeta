import React, { useState, useRef } from "react";
import { Project } from "../../types/project";
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
  onDeploy: (p: Project) => void;
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
  const [appPreset, setAppPreset] = useState("Other");
  const [rootDirectory, setRootDirectory] = useState("./");
  const [isBuildSettingsOpen, setIsBuildSettingsOpen] = useState(false);
  const [isEnvVarsOpen, setIsEnvVarsOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<{name: string, owner: string, branch: string} | null>(null);
  const [isRootDirModalOpen, setIsRootDirModalOpen] = useState(false);

  const isNextEnabled = projectName.trim() !== "" && endDate !== "";

  const handleDateSave = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatted = `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
    setEndDate(formatted);
    setShowDatePicker(false);
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

  const handleDeploy = () => {
    const name = projectName || selectedRepo?.name || "new-project";
    const repoOwner = selectedRepo?.owner || "somraj-dev";
    const repoName = selectedRepo?.name || "unknown";
    const branch = selectedRepo?.branch || "main";

    const newProject: Project = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name: name,
      domain: `${name.toLowerCase().replace(/\s+/g, '-')}.trackcodex.com`,
      logo: selectedIcon === "rocket" ? "🚀" : selectedIcon === "flag" ? "🚩" : selectedIcon === "star" ? "⭐" : selectedIcon === "bolt" ? "⚡" : "⬡",
      logoBg: V.bg,
      repoOwner: repoOwner,
      repoName: repoName,
      repoUrl: `https://github.com/${repoOwner}/${repoName}`,
      commitMsg: `feat: Initial deployment via TrackCodex deploy pipeline`,
      deployDate: "Just now",
      branch: branch
    };

    onDeploy(newProject);
    onClose();
    setStep(1);
    setProjectName("");
    setEndDate("");
    setSelectedRepo(null);
    setSelectedIcon("rocket");
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
                    <label key={opt.id} className={`cpm-radio-item ${progress === opt.id ? 'selected' : ''}`}>
                      <div onClick={() => setProgress(opt.id)} className="cpm-radio-circle">
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
              ) : (
                <>
                  <div className="cpm-label" style={{ marginBottom: 16 }}>Import Git Repository</div>
                  <div style={{ border: `1px solid var(--gh-border)`, borderRadius: 12, padding: 32, textAlign: "center", color: "var(--gh-text-secondary)", fontSize: 14, background: "var(--gh-bg)" }}>
                    Git Repository Integration Placeholder...
                  </div>
                </>
              )}
            </div>
          )}

          {step === 3 && mode === 'project' && (
            <div style={{ padding: "0 24px 24px" }}>
              <div className="cpm-label" style={{ marginBottom: 16 }}>Configure Project Settings</div>
              {/* ... Step 3 content ... */}
            </div>
          )}
        </div>

        <div className="cpm-footer">
          <button onClick={handleBack} className="cpm-btn cpm-btn-secondary">{step === 1 ? "Cancel" : "Back"}</button>
          <button 
            onClick={handleNext}
            disabled={(step === 1 && !isNextEnabled)}
            className={`cpm-btn ${(mode === 'goal' && step === 2) || (step === 3) ? 'cpm-btn-black' : 'cpm-btn-primary'}`}
          >
            {(mode === 'task' && step === 1) ? "Create Task" : (mode === 'goal' && step === 2) ? "Create Goal" : step === 3 ? "Deploy" : (<>Next <span style={{ fontSize: 16 }}>›</span></>)}
          </button>
        </div>
      </div>
    </div>
  );
};
