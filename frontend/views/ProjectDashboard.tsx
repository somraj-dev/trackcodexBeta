import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/* ─── Data ─── */

interface Project {
  id: string;
  name: string;
  domain: string;
  logo: string;
  logoBg: string;
  repoOwner: string;
  repoName: string;
  repoUrl: string;
  commitMsg: string;
  deployDate: string;
  branch: string;
}

const PROJECTS: Project[] = [
  { id: "trackcodex", name: "trackcodex", domain: "trackcodex.com", logo: "⬡", logoBg: "#111", repoOwner: "somraj-dev", repoName: "trackcodexBeta", repoUrl: "https://github.com/somraj-dev/trackcodexBeta", commitMsg: "style: fix hardcoded dark themes in main layout and dashboard...", deployDate: "1h ago", branch: "main" },
  { id: "docs", name: "docs", domain: "docs.trackcodex.com", logo: "N", logoBg: "#111", repoOwner: "somraj-dev", repoName: "docs", repoUrl: "https://github.com/somraj-dev/docs", commitMsg: "feat: update links to open in the same tab", deployDate: "Mar 14", branch: "main" },
  { id: "support", name: "support", domain: "support.trackcodex.com", logo: "▲", logoBg: "#111", repoOwner: "somraj-dev", repoName: "support", repoUrl: "https://github.com/somraj-dev/support", commitMsg: "fix: resolve build failures by removing unused-vars and converti...", deployDate: "Mar 14", branch: "main" },
  { id: "browser", name: "browser", domain: "blog.trackcodex.com", logo: "W", logoBg: "linear-gradient(135deg,#7c3aed,#06b6d4)", repoOwner: "Quantaforge", repoName: "trackcodex/br...", repoUrl: "https://github.com/Quantaforge/trackcodex", commitMsg: "feat: Initialize ForgeBrowser IDE project", deployDate: "Mar 2", branch: "main" },
];



/* ─── Styles (inlined Vercel design tokens) ─── */
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

/* ─── Card ─── */
const ProjectCard = ({ p }: { p: Project }) => {
  const nav = useNavigate();
  return (
    <div
      onClick={() => nav(`/dashboard/project/${p.id}`)}
      style={{ background: V.card, border: `1px solid ${V.border}`, borderRadius: 12, padding: 20, cursor: "pointer", fontFamily: V.font, transition: "border-color .15s" }}
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
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={e => e.stopPropagation()} style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${V.border}`, background: "transparent", color: V.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }} title="Edit">✎</button>
          <button onClick={e => e.stopPropagation()} style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${V.border}`, background: "transparent", color: V.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }} title="More">⋯</button>
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
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid"|"list">("grid");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = PROJECTS.filter(p => p.name.includes(q.toLowerCase()) || p.domain.includes(q.toLowerCase()));

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
          {/* Add New */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setAddOpen(!addOpen)}
              style={{ height: 40, padding: "0 14px", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 8, color: V.text, fontSize: 14, fontFamily: V.font, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}
            >
              Add New... <span style={{ fontSize: 12, color: V.textSecondary }}>▾</span>
            </button>
            {addOpen && (
              <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 4, width: 200, background: V.cardHover, border: `1px solid ${V.border}`, borderRadius: 10, padding: "4px 0", zIndex: 50, boxShadow: "0 8px 30px rgba(0,0,0,.5)" }}>
                {[
                  { label: "Project", to: "/repositories/new" },
                  { label: "Repository", to: "/repositories/new" },
                  { label: "Workspace", to: "/workspace/new" },
                  { label: "Import Git Repository", to: "/repositories/import" },
                ].map(it => (
                  <button key={it.label} onClick={() => { setAddOpen(false); nav(it.to); }}
                    style={{ width: "100%", padding: "8px 14px", background: "transparent", border: "none", color: V.textSecondary, fontSize: 13, fontFamily: V.font, cursor: "pointer", textAlign: "left" }}
                    onMouseEnter={e => { e.currentTarget.style.background = V.border; e.currentTarget.style.color = V.text; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = V.textSecondary; }}
                  >{it.label}</button>
                ))}
              </div>
            )}
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
    </div>
  );
};

export default ProjectDashboard;
