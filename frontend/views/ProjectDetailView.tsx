import React from "react";
import { useParams, useNavigate } from "react-router-dom";

/* ─── Design tokens ─── */
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
  font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

/* ─── Data ─── */
interface ProjInfo {
  name: string;
  domain: string;
  altDomain?: string;
  repoUrl: string;
  deployUrl: string;
  status: string;
  createdAgo: string;
  createdBy: string;
  branch: string;
  commitHash: string;
  commitMsg: string;
  checklist: { label: string; done: boolean }[];
  edgeReqs: number;
  fnInvocations: number;
  errorRate: string;
}

const DATA: Record<string, ProjInfo> = {
  trackcodex: {
    name: "trackcodex", domain: "trackcodex.com", altDomain: "quantaforze.com",
    repoUrl: "https://github.com/somraj-dev/trackcodexBeta",
    deployUrl: "trackcodex-1w1wza9ui-quantaforze.vercel.app",
    status: "Ready", createdAgo: "7m ago", createdBy: "somraj-dev",
    branch: "main", commitHash: "0bcbc93",
    commitMsg: "feat: add Project Dashboard with Vercel-style layout for /dashboard ro...",
    checklist: [
      { label: "Connect Git Repository", done: true },
      { label: "Add Custom Domain", done: true },
      { label: "Preview Deployment", done: true },
      { label: "Enable Web Analytics", done: false },
      { label: "Enable Speed Insights", done: false },
    ],
    edgeReqs: 423, fnInvocations: 0, errorRate: "0%",
  },
  docs: {
    name: "docs", domain: "docs.trackcodex.com",
    repoUrl: "https://github.com/somraj-dev/docs",
    deployUrl: "docs-trackcodex.vercel.app",
    status: "Ready", createdAgo: "5d ago", createdBy: "somraj-dev",
    branch: "main", commitHash: "a4e21f1",
    commitMsg: "feat: update links to open in the same tab",
    checklist: [
      { label: "Connect Git Repository", done: true },
      { label: "Add Custom Domain", done: true },
      { label: "Preview Deployment", done: true },
      { label: "Enable Web Analytics", done: false },
      { label: "Enable Speed Insights", done: false },
    ],
    edgeReqs: 156, fnInvocations: 0, errorRate: "0%",
  },
  support: {
    name: "support", domain: "support.trackcodex.com",
    repoUrl: "https://github.com/somraj-dev/support",
    deployUrl: "support-trackcodex.vercel.app",
    status: "Ready", createdAgo: "5d ago", createdBy: "somraj-dev",
    branch: "main", commitHash: "bc12e4a",
    commitMsg: "fix: resolve build failures by removing unused-vars and converti...",
    checklist: [
      { label: "Connect Git Repository", done: true },
      { label: "Add Custom Domain", done: true },
      { label: "Preview Deployment", done: true },
      { label: "Enable Web Analytics", done: false },
      { label: "Enable Speed Insights", done: false },
    ],
    edgeReqs: 89, fnInvocations: 0, errorRate: "0%",
  },
  browser: {
    name: "browser", domain: "blog.trackcodex.com",
    repoUrl: "https://github.com/Quantaforge/trackcodex",
    deployUrl: "browser-trackcodex.vercel.app",
    status: "Ready", createdAgo: "17d ago", createdBy: "somraj-dev",
    branch: "main", commitHash: "f1a8c2b",
    commitMsg: "feat: Initialize ForgeBrowser IDE project",
    checklist: [
      { label: "Connect Git Repository", done: true },
      { label: "Add Custom Domain", done: true },
      { label: "Preview Deployment", done: false },
      { label: "Enable Web Analytics", done: false },
      { label: "Enable Speed Insights", done: false },
    ],
    edgeReqs: 12, fnInvocations: 0, errorRate: "0%",
  },
};

