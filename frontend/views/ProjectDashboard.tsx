import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Project } from "../types/project";
import { CreateProjectModal } from "../components/modals/CreateProjectModal";
import { useAppData } from "../context/AppDataContext";


// Initial projects moved to AppDataContext

/* ─── Styles (inlined TrackCodex design tokens) ─── */
const V = {
  bg: "var(--gh-bg)",
  card: "var(--gh-bg-secondary)",
  cardHover: "var(--gh-bg", // Using bg-hover semantic if available, otherwise just bg
  border: "var(--gh-border)",
  borderLight: "var(--gh-border)",
  text: "var(--gh-text)",
  textSecondary: "var(--gh-text-secondary)",
  textTertiary: "var(--gh-text-secondary)",
  accent: "var(--primary-color)",
  green: "var(--gh-success)",
  font: "var(--font-sans, 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
};

/* ─── Dropdown Menu Component ─── */
const MenuItem = ({ label, icon, isLabel, onClose }: { label: string, icon?: string, isLabel?: boolean, onClose: () => void }) => {
  if (isLabel) return <div style={{ padding: "10px 12px 6px", fontSize: 11, fontWeight: 600, color: V.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>;
  return (
    <button 
      onClick={e => { e.stopPropagation(); onClose(); }}
      style={{ 
        width: "100%", padding: "8px 12px", background: "transparent", border: "none", 
        color: V.text, fontSize: 13, display: "flex", 
        alignItems: "center", justifyContent: "space-between", cursor: "pointer", 
        textAlign: "left", borderRadius: 8, transition: "background .12s ease" 
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#141414"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <span style={{ fontWeight: 500 }}>{label}</span>
      {icon && <span style={{ color: V.textTertiary, fontSize: 16 }}>{icon}</span>}
    </button>
  );
};

const ProjectActionMenu = ({ isOpen, onClose, anchorRef }: { isOpen: boolean, onClose: () => void, anchorRef: React.RefObject<HTMLButtonElement | null> }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && 
          anchorRef.current && !anchorRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div ref={menuRef} style={{ 
      position: "absolute", top: "100%", right: 0, marginTop: 8, width: 220, 
      background: "#080808", border: `1px solid ${V.border}`, borderRadius: 12, 
      padding: "6px", zIndex: 1000, boxShadow: "0 12px 40px rgba(0,0,0,0.8)" 
    }}>
      <MenuItem label="Add Favorite" icon="☆" onClose={onClose} />
      <MenuItem label="Visit with Toolbar" onClose={onClose} />
      <MenuItem label="View Logs" onClose={onClose} />
      <MenuItem label="Manage Domains" onClose={onClose} />
      <MenuItem label="Transfer Project" onClose={onClose} />
      <MenuItem label="Settings" onClose={onClose} />
      <div style={{ height: 1, background: V.border, margin: "6px 4px" }} />
      <MenuItem label="Repository" isLabel onClose={onClose} />
      <MenuItem label="Import Directory" onClose={onClose} />
      <MenuItem label="View Git Repository" onClose={onClose} />
    </div>
  );
};

/* ─── Card ─── */
const ProjectCard = ({ p }: { p: Project }) => {
  const nav = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div
      onClick={() => nav(`/project/${p.id}`, { state: { projectData: p } })}
      style={{ background: V.card, border: `1px solid ${V.border}`, borderRadius: 12, padding: 20, cursor: "pointer", fontFamily: V.font, transition: "all .15s", position: "relative" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "#555")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = V.border)}
    >
      {/* Head */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: p.logoBg, border: `1px solid ${V.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: V.text, fontSize: 16, fontWeight: 700 }}>
            {p.logo}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: V.text, lineHeight: 1.3 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: V.textSecondary, lineHeight: 1.3, marginTop: 2 }}>{p.domain}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, position: "relative" }}>
          <button 
            onClick={e => {
              e.stopPropagation();
              nav(`/project/${p.id}?openChecklist=true`, { state: { projectData: p } });
            }} 
            style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${V.border}`, background: "transparent", color: V.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }} 
            title="Edit"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button 
            ref={menuButtonRef}
            onClick={e => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} 
            style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${V.border}`, background: isMenuOpen ? "#222" : "transparent", color: V.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }} 
            title="More"
          >
            ⋯
          </button>
          <ProjectActionMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} anchorRef={menuButtonRef} />
        </div>
      </div>
      {/* Repo */}
      <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: V.textSecondary, textDecoration: "none", marginBottom: 8 }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
        <span>{p.repoOwner}/{p.repoName}</span>
      </a>
      {/* Commit */}
      <div style={{ fontSize: 13, color: V.textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 8 }}>{p.commitMsg}</div>
      {/* Date */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: V.textTertiary }}>
        <span style={{ color: V.text }}>{p.deployDate}</span>
        <span>on</span>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: .7 }}><path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25z"/></svg>
        <span>{p.branch}</span>
      </div>
    </div>
  );
};

/* ─── Main ─── */
const ProjectDashboard: React.FC = () => {
  const { projects, addProject, addTask } = useAppData();
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid"|"list">("grid");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'project' | 'goal' | 'task'>('project');

  const handleCreate = (newItem: any) => {
    if (modalMode === 'task') {
        addTask({...newItem, status: 'To-do', people: ['https://i.pravatar.cc/150?u=gs'], priority: 'Medium', type: 'Dashboard', estimation: '3 days'});
    } else {
        addProject(newItem);
    }
  };

  const filtered = projects.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.domain.toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{ flex: 1, width: "100%", background: V.bg, overflowY: "auto", fontFamily: V.font, color: V.text }}>
      <div style={{ padding: "20px 24px" }}>



        {/* Search bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={V.textTertiary} strokeWidth="2" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search Projects..."
              style={{ width: "100%", height: 40, paddingLeft: 38, paddingRight: 12, background: V.bg, border: `1px solid ${V.border}`, borderRadius: 8, color: V.text, fontSize: 14, fontFamily: V.font, outline: "none" }}
              onFocus={e => e.currentTarget.style.borderColor = V.text}
              onBlur={e => e.currentTarget.style.borderColor = V.border}
            />
          </div>
          {/* Toggle */}
          <div style={{ display: "flex", border: `1px solid ${V.border}`, borderRadius: 8, overflow: "hidden", height: 40 }}>
            {[
              { icon: "≡", key: "filter" as const },
              { icon: "⊞", key: "grid" as const },
              { icon: "☰", key: "list" as const },
            ].map((b, i) => (
              <button key={i} onClick={() => { if (b.key === "grid" || b.key === "list") setView(b.key); }}
                style={{ width: 40, height: "100%", background: (b.key === view) ? V.cardHover : "transparent", color: (b.key === view) ? V.text : V.textSecondary, border: "none", borderRight: i < 2 ? `1px solid ${V.border}` : "none", cursor: "pointer", fontSize: 16, fontFamily: V.font }}
              >{b.icon}</button>
            ))}
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => setIsCreateModalOpen(true)}
              style={{ height: 40, padding: "0 14px", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 8, color: V.text, fontSize: 14, fontFamily: V.font, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}
            >
              Add New...
            </button>
          </div>
        </div>

        {/* Projects */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: V.text, marginBottom: 12 }}>Projects</div>
          {filtered.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: view === "grid" ? "1fr 1fr" : "1fr", gap: 12 }}>
              {filtered.map(p => <ProjectCard key={p.id} p={p} />)}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 60, color: V.textSecondary, fontSize: 14 }}>No projects match your search.</div>
          )}
        </div>
      </div>
      <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onDeploy={handleCreate} mode={modalMode} />
    </div>
  );
};

export default ProjectDashboard;
