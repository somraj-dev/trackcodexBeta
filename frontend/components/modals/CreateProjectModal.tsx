import React, { useState, useRef } from "react";
import { Project } from "../../types/project";

const V = {
  bg: "#000",
  card: "#0a0a0a",
  cardHover: "#111",
  border: "#333",
  borderLight: "#222",
  text: "#ededed",
  textSecondary: "#888",
  textTertiary: "#666",
  accent: "#0070f3",
  green: "#0070f3",
  font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
      logoBg: "#111",
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
    <div style={{ position: "fixed", inset: 0, zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      <div style={{ 
        position: "relative", width: "100%", maxWidth: 500, background: "#0D0D0D", 
        border: `1px solid #1A1A1A`, borderRadius: 16, display: "flex", flexDirection: "column",
        boxShadow: "0 24px 48px rgba(0,0,0,0.5)", overflow: "hidden", fontFamily: V.font
      }}>
        <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1A1A1A" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1A1A1A", border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center", color: V.accent }}>
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
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#fff" }}>
              {step === 1 ? `Create ${modeLabel}` : (step === 2 && mode === 'goal') ? "Upload Goal Files" : step === 2 ? "Import Git Repository" : `New ${modeLabel}`}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: V.textTertiary, cursor: "pointer", padding: 4 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        </div>

        <div className="no-scrollbar" style={{ padding: "24px 24px 0", flex: 1, overflowY: "auto", maxHeight: "70vh" }}>
          {step === 1 && (
            <>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: projectName ? V.textSecondary : "#FF5555", marginBottom: 8, transition: "color .2s" }}>{modeLabel} name *</label>
                <input 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Launch marketing site"
                  style={{ width: "100%", height: 44, padding: "0 14px", background: "#050505", border: `1px solid ${projectName ? "#333" : "#222"}`, borderRadius: 10, color: "#fff", fontSize: 14, outline: "none", transition: "border-color .2s" }}
                />
              </div>

              <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: V.textSecondary, marginBottom: 8 }}>{mode === 'goal' ? 'Goal Type' : 'Assign'}</label>
                  <div 
                    onClick={() => setIsAssignModalOpen(true)}
                    style={{ height: 44, padding: "0 14px", background: "#050505", border: "1px solid #222", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>Y</div>
                      <span style={{ fontSize: 14, color: "#fff" }}>You</span>
                    </div>
                    <span style={{ fontSize: 12, color: V.textTertiary }}>▾</span>
                  </div>
                </div>
                <div style={{ flex: 1, position: "relative" }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: endDate ? V.textSecondary : "#FF5555", marginBottom: 8, transition: "color .2s" }}>{modeLabel} end date *</label>
                  <div 
                    onClick={() => { setTempDate(endDate ? (() => { const p = endDate.split('-'); return new Date(+p[2], +p[1]-1, +p[0]); })() : new Date()); setCalendarMonth(endDate ? (() => { const p = endDate.split('-'); return new Date(+p[2], +p[1]-1, 1); })() : new Date()); setShowDatePicker(true); }}
                    style={{ height: 44, padding: "0 14px", background: "#050505", border: `1px solid ${showDatePicker ? V.accent : "#222"}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", color: endDate ? "#fff" : V.textTertiary, cursor: "pointer", transition: "border-color .2s ease" }}
                  >
                    <span style={{ fontSize: 14 }}>{endDate || "dd-mm-yyyy"}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>

                  {showDatePicker && (
                    <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 300, background: "#0A0A0A", border: `1px solid ${V.border}`, borderRadius: 12, boxShadow: "0 16px 48px rgba(0,0,0,0.7)", zIndex: 4000, overflow: "hidden" }}>
                      <div style={{ padding: "12px 16px", borderBottom: `1px solid #1A1A1A`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <button onClick={(e) => { e.stopPropagation(); setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)); }} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "transparent", color: V.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>‹</button>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{calendarMonth.toLocaleString('default', { month: 'long' })} {calendarMonth.getFullYear()}</span>
                        <button onClick={(e) => { e.stopPropagation(); setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)); }} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "transparent", color: V.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>›</button>
                      </div>
                      <div style={{ padding: "8px 16px 0" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: V.textTertiary, padding: "4px 0" }}>{d}</div>
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
                              days.push(<div key={`prev-${i}`} style={{ height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#333" }}>{prevMonthLastDate - i}</div>);
                            }
                            for (let d = 1; d <= lastDate; d++) {
                              const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d);
                              const isToday = date.toDateString() === new Date().toDateString();
                              const isSelected = endDate === `${d.toString().padStart(2, '0')}-${(calendarMonth.getMonth() + 1).toString().padStart(2, '0')}-${calendarMonth.getFullYear()}`;
                              
                              days.push(
                                <div 
                                  key={d} 
                                  onClick={(e) => { e.stopPropagation(); handleDateSave(date); }}
                                  style={{ height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, borderRadius: 6, cursor: "pointer", transition: "all .2s", 
                                    background: isSelected ? V.accent : "transparent",
                                    border: isToday && !isSelected ? `1px solid ${V.accent}` : "none",
                                    color: isSelected ? "#fff" : isToday ? V.accent : "#fff"
                                  }}
                                  onMouseEnter={e => !isSelected && (e.currentTarget.style.background = '#1A1A1A')}
                                  onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
                                >
                                  {d}
                                </div>
                              );
                            }
                            return days;
                          })()}
                        </div>
                      </div>
                      <div style={{ padding: "16px 24px", borderTop: `1px solid #1A1A1A`, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                        <button onClick={(e) => { e.stopPropagation(); setShowDatePicker(false); }} style={{ height: 28, padding: "0 12px", background: V.accent, border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Save</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: V.textSecondary, marginBottom: 12 }}>Choose icon</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {icons.map(icon => (
                    <button key={icon.id} onClick={() => setSelectedIcon(icon.id)} style={{ width: 40, height: 40, borderRadius: 10, background: "#111", border: `1px solid ${selectedIcon === icon.id ? V.accent : "#222"}`, display: "flex", alignItems: "center", justifyContent: "center", color: selectedIcon === icon.id ? V.accent : V.textTertiary, cursor: "pointer", transition: "all .2s" }}>{icon.svg}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 32 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: V.textSecondary, marginBottom: 8 }}>{modeLabel} description</label>
                <textarea 
                  placeholder={`Add more detail here to help remember why you created this ${modeLabelLower}`}
                  style={{ width: "100%", minHeight: 100, padding: "14px", background: "#050505", border: "1px solid #222", borderRadius: 10, color: "#fff", fontSize: 14, outline: "none", resize: "none" }}
                />
              </div>

              <div style={{ marginBottom: 32 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 16 }}>How will you measure progress? *</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    { id: "sub-goals", label: "Completing sub-goals" },
                    { id: "action-items", label: "Completing action items" },
                    { id: "amount", label: "Tracking a number, percent, or dollar amount" },
                  ].map(opt => (
                    <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                      <div onClick={() => setProgress(opt.id)} style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${progress === opt.id ? V.accent : "#333"}`, background: progress === opt.id ? V.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{progress === opt.id && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}</div>
                      <span style={{ fontSize: 14, color: progress === opt.id ? "#fff" : V.textSecondary, fontWeight: 500 }}>{opt.label}</span>
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
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    multiple 
                    style={{ display: 'none' }} 
                  />
                  <div style={{ marginBottom: 24, textAlign: 'center' }}>
                    <div 
                      onClick={handleFileClick}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      style={{ 
                        border: `2px dashed ${V.border}`, 
                        borderRadius: 16, 
                        padding: "40px 20px", 
                        background: "rgba(255,255,255,0.02)",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                        cursor: "pointer"
                      }}
                    >
                      <div style={{ fontSize: 32, opacity: 0.5 }}>📤</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: V.text }}>Drop your files here or browse</div>
                      <div style={{ fontSize: 12, color: V.textTertiary }}>Max file size up to 1 GB</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 600, color: V.textSecondary, marginBottom: 12 }}>Uploads</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {files.map((file, i) => (
                      <div key={i} style={{ 
                        background: "#080808", 
                        border: `1px solid ${V.border}`, 
                        borderRadius: 12, 
                        padding: 12,
                        display: "flex", gap: 12, alignItems: "center"
                      }}>
                        <div style={{ 
                          width: 40, height: 40, borderRadius: 8, background: "#111", 
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: V.textTertiary 
                        }}>
                          {file.type.toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: V.text }}>{file.name}</div>
                          <div style={{ fontSize: 12, color: V.textTertiary, marginTop: 2 }}>{file.progress < 100 ? `${file.progress}%` : file.size}</div>
                          {file.progress < 100 && (
                            <div style={{ width: "100%", height: 3, background: "#222", borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
                              <div style={{ width: `${file.progress}%`, height: "100%", background: V.accent }}></div>
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => removeFile(i)}
                          style={{ background: "transparent", border: "none", color: V.textTertiary, cursor: "pointer", fontSize: 16 }}
                        >
                          {file.progress < 100 ? "✕" : "🗑"}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, fontWeight: 600, color: V.textSecondary, marginBottom: 16 }}>Import Git Repository</div>
                  <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, padding: 32, textAlign: "center", color: V.textTertiary, fontSize: 14, background: "#050505" }}>
                    Git Repository Integration Placeholder...
                  </div>
                </>
              )}
            </div>
          )}

          {step === 3 && mode === 'project' && (
            <div style={{ padding: "0 24px 24px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: V.textSecondary, marginBottom: 16 }}>Configure Project Settings</div>
              {/* ... Step 3 content ... */}
            </div>
          )}
        </div>

        <div style={{ padding: "16px 24px", display: "flex", gap: 12, background: "#050505", borderTop: "1px solid #1A1A1A" }}>
          <button onClick={handleBack} style={{ flex: 1, height: 44, background: "#111", border: "1px solid #222", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{step === 1 ? "Cancel" : "Back"}</button>
          <button 
            onClick={handleNext}
            disabled={(step === 1 && !isNextEnabled)}
            style={{ flex: 2, height: 44, background: (mode === 'goal' && step === 2) ? "#fff" : (step === 3) ? "#fff" : (step === 1 && !isNextEnabled) ? "#0A1A3A" : "#112B5B", border: "none", borderRadius: 10, color: (mode === 'goal' && step === 2) ? "#000" : (step === 3) ? "#000" : (step === 1 && !isNextEnabled) ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,1)", fontSize: 14, fontWeight: 700, cursor: (step === 3 || (mode === 'goal' && step === 2) || (step === 1 && isNextEnabled)) ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .3s ease" }}
          >
            {(mode === 'task' && step === 1) ? "Create Task" : (mode === 'goal' && step === 2) ? "Create Goal" : step === 3 ? "Deploy" : (<>Next <span style={{ fontSize: 16 }}>›</span></>)}
          </button>
        </div>
      </div>
    </div>
  );
};