/* ─── Sparkline ─── */
const Sparkline = () => {
  const pts = [8, 12, 6, 18, 14, 22, 10, 16, 20, 24, 15, 28, 18, 12, 22, 16, 30, 20, 14, 26];
  const max = Math.max(...pts);
  const w = 200, h = 44;
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${(i / (pts.length - 1)) * w},${h - (p / max) * h}`).join(" ");
  return <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 44 }}><path d={d} fill="none" stroke="#3b82f6" strokeWidth="1.5" /></svg>;
};

/* ─── Button helper ─── */
const Btn = ({ children, onClick, href, style: extra }: { children: React.ReactNode; onClick?: () => void; href?: string; style?: React.CSSProperties }) => {
  const base: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", fontSize: 13, fontWeight: 500, color: V.text, background: V.bg, border: `1px solid ${V.border}`, borderRadius: 8, cursor: "pointer", fontFamily: V.font, textDecoration: "none", ...extra };
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" style={base}>{children}</a>;
  return <button onClick={onClick} style={base}>{children}</button>;
};

/* ─── Component ─── */
const ProjectDetailView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const nav = useNavigate();
  const p = DATA[projectId || ""];

  if (!p) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: V.bg, fontFamily: V.font, color: V.textSecondary }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⊘</div>
        <div style={{ fontSize: 14, marginBottom: 16 }}>Project not found.</div>
        <button onClick={() => nav("/dashboard")} style={{ padding: "8px 20px", background: V.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: V.font }}>Back to Dashboard</button>
      </div>
    </div>
  );

  const done = p.checklist.filter(c => c.done).length;

  return (
    <div style={{ flex: 1, width: "100%", background: V.bg, overflowY: "auto", fontFamily: V.font, color: V.text, display: "flex" }}>
      {/* ── Left Sidebar ── */}
      <div style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${V.borderLight}`, height: "100vh", position: "sticky", top: 0, overflowY: "auto", padding: "12px 0" }}>
        {/* Search */}
        <div style={{ padding: "0 12px", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", height: 36, background: V.card, border: `1px solid ${V.border}`, borderRadius: 8, padding: "0 10px", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={V.textTertiary} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <span style={{ fontSize: 13, color: V.textTertiary, flex: 1 }}>Find...</span>
            <span style={{ fontSize: 11, color: V.textTertiary, background: V.cardHover, border: `1px solid ${V.border}`, borderRadius: 4, padding: "1px 6px", fontFamily: "monospace" }}>F</span>
          </div>
        </div>

        {/* Nav Group 1 */}
        {[
          { icon: "⬡", label: "Overview", active: true },
          { icon: "⊞", label: "Deployments" },
          { icon: "☰", label: "Logs" },
          { icon: "↗", label: "Analytics" },
          { icon: "◎", label: "Speed Insights", highlight: true },
          { icon: "◉", label: "Observability", chevron: true },
          { icon: "⊡", label: "Firewall", chevron: true },
          { icon: "⊕", label: "CDN", chevron: true },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 16px", margin: "1px 8px", borderRadius: 6, cursor: "pointer",
              background: item.active ? V.cardHover : item.highlight ? V.cardHover : "transparent",
              color: item.active ? V.text : V.textSecondary, fontSize: 14,
              transition: "background .15s",
            }}
            onMouseEnter={e => { if (!item.active) e.currentTarget.style.background = V.cardHover; }}
            onMouseLeave={e => { if (!item.active && !item.highlight) e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14, width: 18, textAlign: "center", opacity: item.active ? 1 : .7 }}>{item.icon}</span>
              <span style={{ fontWeight: item.active ? 500 : 400 }}>{item.label}</span>
            </div>
            {item.chevron && <span style={{ fontSize: 11, color: V.textTertiary }}>›</span>}
          </div>
        ))}

        {/* Divider */}
        <div style={{ height: 1, background: V.borderLight, margin: "8px 16px" }}></div>

        {/* Nav Group 2 */}
        {[
          { icon: "⊞", label: "Domains" },
          { icon: "⊡", label: "Integrations" },
          { icon: "◎", label: "Storage" },
          { icon: "◉", label: "Flags", chevron: true },
          { icon: "⁂", label: "Agent", chevron: true },
          { icon: "⊛", label: "AI Gateway", chevron: true },
          { icon: "⊡", label: "Sandboxes" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 16px", margin: "1px 8px", borderRadius: 6, cursor: "pointer",
              background: "transparent", color: V.textSecondary, fontSize: 14,
              transition: "background .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = V.cardHover; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14, width: 18, textAlign: "center", opacity: .7 }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
            {item.chevron && <span style={{ fontSize: 11, color: V.textTertiary }}>›</span>}
          </div>
        ))}

        {/* Divider */}
        <div style={{ height: 1, background: V.borderLight, margin: "8px 16px" }}></div>

        {/* Nav Group 3 */}
        {[
          { icon: "◔", label: "Usage" },
          { icon: "⚙", label: "Settings", chevron: true },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 16px", margin: "1px 8px", borderRadius: 6, cursor: "pointer",
              background: "transparent", color: V.textSecondary, fontSize: 14,
              transition: "background .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = V.cardHover; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14, width: 18, textAlign: "center", opacity: .7 }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
            {item.chevron && <span style={{ fontSize: 11, color: V.textTertiary }}>›</span>}
          </div>
        ))}
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
        {/* Top bar */}
        <div style={{ borderBottom: `1px solid ${V.borderLight}`, height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, background: V.bg, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => nav("/dashboard")} style={{ background: "transparent", border: "none", color: V.textSecondary, cursor: "pointer", fontSize: 18, padding: 0 }}>☰</button>
            <span style={{ color: V.textTertiary }}>▸</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span>
            <button style={{ background: "transparent", border: "none", color: V.textSecondary, cursor: "pointer", fontSize: 14, padding: 0 }}>⟳</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Overview</span>
            <button style={{ background: "transparent", border: "none", color: V.textSecondary, cursor: "pointer", fontSize: 18 }}>⋯</button>
          </div>
        </div>

        <div style={{ padding: "24px 24px 40px" }}>
          {/* Production Deployment */}
          <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ padding: "12px 20px", background: V.card, borderBottom: `1px solid ${V.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Production Deployment</span>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn href={p.repoUrl}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                  Repository
                </Btn>
                <Btn>⎌ Instant Rollback</Btn>
                <div style={{ display: "flex", border: `1px solid ${V.border}`, borderRadius: 8, overflow: "hidden" }}>
                  <a href={`https://${p.domain}`} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 14px", fontSize: 13, fontWeight: 500, color: V.text, background: V.cardHover, textDecoration: "none", fontFamily: V.font }}>Visit</a>
                  <button style={{ padding: "6px 8px", borderLeft: `1px solid ${V.border}`, background: V.cardHover, border: "none", color: V.textSecondary, cursor: "pointer", fontSize: 11 }}>▾</button>
                </div>
              </div>
            </div>

            <div style={{ padding: 20, display: "flex", gap: 24 }}>
              {/* Preview */}
              <div style={{ width: 200, height: 130, borderRadius: 8, border: `1px solid ${V.borderLight}`, background: V.card, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: "rgba(0,112,243,.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontSize: 22, color: V.accent }}>◆</div>
                  <span style={{ fontSize: 10, color: V.textTertiary, fontFamily: "monospace" }}>TrackCodex</span>
                </div>
              </div>

              {/* Details */}
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: V.textTertiary, textTransform: "uppercase", letterSpacing: 1 }}>Deployment</div>
                  <div style={{ fontSize: 13, color: V.text, marginTop: 2 }}>{p.deployUrl}</div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: V.textTertiary, textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center", gap: 4 }}>Domains <span style={{ cursor: "pointer" }}>⊕</span></div>
                  <div style={{ display: "flex", gap: 16, marginTop: 2 }}>
                    <a href={`https://${p.domain}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: V.text, textDecoration: "none" }}>{p.domain} ↗</a>
                    {p.altDomain && <a href={`https://${p.altDomain}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: V.text, textDecoration: "none" }}>{p.altDomain} ↗</a>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 40, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: V.textTertiary, textTransform: "uppercase", letterSpacing: 1 }}>Status</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#0a0" }}></div>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{p.status}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: V.textTertiary, textTransform: "uppercase", letterSpacing: 1 }}>Created</div>
                    <div style={{ fontSize: 13, marginTop: 2 }}>{p.createdAgo} by {p.createdBy} <span style={{ color: V.textTertiary, cursor: "pointer" }}>⇕</span></div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: V.textTertiary, textTransform: "uppercase", letterSpacing: 1 }}>Source</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ color: V.text }}><path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25z"/></svg>
                    <span style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 600 }}>{p.branch}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: 13, color: V.textSecondary }}>
                    <span>⊙</span>
                    <span style={{ fontFamily: "monospace" }}>{p.commitHash}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.commitMsg}</span>
                  </div>
                </div>
              </div>

              {/* Vercel icon */}
              <div style={{ flexShrink: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: V.card, border: `1px solid ${V.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>▲</div>
              </div>
            </div>
          </div>

          {/* Deployment Settings */}
          <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: V.textSecondary, fontSize: 14 }}>▸</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Deployment Settings</span>
              <span style={{ padding: "2px 10px", fontSize: 11, fontWeight: 600, color: V.accent, background: "rgba(0,112,243,.1)", borderRadius: 20, border: "1px solid rgba(0,112,243,.2)" }}>3 Recommendations</span>
            </div>
            <div style={{ borderTop: `1px solid ${V.borderLight}`, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: V.textSecondary }}>
                To update your Production Deployment, push to the <code style={{ fontFamily: "monospace", fontWeight: 600, color: V.text, background: V.cardHover, padding: "2px 6px", borderRadius: 4 }}>{p.branch}</code> branch.
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn>Deployments</Btn>
                <Btn style={{ padding: "6px 10px" }}>⊞</Btn>
              </div>
            </div>
          </div>

          {/* Bottom 3 cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {/* Checklist */}
            <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${V.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Production Checklist</span>
                  <span style={{ fontSize: 12, color: V.textSecondary }}>{done}/{p.checklist.length}</span>
                </div>
                <span style={{ color: V.textSecondary, fontSize: 12, cursor: "pointer" }}>↗</span>
              </div>
              <div style={{ padding: 8 }}>
                {p.checklist.map((c, i) => (
                  <div key={i} style={{
                    padding: "10px 12px", borderRadius: 8, marginBottom: 2, fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: c.done ? "rgba(0,112,243,.08)" : "transparent",
                    color: c.done ? V.accent : V.text,
                  }}>
                    <span style={{ textDecoration: c.done ? "line-through" : "none", opacity: c.done ? .8 : 1 }}>{c.label}</span>
                    {c.done && <span style={{ fontSize: 14 }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Observability */}
            <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${V.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Observability</span>
                  <span style={{ fontSize: 12, color: V.textSecondary }}>6h</span>
                </div>
                <span style={{ color: V.textSecondary, fontSize: 14, cursor: "pointer" }}>›</span>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: V.textTertiary, textTransform: "uppercase", letterSpacing: 1 }}>Edge Requests</div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{p.edgeReqs}</div>
                  <Sparkline />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: V.textTertiary, textTransform: "uppercase", letterSpacing: 1 }}>Function Invocations</div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{p.fnInvocations}</div>
                  <div style={{ height: 2, background: V.borderLight, borderRadius: 2, marginTop: 8 }}></div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: V.textTertiary, textTransform: "uppercase", letterSpacing: 1 }}>Error Rate</div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{p.errorRate}</div>
                  <div style={{ height: 2, background: V.borderLight, borderRadius: 2, marginTop: 8 }}></div>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${V.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Analytics</span>
                <span style={{ color: V.textSecondary, fontSize: 14, cursor: "pointer" }}>›</span>
              </div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
                <div style={{ fontSize: 28, color: V.textTertiary, marginBottom: 12 }}>📊</div>
                <div style={{ fontSize: 13, color: V.textSecondary, marginBottom: 16 }}>Track visitors and page views</div>
                <button style={{ padding: "8px 20px", fontSize: 13, fontWeight: 500, color: V.text, background: V.bg, border: `1px solid ${V.border}`, borderRadius: 8, cursor: "pointer", fontFamily: V.font }}>Enable</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailView;
