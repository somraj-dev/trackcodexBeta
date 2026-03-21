import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { InviteModal } from '../components/modals/InviteModal';

/* ─── Design tokens ─── */
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
  font: "var(--font-sans, 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
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
    deployUrl: "trackcodex-1w1wza9ui-quantaforze.trackcodex.app",
    status: "Ready", createdAgo: "7m ago", createdBy: "somraj-dev",
    branch: "main", commitHash: "0bcbc93",
    commitMsg: "feat: add Project Dashboard with TrackCodex-style layout for /dashboard ro...",
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
    deployUrl: "docs-trackcodex.trackcodex.app",
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
    deployUrl: "support-trackcodex.trackcodex.app",
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
    deployUrl: "browser-trackcodex.trackcodex.app",
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

/* ─── Search Items Builder ─── */
const buildSearchItems = (setActiveTab: any, setSettingsTab: any, setObservabilityTab: any, setUsageTab: any) => [
  { label: "Overview", icon: "⬡", group: "Navigation", action: () => setActiveTab("Overview") },
  { label: "Deployments", icon: "⊞", group: "Navigation", action: () => setActiveTab("Deployments") },
  { label: "Logs", icon: "☰", group: "Navigation", action: () => setActiveTab("Logs") },
  { label: "Analytics", icon: "↗", group: "Navigation", action: () => setActiveTab("Analytics") },
  { label: "Speed Insights", icon: "◎", group: "Navigation", action: () => setActiveTab("Speed Insights") },
  { label: "Observability", icon: "◉", group: "Navigation", action: () => setActiveTab("Observability") },
  { label: "Firewall", icon: "⊡", group: "Navigation", action: () => setActiveTab("Firewall") },
  { label: "CDN", icon: "⊕", group: "Navigation", action: () => setActiveTab("CDN") },
  { label: "Domains", icon: "⊞", group: "Navigation", action: () => setActiveTab("Domains") },
  { label: "Integrations", icon: "⊡", group: "Navigation", action: () => setActiveTab("Integrations") },
  { label: "Storage", icon: "◎", group: "Navigation", action: () => setActiveTab("Storage") },
  { label: "Flags", icon: "◉", group: "Navigation", action: () => setActiveTab("Flags") },
  { label: "Agent", icon: "⁂", group: "Navigation", action: () => setActiveTab("Agent") },
  { label: "AI Gateway", icon: "⊛", group: "Navigation", action: () => setActiveTab("AI Gateway") },
  { label: "Sandboxes", icon: "⊡", group: "Navigation", action: () => setActiveTab("Sandboxes") },
  { label: "Usage", icon: "◔", group: "Navigation", action: () => setActiveTab("Usage") },
  { label: "Settings", icon: "⚙", group: "Navigation", action: () => setActiveTab("Settings") },
  
  ...["General", "Billing", "Build and Deployment", "Invoices", "Members", "Access Groups", "Agent", "Drains", "Webhooks", "Security & Privacy", "Deployment Protection", "Microfrontends", "Connectivity", "Environment Variables", "Activity", "My Notifications", "Apps"].map(t => ({
    label: `Settings: ${t}`, icon: "⚙", group: "Settings", action: () => { setActiveTab("Settings"); setSettingsTab(t); }
  })),

  ...["Overview", "Query", "Notebooks", "Alerts", "Functions", "External APIs", "Middleware", "Workflows", "Edge Requests", "Fast Data Transfer", "Image Optimization", "ISR", "External Rewrites", "Microfrontends"].map(t => ({
    label: `Observability: ${t}`, icon: "◉", group: "Observability", action: () => { setActiveTab("Observability"); setObservabilityTab(t); }
  })),

  ...["Overview", "Networking", "Incremental Static Regeneration", "Data Cache", "TrackCodex Functions", "Edge Functions", "Edge Middleware", "Edge Config", "Builds", "Artifacts", "Blob", "Queues", "Cron Jobs", "Drains", "Observability", "Image Optimization", "Flags", "BotID Requests", "Trace Spans", "Connectivity", "Sandbox"].map(t => ({
    label: `Usage: ${t}`, icon: "◔", group: "Usage", action: () => { setActiveTab("Usage"); setUsageTab(t); }
  }))
];

/* ─── Search Modal ─── */
const ProjectSearchModal = ({ isOpen, onClose, items, onSelect }: { isOpen: boolean, onClose: () => void, items: any[], onSelect: (i: any) => void }) => {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredItems = search.trim() === "" ? items : items.filter(i => i.label.toLowerCase().includes(search.toLowerCase()) || i.group.toLowerCase().includes(search.toLowerCase()));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) onSelect(filteredItems[selectedIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex justify-center pt-[10vh] px-4" onClick={onClose} style={{ fontFamily: V.font }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
      <div 
        className="relative w-full max-w-[680px] bg-[var(--gh-bg-secondary)41A] border border-gh-border rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-top-4 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-2 border-b border-gh-border bg-[var(--gh-bg-secondary)41A]">
          <div className="flex items-center bg-gh-bg border border-[#2f81f7] rounded-[6px] outline outline-1 outline-[#2f81f7] px-3 py-1.5 focus-within:shadow-[0_0_0_3px_rgba(47,129,247,0.4)] transition-shadow gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7d8590" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              ref={inputRef}
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Search project pages..."
              className="flex-1 bg-transparent text-[14px] text-gh-text placeholder-gh-text-secondary border-none focus:ring-0 outline-none h-6 p-0"
              style={{ fontFamily: V.font }}
            />
            <button onClick={onClose} className="text-gh-text-secondary text-xs px-2 py-1 hover:bg-gh-bg-tertiary rounded transition-colors border border-gh-border cursor-pointer">ESC</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gh-bg relative">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-gh-text-secondary text-[14px]">No pages found matching "{search}"</div>
          ) : (
            <div className="py-2">
              {Array.from(new Set(filteredItems.map(i => i.group))).map(group => {
                const groupItems = filteredItems.filter(i => i.group === group);
                return (
                  <div key={group} className="mb-2">
                    <h3 className="px-3 py-1 text-[12px] font-semibold text-gh-text-secondary uppercase tracking-wider">{group}</h3>
                    <div className="space-y-0 text-[14px]">
                      {groupItems.map(item => {
                        const globalIndex = filteredItems.indexOf(item);
                        const isSelected = globalIndex === selectedIndex;
                        return (
                          <div 
                            key={item.label}
                            onClick={() => onSelect(item)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`flex items-center gap-3 px-4 py-2 cursor-pointer relative transition-colors ${isSelected ? "bg-gh-bg-tertiary" : "hover:bg-gh-bg-tertiary"}`}
                          >
                            {isSelected && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#2f81f7]"></div>}
                            <div className="text-gh-text-secondary w-5 text-center flex items-center justify-center text-[16px]">{item.icon}</div>
                            <span className={`${isSelected ? "text-white" : "text-gh-text"}`}>{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Component ─── */
const ProjectDetailView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("Overview");
  const [settingsTab, setSettingsTab] = useState("General");
  const [observabilityTab, setObservabilityTab] = useState("Overview");
  const [usageTab, setUsageTab] = useState("Overview");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("openChecklist") === "true") {
      setIsChecklistOpen(true);
    }
  }, [searchParams]);

  // Try hardcoded DATA first, then build from route state
  let p = DATA[projectId || ""];
  
  if (!p) {
    const stateData = (location.state as any)?.projectData;
    if (stateData) {
      p = {
        name: stateData.name || projectId || "Unknown",
        domain: stateData.domain || `${projectId}.trackcodex.com`,
        repoUrl: stateData.repoUrl || `https://github.com/somraj-dev/${projectId}`,
        deployUrl: `${(stateData.name || projectId || "project").toLowerCase().replace(/\s+/g, '-')}-quantaforze.trackcodex.app`,
        status: "Ready",
        createdAgo: stateData.deployDate || "Just now",
        createdBy: stateData.repoOwner || "somraj-dev",
        branch: stateData.branch || "main",
        commitHash: (projectId || "0000000").slice(0, 7),
        commitMsg: stateData.commitMsg || "feat: Initial deployment via TrackCodex deploy pipeline",
        checklist: [
          { label: "Connect Git Repository", done: true },
          { label: "Add Custom Domain", done: false },
          { label: "Preview Deployment", done: true },
          { label: "Enable Web Analytics", done: false },
          { label: "Enable Speed Insights", done: false },
        ],
        edgeReqs: 0,
        fnInvocations: 0,
        errorRate: "0%",
      };
    }
  }

  const searchItems = buildSearchItems(setActiveTab, setSettingsTab, setObservabilityTab, setUsageTab);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || (activeEl as HTMLElement).isContentEditable)) return;

      if (e.key === "f" || e.key === "F" || ((e.metaKey || e.ctrlKey) && e.key === "k")) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!p) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: V.bg, fontFamily: V.font, color: V.textSecondary }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⊘</div>
        <div style={{ fontSize: 14, marginBottom: 16 }}>Project not found.</div>
        <button onClick={() => nav("/dashboard")} style={{ padding: "8px 20px", background: V.accent, color: V.text, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: V.font }}>Back to Dashboard</button>
      </div>
    </div>
  );
  
  const done = p.checklist.filter(c => c.done).length;

  const renderContent = () => {
    switch (activeTab) {
      case "Overview":
        return <OverviewTab p={p} done={done} onOpenChecklist={() => { console.log("Opening checklist..."); setIsChecklistOpen(true); }} />;
      case "Deployments":
        return <DeploymentsTab p={p} />;
      case "Logs":
        return <LogsTab p={p} />;
      case "Analytics":
        return <AnalyticsTab />;
      case "Speed Insights":
        return <SpeedInsightsTab />;
      case "Observability":
        return <ObservabilityTab p={p} tab={observabilityTab} />;
      case "Firewall":
        return <FirewallTab />;
      case "CDN":
        return <CDNTab />;
      case "Domains":
        return <DomainsTab p={p} />;
      case "Integrations":
        return <IntegrationsTab />;
      case "Storage":
        return <StorageTab />;
      case "Flags":
        return <FlagsTab />;
      case "Agent":
        return <AgentTab />;
      case "AI Gateway":
        return <AIGatewayTab />;
      case "Sandboxes":
        return <SandboxesTab />;
      case "Usage":
        return <UsageTab usageTab={usageTab} />;
      case "Settings":
        return <SettingsTab p={p} tab={settingsTab} />;
      default:
        return <div style={{ padding: 40, textAlign: "center", color: V.textSecondary }}>Coming soon...</div>;
    }
  };

  return (
    <div style={{ flex: 1, width: "100%", background: V.bg, overflow: "hidden", fontFamily: V.font, color: V.text, display: "flex" }}>
      {/* ── Left Sidebar ── */}
      <div className="no-scrollbar" style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${V.borderLight}`, height: "100vh", position: "sticky", top: 0, overflowY: "auto", padding: "12px 0" }}>
        {activeTab === "Settings" ? (
          <>
            {/* Search */}
            <div style={{ padding: "0 12px", marginBottom: 16 }}>
              <div onClick={() => setIsSearchOpen(true)} style={{ display: "flex", alignItems: "center", height: 32, background: V.card, border: `1px solid ${V.border}`, borderRadius: 6, padding: "0 8px", gap: 8, cursor: "text" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={V.textSecondary} strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <span style={{ fontSize: 13, color: V.textSecondary, flex: 1, letterSpacing: 0.3 }}>Find...</span>
                <span style={{ fontSize: 11, color: V.textSecondary, border: `1px solid ${V.border}`, borderRadius: 4, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", paddingBottom: 1 }}>F</span>
              </div>
            </div>
            
            {/* Back to Project */}
            <div style={{ padding: "0 12px", marginBottom: 8 }}>
              <div onClick={() => setActiveTab("Overview")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", cursor: "pointer", color: V.textSecondary, fontSize: 14, fontWeight: 500, transition: "color .15s" }} onMouseEnter={e => e.currentTarget.style.color = V.text} onMouseLeave={e => e.currentTarget.style.color = V.textSecondary}>
                <span style={{ fontSize: 18, lineHeight: 1, position: "relative", top: -1 }}>‹</span> Settings
              </div>
            </div>

            {/* Settings Links */}
            <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 2 }}>
              {["General", "Billing", "Build and Deployment", "Invoices", "Members", "Access Groups", "Agent", "Drains", "Webhooks", "Security & Privacy", "Deployment Protection", "Microfrontends", "Connectivity", "Environment Variables", "Activity", "My Notifications", "Apps"].map(t => (
                <div key={t} onClick={() => setSettingsTab(t)} style={{ padding: "8px 12px", fontSize: 14, color: settingsTab === t ? V.text : V.textSecondary, fontWeight: settingsTab === t ? 500 : 400, background: settingsTab === t ? V.borderLight : "transparent", borderRadius: 6, cursor: "pointer", transition: "background .15s" }} onMouseEnter={e => { if (settingsTab !== t) e.currentTarget.style.background = V.cardHover; }} onMouseLeave={e => { if (settingsTab !== t) e.currentTarget.style.background = "transparent"; }}>
                  {t}
                </div>
              ))}
            </div>
          </>
        ) : activeTab === "Usage" ? (
          <>
            {/* Search */}
            <div style={{ padding: "0 12px", marginBottom: 16 }}>
              <div onClick={() => setIsSearchOpen(true)} style={{ display: "flex", alignItems: "center", height: 32, background: V.card, border: `1px solid ${V.border}`, borderRadius: 6, padding: "0 8px", gap: 8, cursor: "text" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={V.textSecondary} strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <span style={{ fontSize: 13, color: V.textSecondary, flex: 1, letterSpacing: 0.3 }}>Find...</span>
                <span style={{ fontSize: 11, color: V.textSecondary, border: `1px solid ${V.border}`, borderRadius: 4, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", paddingBottom: 1 }}>F</span>
              </div>
            </div>
            
            {/* Back to Project */}
            <div style={{ padding: "0 12px", marginBottom: 8 }}>
              <div onClick={() => setActiveTab("Overview")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", cursor: "pointer", color: V.textSecondary, fontSize: 14, fontWeight: 500, transition: "color .15s" }} onMouseEnter={e => e.currentTarget.style.color = V.text} onMouseLeave={e => e.currentTarget.style.color = V.textSecondary}>
                <span style={{ fontSize: 18, lineHeight: 1, position: "relative", top: -1 }}>‹</span> Usage
              </div>
            </div>

            {/* Usage Links */}
            <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 2 }}>
              {["Overview", "Networking", "Incremental Static Regeneration", "Data Cache", "TrackCodex Functions", "Edge Functions", "Edge Middleware", "Edge Config", "Builds", "Artifacts", "Blob", "Queues", "Cron Jobs", "Drains", "Observability", "Image Optimization", "Flags", "BotID Requests", "Trace Spans", "Connectivity", "Sandbox"].map(t => (
                <div key={t} onClick={() => setUsageTab(t)} style={{ padding: "8px 12px", fontSize: 14, color: usageTab === t ? V.text : V.textSecondary, fontWeight: usageTab === t ? 500 : 400, background: usageTab === t ? V.cardHover : "transparent", borderRadius: 6, cursor: "pointer", transition: "background .15s", display: "flex", alignItems: "center", gap: 12 }} onMouseEnter={e => { if (usageTab !== t) e.currentTarget.style.background = V.cardHover; }} onMouseLeave={e => { if (usageTab !== t) e.currentTarget.style.background = "transparent"; }}>
                   <span style={{ fontSize: 12, color: V.textTertiary, width: 12, display: "flex", justifyContent: "center" }}>{t !== "Overview" && "›"}</span>
                   {t}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Search */}
            <div style={{ padding: "0 12px", marginBottom: 8 }}>
              <div onClick={() => setIsSearchOpen(true)} style={{ display: "flex", alignItems: "center", height: 32, background: V.card, border: `1px solid ${V.border}`, borderRadius: 6, padding: "0 8px", gap: 8, cursor: "text" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={V.textSecondary} strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <span style={{ fontSize: 13, color: V.textSecondary, flex: 1, letterSpacing: 0.3 }}>Find...</span>
                <span style={{ fontSize: 11, color: V.textSecondary, border: `1px solid ${V.border}`, borderRadius: 4, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", paddingBottom: 1 }}>F</span>
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
                onClick={() => setActiveTab(item.label)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 16px", margin: "1px 8px", borderRadius: 6, cursor: "pointer",
                  background: activeTab === item.label ? V.cardHover : (item.highlight && activeTab !== "Speed Insights" ? "rgba(255,255,255,0.03)" : "transparent"),
                  color: activeTab === item.label ? V.text : V.textSecondary, fontSize: 14,
                  transition: "background .15s",
                }}
                onMouseEnter={e => { if (activeTab !== item.label) e.currentTarget.style.background = V.cardHover; }}
                onMouseLeave={e => { if (activeTab !== item.label) e.currentTarget.style.background = item.highlight ? "rgba(255,255,255,0.03)" : "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14, width: 18, textAlign: "center", opacity: activeTab === item.label ? 1 : .7 }}>{item.icon}</span>
                  <span style={{ fontWeight: activeTab === item.label ? 500 : 400 }}>{item.label}</span>
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
                onClick={() => setActiveTab(item.label)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 16px", margin: "1px 8px", borderRadius: 6, cursor: "pointer",
                  background: activeTab === item.label ? V.cardHover : "transparent",
                  color: activeTab === item.label ? V.text : V.textSecondary, fontSize: 14,
                  transition: "background .15s",
                }}
                onMouseEnter={e => { if (activeTab !== item.label) e.currentTarget.style.background = V.cardHover; }}
                onMouseLeave={e => { if (activeTab !== item.label) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14, width: 18, textAlign: "center", opacity: activeTab === item.label ? 1 : .7 }}>{item.icon}</span>
                  <span style={{ fontWeight: activeTab === item.label ? 500 : 400 }}>{item.label}</span>
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
                onClick={() => setActiveTab(item.label)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 16px", margin: "1px 8px", borderRadius: 6, cursor: "pointer",
                  background: activeTab === item.label ? V.cardHover : "transparent",
                  color: activeTab === item.label ? V.text : V.textSecondary, fontSize: 14,
                  transition: "background .15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = V.cardHover; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14, width: 18, textAlign: "center", opacity: activeTab === item.label ? 1 : .7 }}>{item.icon}</span>
                  <span style={{ fontWeight: activeTab === item.label ? 500 : 400 }}>{item.label}</span>
                </div>
                {item.chevron && <span style={{ fontSize: 11, color: V.textTertiary }}>›</span>}
              </div>
            ))}
          </>
        )}
      </div>

      <ProjectSearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        items={searchItems} 
        onSelect={(item) => { item.action(); setIsSearchOpen(false); }} 
      />

      {/* ── Main Content ── */}
      <div className="no-scrollbar" style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
        {/* Top bar */}
        <div style={{ borderBottom: `1px solid ${V.borderLight}`, height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, background: V.bg, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => nav("/dashboard")} style={{ background: "transparent", border: "none", color: V.textSecondary, cursor: "pointer", fontSize: 18, padding: 0 }}>☰</button>
            <span style={{ color: V.textTertiary }}>▸</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span>
            <button style={{ background: "transparent", border: "none", color: V.textSecondary, cursor: "pointer", fontSize: 14, padding: 0 }}>⟳</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{activeTab}</span>
            <button style={{ background: "transparent", border: "none", color: V.textSecondary, cursor: "pointer", fontSize: 18 }}>⋯</button>
          </div>
        </div>

        {renderContent()}
      </div>
      <ProductionChecklistSidebar isOpen={isChecklistOpen} onClose={() => setIsChecklistOpen(false)} p={p} />
    </div>
  );
};

const ProductionChecklistSidebar = ({ isOpen, onClose, p }: { isOpen: boolean, onClose: () => void, p: ProjInfo }) => {
  if (!isOpen) return null;

  const items = [
    { 
      id: "git", 
      title: "Connect Git Repository", 
      desc: "Get preview deployments for every push, and go live on your domain by merging to the production branch.", 
      done: true,
      svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
    },
    { 
      id: "domain", 
      title: "Add Custom Domain", 
      desc: "Buy a new domain or add an existing one to your project to serve production traffic from your own URL.", 
      done: true,
      svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
    },
    { 
      id: "preview", 
      title: "Preview Deployment", 
      desc: "Create and push to a new branch to create a preview deployment that allows you to see your changes before going to production.", 
      done: true,
      svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
    },
    { 
      id: "analytics", 
      title: "Enable Web Analytics", 
      desc: "Gain insights into your website's visitors with privacy-friendly tracking and real-time data.", 
      done: false, 
      action: "Enable",
      svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="m19 9-5 5-4-4-3 3"></path></svg>
    },
    { 
      id: "speed", 
      title: "Enable Speed Insights", 
      desc: "Monitor performance and Core Web Vitals to keep your site fast and optimized for search engines.", 
      done: true,
      svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
    },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", justifyContent: "flex-end" }}>
      <div 
        onClick={onClose} 
        style={{ 
          position: "absolute", inset: 0, 
          background: "rgba(0,0,0,0.4)", 
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)", 
          transition: "opacity 0.3s ease" 
        }} 
      />
      <div style={{ 
        position: "relative", width: "100%", maxWidth: 640, height: "100%", background: V.bg, 
        borderLeft: `1px solid ${V.border}`, display: "flex", flexDirection: "column", 
        boxShadow: "-20px 0 50px rgba(0,0,0,0.5)", animation: "slideIn .4s cubic-bezier(0.16, 1, 0.3, 1)" 
      }}>
        {/* Header Close Button */}
        <div style={{ padding: "16px 24px", display: "flex", justifyContent: "flex-end" }}>
          <button 
            onClick={onClose} 
            style={{ 
              background: "transparent", border: "none", cursor: "pointer", 
              color: V.textTertiary, padding: 8, borderRadius: 8, transition: "background .15s",
              display: "flex", alignItems: "center", justifyContent: "center"
            }} 
            onMouseEnter={e => e.currentTarget.style.background = "var(--gh-bg-secondary)"} 
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "0 48px 48px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ 
              width: 56, height: 56, borderRadius: "50%", background: "transparent", 
              border: `2px solid ${V.accent}`, display: "flex", alignItems: "center", 
              justifyContent: "center", margin: "0 auto 24px", color: V.accent,
              boxShadow: `0 0 20px rgba(0,112,243,0.15)`
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 12px", color: V.text, letterSpacing: "-0.02em" }}>Production Checklist</h2>
            <p style={{ fontSize: 14, color: V.textSecondary, lineHeight: 1.6, maxWidth: 460, margin: "0 auto" }}>
              Get the most from TrackCodex as you prepare to take your project to production—review security and key feature settings.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {items.map((item) => (
              <div 
                key={item.id} 
                style={{ 
                  border: `1px solid ${item.done ? "rgba(0,112,243,0.3)" : "var(--gh-border)"}`, 
                  borderRadius: 14, padding: 24, 
                  background: item.done ? "rgba(0,112,243,0.03)" : "var(--gh-bg)",
                  transition: "all 0.2s ease",
                  position: "relative"
                }}
              >
                <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                  <div style={{ 
                    width: 40, height: 40, borderRadius: 10, background: V.bg, 
                    border: `1px solid ${V.border}`, display: "flex", alignItems: "center", 
                    justifyContent: "center", color: item.done ? V.accent : V.textTertiary,
                    flexShrink: 0
                  }}>
                    {item.svg}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: V.text }}>{item.title}</h3>
                      {item.done && (
                        <div style={{ 
                          width: 20, height: 20, borderRadius: "50%", background: V.accent, 
                          display: "flex", alignItems: "center", justifyContent: "center", color: V.text
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: V.textSecondary, marginBottom: item.done ? 0 : 20, lineHeight: 1.55 }}>{item.desc}</p>
                    
                    {!item.done && (
                      <div style={{ display: "flex", gap: 12 }}>
                        <button style={{ 
                          background: "#fff", color: V.bg, border: "none", borderRadius: 8, 
                          padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                          transition: "opacity .15s"
                        }} onMouseEnter={e => e.currentTarget.style.opacity = "0.9"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                          {item.action}
                        </button>
                        <button style={{ 
                          background: "transparent", color: V.textSecondary, border: `1px solid ${V.border}`, 
                          borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer",
                          transition: "background .15s"
                        }} onMouseEnter={e => e.currentTarget.style.background = "var(--gh-bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          Skip
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 40, borderTop: `1px solid ${V.border}`, paddingTop: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: V.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>Further reading</div>
            <div 
              style={{ 
                border: `1px solid ${V.border}`, borderRadius: 14, padding: "16px 20px", 
                display: "flex", gap: 16, alignItems: "center", cursor: "pointer", 
                background: V.bg, transition: "all 0.15s" 
              }} 
              onMouseEnter={e => { e.currentTarget.style.background = "var(--gh-bg-secondary)"; e.currentTarget.style.borderColor = "var(--gh-border)"; }} 
              onMouseLeave={e => { e.currentTarget.style.background = "var(--gh-bg)"; e.currentTarget.style.borderColor = "var(--gh-border)"; }}
            >
               <div style={{ width: 44, height: 44, borderRadius: "50%", background: V.bg, border: `1px solid ${V.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📖</div>
               <div style={{ flex: 1 }}>
                 <div style={{ fontSize: 14, fontWeight: 600, color: V.text }}>Production checklist for launch</div>
                 <div style={{ fontSize: 12, color: V.textSecondary, marginTop: 2, lineHeight: 1.4 }}>Comprehensive guidelines by the TrackCodex team to help you prepare your project.</div>
               </div>
               <div style={{ color: V.textTertiary, fontSize: 18 }}>›</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ padding: "20px 48px", borderTop: `1px solid ${V.border}`, display: "flex", justifyContent: "flex-end", background: V.bg }}>
          <button 
            onClick={onClose} 
            style={{ 
              background: "#fff", color: V.bg, border: "none", borderRadius: 8, 
              padding: "10px 32px", fontSize: 14, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 4px 12px rgba(255,255,255,0.1)"
            }}
          >
            Done
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideIn { 
          from { transform: translateX(100%); } 
          to { transform: translateX(0); } 
        }
      `}</style>
    </div>
  );
};

const OverviewTab = ({ p, done, onOpenChecklist }: { p: ProjInfo, done: number, onOpenChecklist: () => void }) => {
  const [isQRVisible, setIsQRVisible] = useState(false);

  return (
    <div style={{ padding: "24px 24px 40px" }}>
      {/* Production Deployment */}
      <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "12px 20px", background: V.card, borderBottom: `1px solid ${V.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Production Deployment</span>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn 
              href={p.repoUrl}
              style={{ background: V.bg, border: `1px solid ${V.border}`, borderRadius: 8, padding: "0 16px", color: V.text, display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, height: 32 }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              Repository
            </Btn>
            <Btn style={{ background: V.bg, border: `1px solid ${V.border}`, borderRadius: 8, padding: "0 16px", color: V.text, display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, height: 32 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Instant Rollback
            </Btn>
            <div style={{ display: "flex", border: `1px solid ${V.border}`, borderRadius: 8, overflow: "hidden", position: "relative", background: "#fff", height: 32, alignItems: "center" }}>
              <a href={`https://${p.domain}`} target="_blank" rel="noopener noreferrer" style={{ padding: "0 14px", fontSize: 13, fontWeight: 600, color: V.bg, background: "transparent", textDecoration: "none", fontFamily: V.font, display: "flex", alignItems: "center", height: "100%" }}>Visit</a>
              <button 
                onClick={() => setIsQRVisible(!isQRVisible)}
                style={{ padding: "0 8px", borderLeft: "1px solid #eaeaea", background: "transparent", border: "none", color: "#666", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}
                title="Show QR Code"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: isQRVisible ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              <VisitQRCodePopup isOpen={isQRVisible} onClose={() => setIsQRVisible(false)} domain={p.domain} />
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

              {/* TrackCodex icon */}
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
                <div style={{ display: "flex", gap: 8 }}>
                  <button 
                    onClick={onOpenChecklist} 
                    title="Edit"
                    style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${V.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background .15s", background: "transparent", padding: 0 }} 
                    onMouseEnter={e => e.currentTarget.style.background = V.cardHover} 
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={V.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${V.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background .15s" }} onMouseEnter={e => e.currentTarget.style.background = V.cardHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={V.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                  </div>
                </div>
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
  );
};

const DeploymentsTab = ({ p }: { p: ProjInfo }) => {
  const [tab, setTab] = useState("All");
  return (
  <div style={{ padding: "32px 24px 60px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>Deployments</div>
    </div>
    
    <div style={{ display: "flex", gap: 32, borderBottom: `1px solid ${V.borderLight}`, marginBottom: 32 }}>
      {["All", "Production", "Preview"].map((t) => (
        <div key={t} onClick={() => setTab(t)} style={{ paddingBottom: 12, fontWeight: tab === t ? 500 : 400, color: tab === t ? V.text : V.textSecondary, borderBottom: tab === t ? `2px solid ${V.text}` : "2px solid transparent", cursor: "pointer", fontSize: 14 }}>
          {t}
        </div>
      ))}
    </div>

    <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${V.borderLight}`, background: V.card, display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 13, color: V.textSecondary }}>Filter by branch...</span>
      </div>
      {(tab === "All" || tab === "Production") ? [0, 1, 2].map((i) => (
        <div key={i} style={{ padding: "20px", borderBottom: i < 2 ? `1px solid ${V.borderLight}` : "none", display: "flex", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ width: 120, height: 75, background: V.card, border: `1px solid ${V.borderLight}`, borderRadius: 6 }}></div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{p.deployUrl}</span>
                {i === 0 && <span style={{ padding: "2px 8px", background: V.text, color: V.bg, fontSize: 11, fontWeight: 600, borderRadius: 12 }}>Current</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: V.textSecondary, marginBottom: 8 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0a0" }}></div> Ready</span>
                <span>• {i === 0 ? "7m" : i === 1 ? "2d" : "5d"} ago by {p.createdBy}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: "monospace" }}>
                <span>{p.branch}</span>
                <span style={{ color: V.textSecondary }}>- {p.commitHash}</span>
              </div>
            </div>
          </div>
          <button style={{ background: "transparent", border: "none", color: V.textSecondary, cursor: "pointer", fontSize: 20 }}>⋮</button>
        </div>
      )) : (
        <div style={{ padding: 60, textAlign: "center", color: V.textSecondary }}>No preview deployments found.</div>
      )}
    </div>
  </div>
  );
};

const LogsTab = ({ p }: { p: ProjInfo }) => (
  <div style={{ height: "calc(100vh - 48px)", display: "flex", flexDirection: "column" }}>
    <div style={{ padding: "16px 24px", borderBottom: `1px solid ${V.borderLight}`, display: "flex", gap: 12, background: V.bg }}>
      <div style={{ display: "flex", alignItems: "center", height: 32, background: V.card, border: `1px solid ${V.border}`, borderRadius: 6, padding: "0 12px", gap: 8, width: 300 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={V.textSecondary} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <span style={{ fontSize: 13, color: V.textSecondary }}>Search logs...</span>
      </div>
      <Btn style={{ padding: "0 12px", height: 32 }}>All Sources ▾</Btn>
      <Btn style={{ padding: "0 12px", height: 32 }}>All Levels ▾</Btn>
    </div>
    <div style={{ flex: 1, background: V.card, padding: 24, overflowY: "auto", fontFamily: "monospace", fontSize: 12, color: V.textSecondary }}>
      <div style={{ marginBottom: 8 }}><span style={{ color: V.textTertiary, marginRight: 16 }}>14:32:01.041</span> INIT_START Runtime Version: nodejs18.x</div>
      <div style={{ marginBottom: 8 }}><span style={{ color: V.textTertiary, marginRight: 16 }}>14:32:01.295</span> <span style={{ color: V.accent }}>INFO</span> Server listening on port 3000</div>
      <div style={{ marginBottom: 8 }}><span style={{ color: V.textTertiary, marginRight: 16 }}>14:32:05.882</span> <span style={{ color: V.accent }}>INFO</span> GET /api/user 200 45ms</div>
      <div style={{ marginBottom: 8 }}><span style={{ color: V.textTertiary, marginRight: 16 }}>14:35:12.109</span> <span style={{ color: V.accent }}>INFO</span> GET /dashboard 200 120ms</div>
      <div style={{ marginBottom: 8, color: "#f87171" }}><span style={{ color: V.textTertiary, marginRight: 16 }}>14:41:03.444</span> ERR  Failed to load resource: net::ERR_CONNECTION_REFUSED</div>
    </div>
  </div>
);

const AnalyticsTab = () => {
  const [tab, setTab] = useState("Visitors");
  return (
   <div style={{ padding: "32px 24px 60px" }}>
    <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Web Analytics</div>
    
    <div style={{ display: "flex", gap: 32, borderBottom: `1px solid ${V.borderLight}`, marginBottom: 32 }}>
      {["Visitors", "Pageviews", "Custom Events", "Referrers", "Countries", "OS", "Browsers"].map((t) => (
        <div key={t} onClick={() => setTab(t)} style={{ paddingBottom: 12, fontWeight: tab === t ? 500 : 400, color: tab === t ? V.text : V.textSecondary, borderBottom: tab === t ? `2px solid ${V.text}` : "2px solid transparent", cursor: "pointer", fontSize: 14 }}>
          {t}
        </div>
      ))}
    </div>

    {tab === "Visitors" && (
      <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, padding: 40, textAlign: "center", background: V.card }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Enable Web Analytics</div>
        <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
          Get insights into your website's traffic, visitors, and performance with TrackCodex Web Analytics.
        </div>
        <Btn style={{ background: V.text, color: V.bg, border: "none" }}>Enable</Btn>
      </div>
    )}
    
    {tab !== "Visitors" && (
      <div style={{ padding: 40, textAlign: "center", color: V.textSecondary }}>Analytics data for {tab} is not available yet.</div>
    )}
  </div>
  );
};

const SpeedInsightsTab = () => (
   <div style={{ padding: "32px 24px 60px" }}>
    <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Speed Insights</div>
    <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, padding: 40, textAlign: "center", background: V.card }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Enable Speed Insights</div>
      <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
        Measure Core Web Vitals from your actual users and get actionable insights to improve performance.
      </div>
      <Btn style={{ background: V.text, color: V.bg, border: "none" }}>Enable</Btn>
    </div>
  </div>
);

const ChartCard = ({ title, children, hasChevron = true }: { title: string, children: React.ReactNode, hasChevron?: boolean }) => (
  <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, padding: "16px 20px", background: V.bg, display: "flex", flexDirection: "column", gap: 16 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: V.text }}>{title}</span>
      {hasChevron && <span style={{ fontSize: 13, color: V.textTertiary, cursor: "pointer" }}>›</span>}
    </div>
    {children}
  </div>
);

const ObservabilityOverview = () => {

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 8 }}>
      {/* Filters */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ padding: "6px 12px", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 6, fontSize: 13, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", color: V.text }}>
          Production <span style={{ fontSize: 10, color: V.textTertiary }}>▾</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 0, border: `1px solid ${V.border}`, borderRadius: 6, overflow: "hidden" }}>
           <div style={{ padding: "6px 10px", background: V.bg, borderRight: `1px solid ${V.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={V.textTertiary} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
           </div>
           <div style={{ padding: "6px 12px", background: V.bg, fontSize: 13, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", color: V.text }}>
             Last 12 hours <span style={{ fontSize: 10, color: V.textTertiary }}>▾</span>
           </div>
        </div>
      </div>

      {/* Banner */}
      <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, padding: "12px 20px", background: "linear-gradient(90deg, var(--gh-bg), var(--gh-bg-secondary))", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: V.textSecondary }}>
           <span style={{ color: V.text, filter: "drop-shadow(0 0 4px #fff)" }}>✦</span>
           Unlock anomaly alerts, custom queries, 30-day retention, and more with Pro and Observability Plus.
        </div>
        <Btn style={{ background: "#fff", color: V.bg, border: "none", padding: "6px 16px", fontSize: 12, fontWeight: 600 }}>Upgrade to Pro</Btn>
      </div>

      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <ChartCard title="Edge Requests">
          <div style={{ height: 160, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", gap: 16, fontSize: 11, color: V.textTertiary, marginBottom: 16 }}>
               <span style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0070f3" }}></div> 2XX</span>
               <span style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "#666" }}></div> 3XX</span>
               <span style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f5a623" }}></div> 4XX</span>
            </div>
            <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "flex-end", gap: 4, padding: "0 4px", borderBottom: `1px solid ${V.borderLight}` }}>
               {/* Vertical grid lines */}
               {[0.2, 0.4, 0.6, 0.8].map(p => <div key={p} style={{ position: "absolute", left: 0, right: 0, bottom: `${p * 100}%`, height: 1, background: V.borderLight, opacity: 0.3 }}></div>)}
               
               {[12, 28, 10, 32, 20, 8, 4, 10, 42, 25, 15, 18, 12, 6, 28, 22, 35, 12, 8, 25].map((h, i) => (
                 <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column-reverse", gap: 1 }}>
                    <div style={{ height: `${h * 2}px`, background: i % 4 === 0 ? "#f5a623" : i % 7 === 0 ? "#666" : "#0070f3", opacity: 0.9, borderRadius: "1px 1px 0 0" }}></div>
                 </div>
               ))}
               <div style={{ position: "absolute", left: -2, top: -4, fontSize: 10, color: V.textTertiary }}>40</div>
               <div style={{ position: "absolute", right: -4, bottom: -18, fontSize: 10, color: V.textTertiary }}>2m ago</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: V.textTertiary }}>
              <span>12h ago</span>
              <span></span>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Fast Data Transfer">
           <div style={{ height: 160, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", gap: 16, fontSize: 11, color: V.textTertiary, marginBottom: 16 }}>
               <span style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0070f3" }}></div> Outgoing <span style={{ color: V.text, fontWeight: 500 }}>19MB</span></span>
               <span style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f5a623" }}></div> Incoming <span style={{ color: V.text, fontWeight: 500 }}>686kB</span></span>
            </div>
            <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "flex-end", gap: 3, padding: "0 4px", borderBottom: `1px solid ${V.borderLight}` }}>
               {[0.25, 0.5, 0.75].map(p => <div key={p} style={{ position: "absolute", left: 0, right: 0, bottom: `${p * 100}%`, height: 1, background: V.borderLight, opacity: 0.3 }}></div>)}
               
               {[8, 35, 15, 50, 25, 12, 65, 38, 15, 28, 10, 22, 14, 8, 70, 40, 25, 15, 10, 32].map((h, i) => (
                 <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column-reverse", gap: 1 }}>
                    <div style={{ height: `${h}%`, background: i === 14 || i === 6 || i === 3 ? "#0070f3" : i % 5 === 0 ? "#f5a623" : "#0070f3", opacity: 0.9, borderRadius: "1px 1px 0 0" }}></div>
                 </div>
               ))}
               <div style={{ position: "absolute", left: -2, top: -4, fontSize: 10, color: V.textTertiary }}>2MB</div>
               <div style={{ position: "absolute", left: -2, top: "50%", fontSize: 10, color: V.textTertiary, marginTop: -5 }}>1MB</div>
               <div style={{ position: "absolute", left: -2, bottom: 2, fontSize: 10, color: V.textTertiary }}>OB</div>
               <div style={{ position: "absolute", right: -4, bottom: -18, fontSize: 10, color: V.textTertiary }}>2m ago</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: V.textTertiary }}>
              <span>12h ago</span>
              <span></span>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="TrackCodex Functions">
           <div style={{ height: 160, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", gap: 16, fontSize: 11, color: V.textTertiary, marginBottom: 16 }}>
               <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>Error <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff4d4f" }}></div> <span style={{ color: V.textTertiary }}>-</span></div>
               <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>Timeout <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f5a623" }}></div> <span style={{ color: V.textTertiary }}>-</span></div>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: V.textTertiary, borderBottom: `1px solid ${V.borderLight}`, background: "rgba(255,255,255,0.01)" }}>
               No data in this time range
            </div>
            <div style={{ position: "relative", height: 0 }}>
               <div style={{ position: "absolute", left: -2, bottom: 8, fontSize: 10, color: V.textTertiary }}>0%</div>
               <div style={{ position: "absolute", left: -2, bottom: 50, fontSize: 10, color: V.textTertiary }}>2%</div>
               <div style={{ position: "absolute", left: -2, bottom: 92, fontSize: 10, color: V.textTertiary }}>4%</div>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Compute">
           <div style={{ height: 160, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", gap: 16, fontSize: 11, color: V.textTertiary, marginBottom: 16 }}>
               <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>Active CPU <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0070f3" }}></div> <span style={{ color: V.textTertiary }}>-</span></div>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: V.textTertiary, borderBottom: `1px solid ${V.borderLight}`, background: "rgba(255,255,255,0.01)" }}>
               No data in this time range
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

const ObservabilityTab = ({ p, tab }: { p: ProjInfo, tab: string }) => {
  return (
   <div style={{ padding: "32px 24px 60px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>Observability — {tab}</div>
    </div>
    
    {tab === "Overview" ? (
      <ObservabilityOverview />
    ) : (
      <div style={{ padding: 40, textAlign: "center", color: V.textSecondary, border: `1px solid ${V.border}`, borderRadius: 12, background: V.card }}>
        Observability data for {tab} is not available yet.
      </div>
    )}
  </div>
  );
};

const FirewallTab = () => (
   <div style={{ padding: "32px 24px 60px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>Firewall</div>
      <Btn style={{ background: V.text, color: V.bg, border: "none" }}>Create Rule</Btn>
    </div>
    <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, padding: 40, textAlign: "center", background: V.card }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No Firewall Rules</div>
      <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
        Protect your application from malicious traffic and DDoS attacks with TrackCodex Web Application Firewall.
      </div>
      <Btn>Configure</Btn>
    </div>
  </div>
);

const CDNTab = () => (
   <div style={{ padding: "32px 24px 60px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>Edge Network</div>
    </div>
    <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, padding: 40, textAlign: "center", background: V.card }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🌍</div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Global Edge Network</div>
      <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
        Your application is automatically deployed to our global Edge Network for maximum performance.
      </div>
      <Btn>View Cache Settings</Btn>
    </div>
  </div>
);

const DomainsTab = ({ p }: { p: ProjInfo }) => (
   <div style={{ padding: "32px 24px 60px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>Domains</div>
      <Btn style={{ background: V.text, color: V.bg, border: "none" }}>Add Domain</Btn>
    </div>
    <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "20px", borderBottom: `1px solid ${V.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 16 }}>{p.deployUrl}</span>
            <span style={{ padding: "2px 8px", background: V.cardHover, border: `1px solid ${V.border}`, color: V.textSecondary, fontSize: 11, fontWeight: 600, borderRadius: 12 }}>Production</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: V.textSecondary }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0a0" }}></div> Valid Configuration</span>
            <span>•</span>
            <span>Assigned to main branch</span>
          </div>
        </div>
        <button style={{ background: "transparent", border: "none", color: V.textSecondary, cursor: "pointer", fontSize: 20 }}>⋮</button>
      </div>
      <div style={{ padding: "16px 20px", background: V.card, fontSize: 13, color: V.textSecondary, display: "flex", justifyContent: "space-between" }}>
        <span>Nameservers are correctly configured.</span>
        <span style={{ color: V.textTertiary }}>Refreshed 2m ago</span>
      </div>
    </div>
  </div>
);

const IntegrationsTab = () => (
   <div style={{ padding: "32px 24px 60px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>Integrations</div>
      <Btn>Browse Marketplace</Btn>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {[
        { name: "GitHub", desc: "Automatic deployments from your GitHub repositories.", status: "Connected" },
        { name: "Slack", desc: "Receive notifications about deployments and errors.", status: "Connected" },
        { name: "Upstash Redis", desc: "Serverless Redis for TrackCodex Functions and edge.", status: "Add" },
      ].map((int, i) => (
        <div key={i} style={{ border: `1px solid ${V.border}`, borderRadius: 12, padding: 24, background: V.card, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ width: 48, height: 48, background: V.bg, border: `1px solid ${V.borderLight}`, borderRadius: 8 }}></div>
            <Btn style={int.status === "Connected" ? { background: "transparent", borderColor: V.borderLight, color: V.textSecondary } : {}}>{int.status}</Btn>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{int.name}</div>
            <div style={{ color: V.textSecondary, fontSize: 14 }}>{int.desc}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const StorageTab = () => {
  const [tab, setTab] = useState("Postgres");
  return (
   <div style={{ padding: "32px 24px 60px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>Storage</div>
      <Btn style={{ background: V.text, color: V.bg, border: "none" }}>Create Data Store</Btn>
    </div>
    
    <div style={{ display: "flex", gap: 32, borderBottom: `1px solid ${V.borderLight}`, marginBottom: 32 }}>
      {["Postgres", "KV", "Blob", "Edge Config"].map((t) => (
        <div key={t} onClick={() => setTab(t)} style={{ paddingBottom: 12, fontWeight: tab === t ? 500 : 400, color: tab === t ? V.text : V.textSecondary, borderBottom: tab === t ? `2px solid ${V.text}` : "2px solid transparent", cursor: "pointer", fontSize: 14 }}>
          {t}
        </div>
      ))}
    </div>

    {tab === "Postgres" && (
      <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, padding: 40, textAlign: "center", background: V.card }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🐘</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No databases found</div>
        <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
          Create a serverless Postgres database to store relational data for your application.
        </div>
        <Btn style={{ background: V.text, color: V.bg, border: "none" }}>Create Database</Btn>
      </div>
    )}

    {tab === "KV" && (
      <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, padding: 40, textAlign: "center", background: V.card }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>KV Stores</div>
        <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
          Fast, globally distributed key-value storage for caching and rate limiting.
        </div>
        <Btn style={{ background: V.text, color: V.bg, border: "none" }}>Create KV Store</Btn>
      </div>
    )}

    {tab === "Blob" && (
      <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, padding: 40, textAlign: "center", background: V.card }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Blob Storage</div>
        <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
          Store large files like images, videos, and documents directly at the edge.
        </div>
        <Btn style={{ background: V.text, color: V.bg, border: "none" }}>Create Blob Store</Btn>
      </div>
    )}

    {tab === "Edge Config" && (
      <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, padding: 40, textAlign: "center", background: V.card }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚙️</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Edge Config</div>
        <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
          Read data instantly across all your edge functions without cold starts.
        </div>
        <Btn style={{ background: V.text, color: V.bg, border: "none" }}>Create Edge Config</Btn>
      </div>
    )}
  </div>
  );
};

const FlagsTab = () => (
   <div style={{ padding: "32px 24px 60px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>Feature Flags</div>
      <Btn style={{ background: V.text, color: V.bg, border: "none" }}>Create Flag</Btn>
    </div>
    <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, padding: 40, textAlign: "center", background: V.card }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚩</div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Manage Features Safely</div>
      <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
        Gradually roll out new features, perform A/B testing, and manage functionality without deploying new code.
      </div>
      <Btn>Get Started</Btn>
    </div>
  </div>
);

const AgentTab = () => (
   <div style={{ padding: "32px 24px 60px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>AI Agent</div>
    </div>
    <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, padding: 40, textAlign: "center", background: V.card }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>TrackCodex SDK for AI</div>
      <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
        Build conversational AI applications faster with our specialized SDK and streaming components.
      </div>
      <Btn>Explore SDK</Btn>
    </div>
  </div>
);

const AIGatewayTab = () => (
   <div style={{ padding: "32px 24px 60px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>AI Gateway</div>
      <Btn style={{ background: V.text, color: V.bg, border: "none" }}>Create Gateway</Btn>
    </div>
    <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, padding: 40, textAlign: "center", background: V.card }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Unify Your AI APIs</div>
      <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
        A specialized caching proxy for AI providers to improve performance, add rate limiting, and increase reliability.
      </div>
      <Btn>Learn More</Btn>
    </div>
  </div>
);

const SandboxesTab = () => (
   <div style={{ padding: "32px 24px 60px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>Sandboxes</div>
      <Btn style={{ background: V.text, color: V.bg, border: "none" }}>New Sandbox</Btn>
    </div>
    <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, padding: 40, textAlign: "center", background: V.card }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Code in the Browser</div>
      <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
        Spin up instant node.js environments or frontend frameworks right in your browser for rapid prototyping.
      </div>
      <Btn>Create Environment</Btn>
    </div>
  </div>
);

const UsageTab = ({ usageTab }: { usageTab: string }) => (
   <div style={{ padding: "32px 24px 60px" }}>
    <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Usage — {usageTab}</div>
    {usageTab === "Overview" ? (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {[
          { label: "Fast Data Transfer", val: "124 GB", limit: "1000 GB", pct: 12 },
          { label: "Edge Requests", val: "8.4M", limit: "10M", pct: 84 },
          { label: "Function Invocations", val: "2.1M", limit: "10M", pct: 21 },
          { label: "Function Execution", val: "450 GB-hrs", limit: "1000 GB-hrs", pct: 45 },
        ].map(s => (
          <div key={s.label} style={{ border: `1px solid ${V.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{s.label}</span>
              <span style={{ fontSize: 13, color: V.textSecondary }}>{s.val} / {s.limit}</span>
            </div>
            <div style={{ height: 6, background: V.borderLight, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", background: s.pct > 80 ? "#f5a623" : V.text, width: `${s.pct}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div style={{ padding: 40, textAlign: "center", color: V.textSecondary, border: `1px solid ${V.border}`, borderRadius: 12, background: V.card }}>
        Usage data for {usageTab} is currently being calculated.
      </div>
    )}
  </div>
);

const VisitQRCodePopup = ({ isOpen, onClose, domain }: { isOpen: boolean; onClose: () => void; domain: string }) => {
  if (!isOpen) return null;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://trackcodex.com/auth-redirect?url=${encodeURIComponent(`https://${domain}`)}`)}`;

  return (
    <div 
      style={{ 
        position: "fixed", 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 9999, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)"
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          width: 340, 
          background: V.bg, 
          border: `1px solid ${V.border}`, 
          borderRadius: 16, 
          boxShadow: "0 20px 50px rgba(0,0,0,0.8)", 
          color: V.text, 
          fontFamily: V.font,
          overflow: "hidden",
          animation: "popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes popIn {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
        
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${V.border}`, display: "flex", alignItems: "center", gap: 12, background: V.bg }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--gh-bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${V.border}` }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Visit with Toolbar</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#fff"} onMouseLeave={e => e.currentTarget.style.color = "#666"}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px 24px 12px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#888", textAlign: "left", lineHeight: 1.5 }}>
            Scan this QR code to open with the toolbar on a different device.
          </p>
          
          <div style={{ 
            position: "relative",
            width: "100%", 
            aspectRatio: "1/1", 
            background: "#fff", 
            borderRadius: 12, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            padding: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
          }}>
            <img src={qrUrl} alt="QR Code" style={{ width: "100%", height: "100%" }} />
            <div style={{ 
              position: "absolute", 
              width: 48, 
              height: 48, 
              background: V.bg, 
              borderRadius: 10, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
              border: "2px solid #fff",
              overflow: "hidden"
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: V.text, letterSpacing: -0.5 }}>TC</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>
            Get easy access to the toolbar on your production deployments.
          </div>
          <Btn 
            style={{ 
              width: "100%", 
              background: "#fff", 
              color: V.bg, 
              fontWeight: 700, 
              fontSize: 13, 
              height: 40, 
              borderRadius: 8, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              border: "none"
            }}
          >
            Install Extension
          </Btn>
        </div>
      </div>
    </div>
  );
};


const ProjectMembersSettings = () => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  return (
    <>
      <InviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Invite Section */}
      <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden", background: V.bg }}>
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 14, color: V.textSecondary }}>Invite new members by email address</div>
            <Btn 
              onClick={() => setIsInviteModalOpen(true)}
              style={{ background: "transparent", color: V.textSecondary, border: `1px solid ${V.border}` }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: -2 }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> Invite Link
            </Btn>
          </div>
          
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 2 }}>
              <div style={{ fontSize: 13, color: V.textSecondary, marginBottom: 8 }}>Email Address</div>
              <input type="text" placeholder="jane@example.com" style={{ width: "100%", height: 36, background: V.card, border: `1px solid ${V.border}`, borderRadius: 6, padding: "0 12px", color: V.text, fontSize: 14, fontFamily: V.font, outline: "none" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: V.textSecondary, marginBottom: 8 }}>Role</div>
              <div style={{ width: "100%", height: 36, background: V.card, border: `1px solid ${V.border}`, borderRadius: 6, padding: "0 12px", color: V.textSecondary, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                Select Role
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", marginTop: 8 }}>
            <Btn 
              onClick={() => setIsInviteModalOpen(true)}
              style={{ background: "transparent", color: V.textSecondary, border: `1px solid ${V.border}`, padding: "6px 12px", gap: 8 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
              Add more
            </Btn>
          </div>
        </div>
        
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${V.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: V.bg }}>
          <div style={{ fontSize: 13, color: V.textSecondary }}>This feature is available on the <span style={{ color: "#3291ff", cursor: "pointer" }}>Pro plan</span> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "inline", marginBottom: 2 }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>.</div>
          <Btn style={{ background: V.text, color: V.bg, border: "none" }}>Upgrade</Btn>
        </div>
      </div>

      {/* Tabs list (Team Members vs Pending) */}
      <div style={{ display: "flex", gap: 24, borderBottom: `1px solid ${V.border}`, marginBottom: -16 }}>
        <div style={{ paddingBottom: 12, fontSize: 14, color: V.text, fontWeight: 500, borderBottom: `2px solid ${V.text}`, cursor: "pointer" }}>Team Members</div>
        <div style={{ paddingBottom: 12, fontSize: 14, color: V.textSecondary, cursor: "pointer", transition: "color .15s" }} onMouseEnter={e => e.currentTarget.style.color = V.text} onMouseLeave={e => e.currentTarget.style.color = V.textSecondary}>Pending Invitations</div>
      </div>

      {/* Filter and Table Tools */}
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", height: 36, background: V.card, border: `1px solid ${V.border}`, borderRadius: 6, padding: "0 10px", gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={V.textSecondary} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" placeholder="Filter..." style={{ flex: 1, background: "transparent", border: "none", color: V.text, fontSize: 13, outline: "none", fontFamily: V.font }} />
        </div>
        
        <div style={{ height: 36, padding: "0 12px", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 6, display: "flex", alignItems: "center", gap: 24, cursor: "pointer", color: V.text, fontSize: 13, fontWeight: 500 }}>
          All Team Roles <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
        <div style={{ height: 36, padding: "0 12px", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 6, display: "flex", alignItems: "center", gap: 24, cursor: "pointer", color: V.text, fontSize: 13, fontWeight: 500 }}>
          2FA Status <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
        <div style={{ height: 36, padding: "0 12px", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 6, display: "flex", alignItems: "center", gap: 24, cursor: "pointer", color: V.text, fontSize: 13, fontWeight: 500 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg> Date</span> <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </div>

      {/* Members List Box */}
      <div style={{ border: `1px solid ${V.border}`, borderTop: `1px solid ${V.borderLight}`, borderRadius: 12, overflow: "hidden" }}>
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${V.borderLight}`, background: V.bg }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 14, height: 14, border: `1px solid ${V.border}`, borderRadius: 4, background: V.cardHover, cursor: "pointer" }}></div>
            <span style={{ fontSize: 13, color: V.textSecondary }}>Select all (1)</span>
          </div>
          <div style={{ color: V.text, cursor: "pointer", paddingLeft: 8, letterSpacing: 2, fontWeight: 700, fontSize: 18, marginTop: -8 }}>...</div>
        </div>
        
        {/* User Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: V.bg }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ width: 14, height: 14, border: `1px solid transparent` }}></div> {/* Spacer for checkbox */}
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(120deg, #0052d4, #4364f7, #6fb1fc)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 14, color: V.text, fontWeight: 500 }}>quantaforge25-2232</div>
              <div style={{ fontSize: 13, color: V.textSecondary }}>quantaforge25@gmail.com</div>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 13, color: V.textSecondary }}>Owner</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: V.textSecondary, fontSize: 13 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line><line x1="12" y1="8" x2="16" y2="12"></line><line x1="12" y1="16" x2="16" y2="12"></line></svg> 2FA
            </div>
            <div style={{ color: V.text, cursor: "pointer", marginLeft: 8, letterSpacing: 2, fontWeight: 700, fontSize: 18, marginTop: -8 }}>...</div>
          </div>
        </div>
      </div>

    </div>
    </>
  );
};

const ProjectDeploymentProtectionSettings = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Top Tabs */}
      <div style={{ display: "flex", gap: 24, borderBottom: `1px solid ${V.border}`, marginBottom: -8 }}>
        <div style={{ paddingBottom: 12, fontSize: 13, color: V.text, fontWeight: 500, borderBottom: `2px solid ${V.text}`, cursor: "pointer" }}>Projects</div>
        <div style={{ paddingBottom: 12, fontSize: 13, color: V.textSecondary, cursor: "pointer", transition: "color .15s" }} onMouseEnter={e => e.currentTarget.style.color = V.text} onMouseLeave={e => e.currentTarget.style.color = V.textSecondary}>External Access</div>
        <div style={{ paddingBottom: 12, fontSize: 13, color: V.textSecondary, cursor: "pointer", transition: "color .15s" }} onMouseEnter={e => e.currentTarget.style.color = V.text} onMouseLeave={e => e.currentTarget.style.color = V.textSecondary}>External Access Requests (1)</div>
      </div>

      {/* Default Protection Card */}
      <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden", background: V.bg }}>
        <div style={{ padding: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Default Protection</div>
          <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 24 }}>Configure the default deployment protection settings that will be applied to newly created projects in this team.</div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48, borderBottom: `1px solid ${V.borderLight}`, paddingBottom: 24 }}>
            <span style={{ fontSize: 14, color: V.text, fontWeight: 500, paddingRight: 8 }}>TrackCodex Authentication</span>
            <div style={{ width: 44, height: 24, background: V.cardHover, border: `1px solid ${V.border}`, borderRadius: 12, padding: 2, display: "flex", alignItems: "center", cursor: "pointer" }}>
              <div style={{ width: 20, height: 20, background: V.textSecondary, borderRadius: "50%" }}></div>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 14, height: 14, border: `1px solid ${V.border}`, borderRadius: 4, background: V.bg, cursor: "pointer" }}></div>
            <span style={{ fontSize: 13, color: V.textSecondary }}>Require Owner role to disable or change TrackCodex Authentication settings in projects</span>
          </div>
        </div>
        
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${V.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: V.bg }}>
          <div style={{ fontSize: 13, color: V.textSecondary }}>Learn more about <span style={{ color: "#3291ff", cursor: "pointer" }}>Deployment Protection <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "inline", marginBottom: 2 }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></span></div>
          <Btn style={{ background: V.card, color: V.textSecondary, border: `1px solid ${V.border}`, opacity: 0.5, cursor: "not-allowed" }}>Save</Btn>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 14, height: 14, border: `1px solid ${V.border}`, borderRadius: 4, background: V.bg, cursor: "pointer" }}></div>
          <span style={{ fontSize: 13, color: V.text, fontWeight: 500 }}>Select All</span>
        </div>
        
        <div style={{ flex: 1, display: "flex", alignItems: "center", height: 36, background: V.bg, border: `1px solid ${V.borderLight}`, borderRadius: 6, padding: "0 10px", gap: 8, marginLeft: 16 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={V.textSecondary} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" placeholder="Search projects..." style={{ flex: 1, background: "transparent", border: "none", color: V.text, fontSize: 13, outline: "none", fontFamily: V.font }} />
        </div>
        
        <div style={{ height: 36, padding: "0 16px", background: V.cardHover, border: `1px solid ${V.borderLight}`, borderRadius: 6, display: "flex", alignItems: "center", color: V.textSecondary, fontSize: 13, fontWeight: 500, opacity: 0.7, cursor: "not-allowed" }}>
          Protect Selected Projects
        </div>
        
        <div style={{ display: "flex", background: V.bg, border: `1px solid ${V.borderLight}`, borderRadius: 6, overflow: "hidden" }}>
          <div style={{ height: 36, padding: "0 12px", display: "flex", alignItems: "center", color: V.text, fontSize: 13, fontWeight: 500, background: V.cardHover, borderRight: `1px solid ${V.borderLight}`, cursor: "pointer" }}>
            All
          </div>
          <div style={{ height: 36, padding: "0 12px", display: "flex", alignItems: "center", color: "#f87171", fontSize: 13, gap: 6, cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            Unprotected (0)
          </div>
        </div>
      </div>

      {/* Projects List Box */}
      <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden", marginTop: -16 }}>
        {[
          { name: "trackcodex", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2z"/></svg> },
          { name: "support", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
          { name: "docs", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-0-2.5z"/><polyline points="10 2 10 22"/></svg> },
          { name: "browser", icon: <div style={{ width: 14, height: 14, background: "linear-gradient(135deg, #f5a623, #d0021b, #9013fe)", borderRadius: 2 }}></div> }
        ].map((proj, i) => (
          <div key={proj.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: V.bg, borderBottom: i !== 3 ? `1px solid ${V.borderLight}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 14, height: 14, border: `1px solid ${V.border}`, borderRadius: 4, background: V.bg, cursor: "pointer" }}></div>
              <div style={{ color: V.textSecondary, display: "flex", alignItems: "center", justifyContent: "center" }}>{proj.icon}</div>
              <div style={{ fontSize: 13, color: V.text, fontWeight: 500 }}>{proj.name}</div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 13, color: V.textSecondary }}>Standard Protection</span>
              <div style={{ color: V.cardHover, display: "flex", alignItems: "center", justifyContent: "center", background: V.textSecondary, borderRadius: "50%", width: 16, height: 16 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <div style={{ color: V.text, cursor: "pointer", marginLeft: 8, letterSpacing: 2, fontWeight: 700, fontSize: 18, marginTop: -8 }}>...</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProjectActivitySettings = () => {
  const activities = [
    { type: "alias", user: "somraj-dev", target: "trackcodex-3fn77kbdi-quantaforze.trackcodex.app", destination: "quantaforze.com", time: "8h" },
    { type: "alias", user: "somraj-dev", target: "trackcodex-3fn77kbdi-quantaforze.trackcodex.app", destination: "trackcodex.com", time: "8h" },
    { type: "alias", user: "somraj-dev", target: "trackcodex-3fn77kbdi-quantaforze.trackcodex.app", destination: "trackcodex-git-main-quantaforze.trackcodex.app", time: "8h" },
    { type: "alias", user: "somraj-dev", target: "trackcodex-3fn77kbdi-quantaforze.trackcodex.app", destination: "trackcodex-quantaforze.trackcodex.app", time: "8h" },
    { type: "deploy", user: "You", target: "trackcodex", hash: "3a3a733", branch: "main", destination: "production", time: "8h" },
    { type: "insight", user: "You", action: "enabled Speed Insights for project", target: "trackcodex", time: "8h" },
    { type: "alias", user: "somraj-dev", target: "trackcodex-1w1wza9ui-quantaforze.trackcodex.app", destination: "trackcodex.com", time: "9h" },
    { type: "alias", user: "somraj-dev", target: "trackcodex-1w1wza9ui-quantaforze.trackcodex.app", destination: "quantaforze.com", time: "9h" },
    { type: "alias", user: "somraj-dev", target: "trackcodex-1w1wza9ui-quantaforze.trackcodex.app", destination: "trackcodex-git-main-quantaforze.trackcodex.app", time: "9h" },
    { type: "alias", user: "somraj-dev", target: "trackcodex-1w1wza9ui-quantaforze.trackcodex.app", destination: "trackcodex-quantaforze.trackcodex.app", time: "9h" },
    { type: "deploy", user: "You", target: "trackcodex", hash: "0bcbc93", branch: "main", destination: "production", time: "9h" },
  ];

  return (
    <div>
      {/* Header Filters */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ height: 36, padding: "0 12px", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 6, display: "flex", alignItems: "center", gap: 32, cursor: "pointer", color: V.textSecondary, fontSize: 13, transition: "border-color .15s" }} onMouseEnter={e => e.currentTarget.style.borderColor = V.textSecondary} onMouseLeave={e => e.currentTarget.style.borderColor = V.border}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Search Project
            </div>
            <span style={{ fontSize: 10 }}>▾</span>
          </div>
          
          <div style={{ height: 36, padding: "0 12px", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 6, display: "flex", alignItems: "center", gap: 32, cursor: "pointer", color: V.text, fontSize: 13, transition: "border-color .15s" }} onMouseEnter={e => e.currentTarget.style.borderColor = V.textSecondary} onMouseLeave={e => e.currentTarget.style.borderColor = V.border}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              All Time
            </div>
            <span style={{ fontSize: 10 }}>▾</span>
          </div>
        </div>
        
        <Btn style={{ height: 36, background: V.bg, color: V.text, border: `1px solid ${V.border}` }}>Filter by Event</Btn>
      </div>

      {/* Date Header */}
      <div style={{ fontSize: 13, fontWeight: 700, color: V.text, marginBottom: 24 }}>March 2026</div>

      {/* Activity List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {activities.map((act, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid transparent` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: act.type === "insight" ? "#0070f3" : V.bg, border: act.type === "insight" ? "none" : `1px solid ${V.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {act.type === "insight" ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill={V.text}><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                )}
              </div>
              
              <div style={{ fontSize: 13, color: V.textSecondary, lineHeight: 1.5 }}>
                {act.type === "alias" && (
                  <>
                    <strong style={{ color: V.text, fontWeight: 500 }}>{act.user}</strong> aliased <strong style={{ color: V.text, fontWeight: 500 }}>{act.target}</strong> to <strong style={{ color: V.text, fontWeight: 500 }}>{act.destination}</strong>
                  </>
                )}
                {act.type === "deploy" && (
                  <>
                    <strong style={{ color: V.text, fontWeight: 500 }}>{act.user}</strong> deployed <strong style={{ color: V.text, fontWeight: 500 }}>{act.target}</strong> (<span style={{ color: V.textTertiary }}>{act.hash}</span> in <strong style={{ color: V.text, fontWeight: 500 }}>{act.branch}</strong>) to <strong style={{ color: V.text, fontWeight: 500 }}>{act.destination}</strong>
                  </>
                )}
                {act.type === "insight" && (
                  <>
                    <strong style={{ color: V.text, fontWeight: 500 }}>{act.user}</strong> {act.action} <strong style={{ color: V.text, fontWeight: 500 }}>{act.target}</strong>
                  </>
                )}
              </div>
            </div>
            
            <div style={{ fontSize: 13, color: V.textTertiary, flexShrink: 0 }}>{act.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProjectNotificationsSettings = () => {
  const sections = [
    { title: "Team", rows: ["Team join and role change requests"] },
    { title: "Deployments", rows: ["Deployment Access Requests", "Deployment Failures", "Deployment Promotions"] },
    { title: "Domains", rows: ["Configuration", "Renewals", "Transfers"] },
    { title: "Integrations", rows: ["Integration Updates"] },
    { title: "Edge Config", rows: ["Schema Validation Errors", "Size Limit Alerts"] },
  ];

  const Gear = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={V.textSecondary} strokeWidth="2" style={{ cursor: "pointer" }}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
  const Toggle = ({ on }: { on?: boolean }) => (
    <div style={{ width: 32, height: 18, background: on ? V.accent : V.cardHover, border: `1px solid ${on ? V.accent : V.border}`, borderRadius: 9, padding: 1, display: "flex", alignItems: "center", justifyContent: on ? "flex-end" : "flex-start", cursor: "pointer" }}>
      <div style={{ width: 14, height: 14, background: "#fff", borderRadius: "50%", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}></div>
    </div>
  );
  const Check = ({ on }: { on?: boolean }) => (
    <div style={{ width: 14, height: 14, border: `1px solid ${on ? V.accent : V.border}`, background: on ? V.accent : "transparent", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
      {on && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Channels Section */}
      <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden", background: V.bg }}>
        {[
          { icon: "🔔", title: "Web", sub: "Receive notifications in the TrackCodex dashboard.", on: true },
          { icon: "@", title: "Email", sub: "quantaforge25@gmail.com", on: true, settings: true },
          { icon: "📱", title: "Push", sub: "Receive notifications on desktop or mobile.", on: true, settings: true, badge: "Notifications Blocked" },
          { icon: "📞", title: "SMS", sub: "No phone number.", on: false, settings: true },
        ].map((item, i) => (
          <div key={item.title} style={{ padding: "16px 20px", borderBottom: `1px solid ${V.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${V.borderLight}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: V.textSecondary }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: V.text, display: "flex", alignItems: "center", gap: 8 }}>
                  {item.title}
                  {item.badge && <span style={{ fontSize: 10, background: "rgba(255, 0, 0, 0.1)", color: "#ff4d4f", padding: "1px 6px", borderRadius: 10, fontWeight: 600 }}>{item.badge}</span>}
                </div>
                <div style={{ fontSize: 13, color: V.textSecondary }}>{item.sub}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {item.settings && <Gear />}
              <Toggle on={item.on} />
            </div>
          </div>
        ))}
        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${V.borderLight}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: V.textSecondary }}>🔇</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: V.text }}>Mute</div>
              <div style={{ fontSize: 13, color: V.textSecondary }}>Select projects to mute notifications for.</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: V.text, display: "flex", alignItems: "center", gap: 8, border: `1px solid ${V.border}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>
            No projects <span style={{ fontSize: 10 }}>↕</span>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {sections.map(sec => (
          <div key={sec.title}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${V.borderLight}`, paddingBottom: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: V.text }}>{sec.title}</span>
              <div style={{ display: "flex", gap: 16 }}>
                <span style={{ width: 32, textAlign: "center", fontSize: 12, fontWeight: 600, color: V.text }}>Push</span>
                <span style={{ width: 32, textAlign: "center", fontSize: 12, fontWeight: 600, color: V.text }}>Email</span>
                <span style={{ width: 32, textAlign: "center", fontSize: 12, fontWeight: 600, color: V.text }}>Web</span>
              </div>
            </div>
            {sec.rows.map((row, i) => (
              <div key={row} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: i === sec.rows.length - 1 ? "none" : `1px solid ${V.borderLight}` }}>
                <span style={{ fontSize: 13, color: V.textSecondary }}>{row}</span>
                <div style={{ display: "flex", gap: 16 }}>
                  <div style={{ width: 32, display: "flex", justifyContent: "center" }}><Check on={true} /></div>
                  <div style={{ width: 32, display: "flex", justifyContent: "center" }}><Check on={row !== "Deployment Promotions"} /></div>
                  <div style={{ width: 32, display: "flex", justifyContent: "center" }}><Check on={row !== "Deployment Promotions"} /></div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div style={{ border: `1px solid ${V.borderLight}`, borderRadius: 8, padding: "12px 16px", display: "flex", gap: 12, background: V.cardHover }}>
        <div style={{ color: V.textSecondary, paddingTop: 2 }}>ⓘ</div>
        <div style={{ fontSize: 13, color: V.textSecondary, lineHeight: 1.5 }}>
          Comment notifications are managed per deployment, change your preference via the toolbar menu. <span style={{ color: "#3291ff", cursor: "pointer" }}>Learn More →</span>
        </div>
      </div>
    </div>
  );
};

const SettingsTab = ({ p, tab }: { p: ProjInfo, tab: string }) => {
  return (
   <div style={{ padding: "32px 24px 60px" }}>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: ["Members", "Deployment Protection", "Activity", "My Notifications"].includes(tab) ? 8 : 24 }}>
        {tab === "Members" ? "Members" : tab === "Deployment Protection" ? "Deployment Protection" : tab === "Activity" ? "Activity" : tab === "My Notifications" ? "Notifications" : "Project Settings"}
      </div>
      {tab === "Members" && <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 32 }}>Manage team members and invitations</div>}
      {tab === "Deployment Protection" && <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 32 }}>Ensure deployments for your projects are protected, and manage external access to all of your deployments. <span style={{ color: "#3291ff", cursor: "pointer" }}>Learn more <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "inline", marginBottom: 2 }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></span></div>}
      {tab === "Activity" && <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 32 }}>View history of changes to your project</div>}
      {tab === "My Notifications" && <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 32 }}>Manage your personal notification settings for the Quantaforze team.</div>}

      {tab === "Members" && <ProjectMembersSettings />}
      {tab === "Deployment Protection" && <ProjectDeploymentProtectionSettings />}
      {tab === "Activity" && <ProjectActivitySettings />}
      {tab === "My Notifications" && <ProjectNotificationsSettings />}
      
      {tab === "General" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Project Name */}
          <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Project Name</div>
              <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 20 }}>This is your project's visible name within TrackCodex. For example, the name of your company or department.</div>
              <input type="text" defaultValue={p.name} style={{ width: "100%", maxWidth: 320, height: 40, background: V.bg, border: `1px solid ${V.border}`, borderRadius: 6, padding: "0 12px", color: V.text, fontSize: 14, fontFamily: V.font }} />
            </div>
            <div style={{ padding: "16px 24px", background: V.card, borderTop: `1px solid ${V.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: V.textSecondary }}>Please use 32 characters at maximum.</span>
              <Btn style={{ background: V.text, color: V.bg, border: "none" }}>Save</Btn>
            </div>
          </div>

          {/* Project URL */}
          <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Project URL</div>
              <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 20 }}>This is your project's URL namespace on TrackCodex. Within it, your team can inspect their projects, check out any recent activity, or configure settings to their liking.</div>
              <div style={{ display: "flex", alignItems: "center", maxWidth: 400 }}>
                <div style={{ height: 40, padding: "0 12px", background: V.cardHover, border: `1px solid ${V.border}`, borderRight: "none", borderRadius: "6px 0 0 6px", display: "flex", alignItems: "center", color: V.textSecondary, fontSize: 14 }}>trackcodex.com/</div>
                <input type="text" defaultValue={p.name.toLowerCase()} style={{ flex: 1, height: 40, background: V.bg, border: `1px solid ${V.border}`, borderRadius: "0 6px 6px 0", padding: "0 12px", color: V.text, fontSize: 14, fontFamily: V.font }} />
              </div>
            </div>
            <div style={{ padding: "16px 24px", background: V.card, borderTop: `1px solid ${V.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: V.textSecondary }}>Please use 48 characters at maximum.</span>
              <Btn style={{ background: V.text, color: V.bg, border: "none" }}>Save</Btn>
            </div>
          </div>

          {/* Project Avatar */}
          <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>Project Avatar</div>
                <div style={{ fontSize: 14, color: V.text, marginBottom: 4 }}>This is your project's avatar.</div>
                <div style={{ fontSize: 14, color: V.text }}>Click on the avatar to upload a custom one from your files.</div>
              </div>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#0051cb", border: `1px solid ${V.border}`, cursor: "pointer", backgroundImage: 'radial-gradient(circle at 50% 50%, #fff 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>
            </div>
            <div style={{ padding: "16px 24px", background: V.card, borderTop: `1px solid ${V.borderLight}` }}>
              <span style={{ fontSize: 13, color: V.textSecondary }}>An avatar is optional but strongly recommended.</span>
            </div>
          </div>

          {/* Preview Deployment Suffix */}
          <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Preview Deployment Suffix</div>
              <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 20 }}>By default, the URL of every new Preview Deployment ends with <span style={{ padding: "2px 6px", background: V.cardHover, border: `1px solid ${V.border}`, borderRadius: 4, fontFamily: "monospace", color: V.textSecondary }}>.trackcodex.app</span>. This setting allows you to choose your own custom domain in place of this suffix.</div>
              <div style={{ display: "flex", alignItems: "center", maxWidth: 400 }}>
                <div style={{ height: 40, padding: "0 12px", background: V.bg, border: `1px solid ${V.border}`, borderRight: "none", borderRadius: "6px 0 0 6px", display: "flex", alignItems: "center", color: V.textSecondary, fontSize: 14 }}>my-deployment.</div>
                <input type="text" disabled defaultValue="trackcodex.app" style={{ flex: 1, height: 40, background: V.cardHover, border: `1px solid ${V.border}`, borderRadius: "0 6px 6px 0", padding: "0 12px", color: V.textSecondary, fontSize: 14, fontFamily: V.font }} />
              </div>
            </div>
            <div style={{ padding: "16px 24px", background: V.card, borderTop: `1px solid ${V.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: V.textSecondary }}>This feature is available on the <span style={{ color: "#3291ff", cursor: "pointer" }}>Pro plan</span> for an additional $100 per month.</span>
              <Btn>Upgrade</Btn>
            </div>
          </div>

          {/* Project ID */}
          <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Project ID</div>
              <div style={{ fontSize: 14, color: V.text, marginBottom: 20 }}>This is your project's ID within TrackCodex.</div>
              <div style={{ display: "flex", alignItems: "center", width: "100%", maxWidth: 320 }}>
                <input type="text" readOnly value="prj_QT1mLzgDZwAuJx86H2SBEL" style={{ flex: 1, height: 40, background: V.cardHover, border: `1px solid ${V.border}`, borderRight: "none", borderRadius: "6px 0 0 6px", padding: "0 12px", color: V.text, fontSize: 14, fontFamily: "monospace" }} />
                <button style={{ height: 40, padding: "0 12px", background: V.bg, border: `1px solid ${V.border}`, borderRadius: "0 6px 6px 0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={V.textSecondary} strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
              </div>
            </div>
            <div style={{ padding: "16px 24px", background: V.card, borderTop: `1px solid ${V.borderLight}` }}>
              <span style={{ fontSize: 13, color: V.textSecondary }}>Used when interacting with the TrackCodex API.</span>
            </div>
          </div>

          {/* TrackCodex Toolbar */}
          <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>TrackCodex Toolbar</div>
              <div style={{ fontSize: 14, color: V.text, marginBottom: 24, fontWeight: 500 }}>Enable the TrackCodex Toolbar on your deployments.</div>
              
              <div style={{ display: "flex", gap: 32, marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: V.textSecondary, marginBottom: 8 }}>Pre-Production Deployments</div>
                  <div style={{ border: `1px solid ${V.border}`, borderRadius: 6, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", background: V.bg, fontSize: 14 }}>
                    <span>Default (on)</span>
                    <span style={{ color: V.textSecondary }}>▾</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: V.textSecondary, marginBottom: 8 }}>Production Deployments</div>
                  <div style={{ border: `1px solid ${V.border}`, borderRadius: 6, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", background: V.bg, fontSize: 14 }}>
                    <span>Default (on)</span>
                    <span style={{ color: V.textSecondary }}>▾</span>
                  </div>
                </div>
              </div>

              <div style={{ border: `1px solid ${V.borderLight}`, borderRadius: 6, padding: "12px 16px", display: "flex", gap: 12, background: V.cardHover, marginBottom: 24 }}>
                <div style={{ color: V.textSecondary, paddingTop: 2 }}>ⓘ</div>
                <div style={{ fontSize: 13, color: V.textSecondary, lineHeight: 1.5 }}>
                  To use the toolbar in production your team members need the <span style={{ color: "#3291ff", cursor: "pointer" }}>Chrome extension</span> or to enable the toolbar for that domain in the toolbar menu. Learn more about using the <span style={{ color: "#3291ff", cursor: "pointer" }}>toolbar in production.</span>
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${V.borderLight}`, paddingTop: 24 }}>
                <div style={{ fontSize: 14, color: V.text, marginBottom: 16 }}>Allow this setting to be overridden on the project level.</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 24, background: "#0070f3", borderRadius: 12, padding: 2, display: "flex", alignItems: "center", justifyContent: "flex-end", cursor: "pointer" }}>
                    <div style={{ width: 20, height: 20, background: "#fff", borderRadius: "50%", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}></div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Enabled</span>
                </div>
              </div>
            </div>
            <div style={{ padding: "16px 24px", background: V.card, borderTop: `1px solid ${V.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: V.textSecondary }}>Learn more about the <span style={{ color: "#3291ff", cursor: "pointer" }}>TrackCodex Toolbar</span></span>
              <Btn>Save</Btn>
            </div>
          </div>

          {/* Data Preferences */}
          <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Data Preferences</div>
              <div style={{ fontSize: 14, color: V.text, marginBottom: 16, lineHeight: 1.5 }}>TrackCodex may train on and share code and chat data with AI model providers for training purposes only. If you turn this off, we will not share data going forward for projects owned by this team.</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 24, background: "#0070f3", borderRadius: 12, padding: 2, display: "flex", alignItems: "center", justifyContent: "flex-end", cursor: "pointer" }}>
                  <div style={{ width: 20, height: 20, background: "#fff", borderRadius: "50%", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}></div>
                </div>
                <span style={{ fontSize: 14, color: V.textSecondary }}>Improve models with my data</span>
              </div>
            </div>
            <div style={{ padding: "16px 24px", background: V.card, borderTop: `1px solid ${V.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: V.textSecondary }}>Learn more about TrackCodex's <span style={{ color: "#3291ff", cursor: "pointer" }}>data sharing practices.</span></span>
              <Btn>Save</Btn>
            </div>
          </div>

          {/* Transfer */}
          <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Transfer</div>
              <div style={{ fontSize: 14, color: V.text }}>Transfer your projects to another team without downtime or workflow interruptions.</div>
            </div>
            <div style={{ padding: "16px 24px", background: V.card, borderTop: `1px solid ${V.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: V.textSecondary }}>Learn more about <span style={{ color: "#3291ff", cursor: "pointer" }}>Transferring Projects.</span></span>
              <Btn>Transfer</Btn>
            </div>
          </div>

          {/* Delete Project */}
          <div style={{ border: `1px solid red`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Delete Project</div>
              <div style={{ fontSize: 14, color: V.text, marginBottom: 24 }}>Permanently remove your Project and all of its contents from the TrackCodex platform. This action is not reversible — please continue with caution.</div>
              <div style={{ border: `1px solid ${V.border}`, borderRadius: 6, padding: "12px 16px", display: "flex", gap: 12, background: V.cardHover }}>
                <div style={{ color: V.textSecondary, paddingTop: 2 }}>ⓘ</div>
                <div style={{ fontSize: 13, color: V.textSecondary }}>
                  This will permanently delete the project <strong style={{ color: V.text }}>{p.name}</strong>, including all deployments, domains, and settings.
                </div>
              </div>
            </div>
            <div style={{ padding: "16px 24px", background: V.card, borderTop: `1px solid ${V.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: V.textSecondary }}>To delete your account, visit <span style={{ color: "#3291ff", cursor: "pointer" }}>Account Settings.</span></span>
              <Btn style={{ background: "red", color: V.text, border: "none" }}>Delete Project</Btn>
            </div>
          </div>
        </div>
      )}

      {tab === "Build and Deployment" && (
        <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 32 }}>
          <div style={{ padding: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Connected Git Repository</div>
            <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 20 }}>Connect your TrackCodex Project to a Git repository to automatically deploy every commit.</div>
            <div style={{ border: `1px solid ${V.borderLight}`, borderRadius: 8, padding: 16, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: V.cardHover, display: "flex", alignItems: "center", justifyContent: "center" }}>GH</div>
              <div>
                <div style={{ fontWeight: 500 }}>{p.deployUrl ? p.deployUrl.split('.')[0] : "user"}/{p.name}</div>
                <div style={{ fontSize: 13, color: V.textSecondary }}>Connected 5 days ago</div>
              </div>
            </div>
          </div>
          <div style={{ padding: "16px 24px", background: V.card, borderTop: `1px solid ${V.borderLight}`, display: "flex", justifyContent: "flex-end" }}>
            <Btn style={{ color: "#f87171", borderColor: "#f87171" }}>Disconnect</Btn>
          </div>
        </div>
      )}

      {tab === "Environment Variables" && (
        <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 32 }}>
          <div style={{ padding: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Environment Variables</div>
            <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 20 }}>Securely store secrets and configuration for your deployments.</div>
            
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              <input type="text" placeholder="Key" style={{ flex: 1, height: 40, background: V.bg, border: `1px solid ${V.border}`, borderRadius: 6, padding: "0 12px", color: V.text, fontSize: 14, fontFamily: V.font }} />
              <input type="text" placeholder="Value" style={{ flex: 1, height: 40, background: V.bg, border: `1px solid ${V.border}`, borderRadius: 6, padding: "0 12px", color: V.text, fontSize: 14, fontFamily: V.font }} />
              <Btn style={{ background: V.text, color: V.bg, border: "none" }}>Add</Btn>
            </div>

            <div style={{ border: `1px solid ${V.borderLight}`, borderRadius: 8 }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${V.borderLight}`, display: "flex", fontSize: 13, color: V.textSecondary, fontWeight: 500 }}>
                <div style={{ flex: 1 }}>Key</div>
                <div style={{ flex: 1 }}>Value</div>
                <div style={{ width: 100 }}>Environments</div>
              </div>
              <div style={{ padding: 40, textAlign: "center", fontSize: 14, color: V.textSecondary }}>No environment variables added.</div>
            </div>
          </div>
        </div>
      )}

      {!["General", "Build and Deployment", "Environment Variables", "Members"].includes(tab) && (
        <div style={{ padding: 40, textAlign: "center", color: V.textSecondary, border: `1px solid ${V.border}`, borderRadius: 12, background: V.card }}>
           Settings for {tab} are configured correctly.
        </div>
      )}
   </div>
  );
};

export default ProjectDetailView;
