import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { InviteModal } from '../components/modals/InviteModal';
import { projectService, EnvVar, DomainItem, DeploymentItem, ProjectMetric, AnalyticsSummary } from '../services/infra/projectService';
import { 
  LineChart, Line, AreaChart, Area, XAxis, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import "../styles/ProjectDetailView.css";

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
  customDomains: DomainItem[];
}

/* ─── Sparkline ─── */
const Sparkline = () => {
  const pts = [8, 12, 6, 18, 14, 22, 10, 16, 20, 24, 15, 28, 18, 12, 22, 16, 30, 20, 14, 26];
  const max = Math.max(...pts);
  const w = 200, h = 44;
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${(i / (pts.length - 1)) * w},${h - (p / max) * h}`).join(" ");
  return <svg viewBox={`0 0 ${w} ${h}`} className="pd-sparkline"><path d={d} fill="none" stroke="#3b82f6" strokeWidth="1.5" /></svg>;
};

/* ─── Button helper ─── */
const Btn = ({ children, onClick, href, style: extra, title, className, disabled }: { children: React.ReactNode; onClick?: () => void; href?: string; style?: React.CSSProperties; title?: string; className?: string; disabled?: boolean }) => {
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className={`pd-btn-base ${className || ""}`} style={extra} title={title}>{children}</a>;
  return <button onClick={onClick} className={`pd-btn-base ${className || ""}`} style={extra} title={title} disabled={disabled}>{children}</button>;
};

/* ─── Search Items Builder ─── */
const buildSearchItems = (setActiveTab: (t: string) => void, setSettingsTab: (t: string) => void, setObservabilityTab: (t: string) => void, setUsageTab: (t: string) => void) => [
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
const ProjectSearchModal = ({ isOpen, onClose, items, onSelect }: { isOpen: boolean, onClose: () => void, items: any[], onSelect: (i: { action: () => void }) => void }) => {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setSearch("");
        setSelectedIndex(0);
        inputRef.current?.focus();
      }, 50);
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7d8590" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              id="pd-page-search"
              ref={inputRef}
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Search project pages..."
              aria-label="Search project pages"
              className="flex-1 bg-transparent text-[14px] text-gh-text placeholder-gh-text-secondary border-none focus:ring-0 outline-none h-6 p-0"
              style={{ fontFamily: V.font }}
            />
            <button onClick={onClose} aria-label="Close search" className="text-gh-text-secondary text-xs px-2 py-1 hover:bg-gh-bg-tertiary rounded transition-colors border border-gh-border cursor-pointer">ESC</button>
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
  const [isProjectLoading, setIsProjectLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("openChecklist") === "true") {
      setIsChecklistOpen(true);
    }
  }, [searchParams]);

  // Initialize project state
  const [fetchedProject, setFetchedProject] = useState<ProjInfo | null>(null);
  let p: ProjInfo | null = fetchedProject;
  // Use fetched data if available, otherwise fallback
  useEffect(() => {
    if (!projectId) return;
    
    const fetchProject = async () => {
      setIsProjectLoading(true);
      try {
        const detail = await projectService.getProject(projectId);
        const slug = detail.name.toLowerCase().replace(/\s+/g, '-');
        setFetchedProject({
          name: detail.name,
          domain: detail.customDomains?.[0]?.domain || slug + ".trackcodex.com",
          altDomain: detail.customDomains?.[1]?.domain || undefined,
          repoUrl: detail.repoUrl || `https://trackcodex.com/repo/${detail.repoOwner || 'user'}/${detail.repoName || detail.name}`,
          deployUrl: slug + ".trackcodex.com",
          status: detail.latestStatus || 'Ready',
          createdAgo: detail.createdAgo ? new Date(detail.createdAgo).toLocaleDateString() : 'Just now',
          createdBy: detail.createdBy || 'somraj-dev',
          branch: detail.latestBranch || 'main',
          commitHash: detail.commitHash || '0000000',
          commitMsg: detail.commitMsg || 'No deployments yet',
          checklist: [], // Add checklist mapping if needed
          edgeReqs: 0,
          fnInvocations: 0,
          errorRate: '0%',
          customDomains: detail.customDomains || [],
        });
      } catch (err) {
        console.warn('[ProjectDetailView] API fetch failed, using fallback:', err);
      } finally {
        setIsProjectLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  // Use fetched data if available, otherwise fallback
  if (!p && fetchedProject) {
    p = fetchedProject;
  }
  
  if (!p) {
    const stateData = (location.state as { projectData?: any })?.projectData;
    if (stateData) {
      p = {
        name: stateData.name || projectId || "Unknown",
        domain: stateData.domain || `${projectId}.trackcodex.com`,
        repoUrl: stateData.repoUrl || `https://trackcodex.com/repo/somraj-dev/${projectId}`,
        deployUrl: `${(stateData.name || projectId || "project").toLowerCase().replace(/\s+/g, '-')}.trackcodex.com`,
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
        customDomains: [],
      };
    }
  }

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
  
  const doneCount = p ? p.checklist.filter((c: any) => c.done).length : 0;
  const searchItems = buildSearchItems(setActiveTab, setSettingsTab, setObservabilityTab, setUsageTab);

  const renderContent = () => {
    if (!p) return null;
    switch (activeTab) {
      case "Overview":
        return <OverviewTab p={p} done={doneCount} onOpenChecklist={() => setIsChecklistOpen(true)} />;
      case "Deployments":
        return <DeploymentsTab p={p} />;
      case "Logs":
        return <LogsTab p={p} />;
      case "Analytics":
        return <AnalyticsTab projectId={projectId || ""} />;
      case "Speed Insights":
        return <SpeedInsightsTab />;
      case "Observability":
        return <ObservabilityTab tab={observabilityTab} />;
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
    <div className="pd-view">
      {/* ── Left Sidebar ── */}
      <div className="pd-sidebar no-scrollbar">
        {activeTab === "Settings" ? (
          <>
            <div className="pd-sidebar-search">
              <button type="button" onClick={() => setIsSearchOpen(true)} className="pd-search-trigger" aria-label="Search project settings">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gh-text-secondary)" strokeWidth="1.5" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <span>Find...</span>
                <span className="pd-search-key" aria-hidden="true">F</span>
              </button>
            </div>
            <div className="pd-sidebar-back">
              <button onClick={() => setActiveTab("Overview")} className="pd-back-link" type="button">
                <span style={{ fontSize: 18, lineHeight: 1, position: "relative", top: -1 }} aria-hidden="true">‹</span> Settings
              </button>
            </div>
            <div className="pd-sidebar-nav" role="tablist" aria-label="Settings Categories">
              {["General", "Billing", "Build and Deployment", "Invoices", "Members", "Access Groups", "Agent", "Drains", "Webhooks", "Security & Privacy", "Deployment Protection", "Microfrontends", "Connectivity", "Environment Variables", "Activity", "My Notifications", "Apps"].map(t => (
                <button key={t} type="button" onClick={() => setSettingsTab(t)} className={`pd-nav-item ${settingsTab === t ? "active" : ""}`} role="tab" aria-selected={settingsTab === t ? "true" : "false"} title={`Settings: ${t}`}>
                  {t}
                </button>
              ))}
            </div>
          </>
        ) : activeTab === "Usage" ? (
          <div role="tablist" aria-label="Usage Categories" style={{ display: 'contents' }}>
            <div className="pd-sidebar-search">
              <button type="button" onClick={() => setIsSearchOpen(true)} className="pd-search-trigger" aria-label="Search project usage">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gh-text-secondary)" strokeWidth="1.5" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <span>Find...</span>
                <span className="pd-search-key" aria-hidden="true">F</span>
              </button>
            </div>
            <div className="pd-sidebar-back">
              <button onClick={() => setActiveTab("Overview")} className="pd-back-link" type="button">
                <span style={{ fontSize: 18, lineHeight: 1, position: "relative", top: -1 }} aria-hidden="true">‹</span> Usage
              </button>
            </div>
            <div className="pd-sidebar-nav">
              {["Overview", "Networking", "Incremental Static Regeneration", "Data Cache", "TrackCodex Functions", "Edge Functions", "Edge Middleware", "Edge Config", "Builds", "Artifacts", "Blob", "Queues", "Cron Jobs", "Drains", "Observability", "Image Optimization", "Flags", "BotID Requests", "Trace Spans", "Connectivity", "Sandbox"].map(t => (
                <button key={t} type="button" onClick={() => setUsageTab(t)} className={`pd-nav-item ${usageTab === t ? "active" : ""}`} role="tab" aria-selected={usageTab === t ? "true" : "false"} title={`Usage: ${t}`}>
                   <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 12, color: "var(--gh-text-tertiary)", width: 12, display: "flex", justifyContent: "center" }} aria-hidden="true">{t !== "Overview" && "›"}</span>
                      {t}
                   </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div role="tablist" aria-label="Main Navigation" style={{ display: 'contents' }}>
            <div className="pd-sidebar-search" style={{ marginBottom: 8 }}>
              <button type="button" onClick={() => setIsSearchOpen(true)} className="pd-search-trigger" aria-label="Search project pages">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gh-text-secondary)" strokeWidth="1.5" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <span>Find...</span>
                <span className="pd-search-key" aria-hidden="true">F</span>
              </button>
            </div>
            {[
              { icon: "⬡", label: "Overview" },
              { icon: "⊞", label: "Deployments" },
              { icon: "☰", label: "Logs" },
              { icon: "↗", label: "Analytics" },
              { icon: "◎", label: "Speed Insights" },
              { icon: "◉", label: "Observability", chevron: true },
              { icon: "⊡", label: "Firewall", chevron: true },
              { icon: "⊕", label: "CDN", chevron: true },
            ].map((item) => (
              <button key={item.label} type="button" onClick={() => setActiveTab(item.label)} className={`pd-nav-item ${activeTab === item.label ? "active" : ""}`} role="tab" aria-selected={activeTab === item.label ? "true" : "false"} title={`View ${item.label}`}>
                <div className="pd-nav-item-content">
                  <span className="pd-nav-icon" aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.chevron && <span style={{ fontSize: 11, color: "var(--gh-text-tertiary)" }} aria-hidden="true">›</span>}
              </button>
            ))}
            <div className="pd-divider"></div>
            {[
              { icon: "⊞", label: "Domains" },
              { icon: "⊡", label: "Integrations" },
              { icon: "◎", label: "Storage" },
              { icon: "◉", label: "Flags", chevron: true },
              { icon: "⁂", label: "Agent", chevron: true },
              { icon: "⊛", label: "AI Gateway", chevron: true },
              { icon: "⊡", label: "Sandboxes" },
            ].map((item) => (
              <button key={item.label} type="button" onClick={() => setActiveTab(item.label)} className={`pd-nav-item ${activeTab === item.label ? "active" : ""}`} role="tab" aria-selected={activeTab === item.label ? "true" : "false"} title={`View ${item.label}`}>
                <div className="pd-nav-item-content">
                  <span className="pd-nav-icon" aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.chevron && <span style={{ fontSize: 11, color: "var(--gh-text-tertiary)" }} aria-hidden="true">›</span>}
              </button>
            ))}
            <div className="pd-divider"></div>
            {[
              { icon: "◔", label: "Usage" },
              { icon: "⚙", label: "Settings", chevron: true },
            ].map((item) => (
              <button key={item.label} type="button" onClick={() => setActiveTab(item.label)} className={`pd-nav-item ${activeTab === item.label ? "active" : ""}`} role="tab" aria-selected={activeTab === item.label ? "true" : "false"} title={`View ${item.label}`}>
                <div className="pd-nav-item-content">
                  <span className="pd-nav-icon" aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.chevron && <span style={{ fontSize: 11, color: "var(--gh-text-tertiary)" }} aria-hidden="true">›</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <ProjectSearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        items={searchItems} 
        onSelect={(item) => { item.action(); setIsSearchOpen(false); }} 
      />

      {/* ── Main Content ── */}
      <div className="pd-main no-scrollbar">
        <div className="pd-topbar">
          <div className="pd-topbar-left">
            <button onClick={() => nav("/dashboard")} className="pd-topbar-btn" title="Dashboard Menu">☰</button>
            <span className="pd-breadcrumb-sep">▸</span>
            <span className="pd-project-name">{p.name}</span>
            <button className="pd-topbar-btn" title="Refresh" style={{ fontSize: 14 }}>⟳</button>
          </div>
          <div className="pd-topbar-right">
            <span style={{ fontSize: 14, fontWeight: 500 }}>{activeTab}</span>
            <button className="pd-topbar-btn" title="More Options">⋯</button>
          </div>
        </div>
        {renderContent()}
      </div>
      <ProductionChecklistSidebar isOpen={isChecklistOpen} onClose={() => setIsChecklistOpen(false)} />
    </div>
  );
};

function ProductionChecklistSidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;

  const items = [
    { 
      id: "git", 
      title: "Connect Git Repository", 
      desc: "Get preview deployments for every push, and go live on your domain by merging to the production branch.", 
      done: true,
      svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.28 1.15-.28 2.35 0 3.5-1.25 1.05-1.08 2.25-1 3.5 0 3.5 3 5.5 6 5.5-.47.65-.8 1.4-1 2.2V22"></path></svg>
    },
    { 
      id: "domain", 
      title: "Add Custom Domain", 
      desc: "Buy a new domain or add an existing one to your project to serve production traffic from your own URL.", 
      done: true,
      svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
    },
    { 
      id: "preview", 
      title: "Preview Deployment", 
      desc: "Create and push to a new branch to create a preview deployment that allows you to see your changes before going to production.", 
      done: true,
      svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
    },
    { 
      id: "analytics", 
      title: "Enable Web Analytics", 
      desc: "Gain insights into your website's visitors with privacy-friendly tracking and real-time data.", 
      done: false, 
      action: "Enable",
      svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3v18h18"></path><path d="m19 9-5 5-4-4-3 3"></path></svg>
    },
    { 
      id: "speed", 
      title: "Enable Speed Insights", 
      desc: "Monitor performance and Core Web Vitals to keep your site fast and optimized for search engines.", 
      done: true,
      svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
    },
  ];

  return (
    <div className="pd-checklist-overlay">
      <div className="pd-checklist-backdrop" onClick={onClose} />
      <div className="pd-checklist-content">
        <div style={{ padding: "16px 24px", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} className="pd-topbar-btn" aria-label="Close checklist" style={{ color: "var(--gh-text-secondary)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "0 48px 48px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "transparent", border: `2px solid ${V.accent}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: V.accent, boxShadow: `0 0 20px rgba(0,112,243,0.15)` }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 12px", color: V.text, letterSpacing: "-0.02em" }}>Production Checklist</h2>
            <p style={{ fontSize: 14, color: V.textSecondary, lineHeight: 1.6, maxWidth: 460, margin: "0 auto" }}>
              Get the most from TrackCodex as you prepare to take your project to production—review security and key feature settings.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {items.map((item) => (
              <div key={item.id} style={{ border: `1px solid ${item.done ? "rgba(0,112,243,0.3)" : "var(--gh-border)"}`, borderRadius: 14, padding: 24, background: item.done ? "rgba(0,112,243,0.03)" : "var(--gh-bg)", transition: "all 0.2s ease", position: "relative" }}>
                <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: V.bg, border: `1px solid ${V.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: item.done ? V.accent : V.textTertiary, flexShrink: 0 }}>
                    {item.svg}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: V.text }}>{item.title}</h3>
                      {item.done && (
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: V.accent, display: "flex", alignItems: "center", justifyContent: "center", color: V.text }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: V.textSecondary, marginBottom: item.done ? 0 : 20, lineHeight: 1.55 }}>{item.desc}</p>
                    {!item.done && (
                      <div style={{ display: "flex", gap: 12 }}>
                        <button className="pd-btn-base" style={{ background: "var(--gh-text)", color: "var(--gh-bg)", border: "none" }}>{item.action}</button>
                        <button className="pd-btn-base" style={{ background: "transparent", color: V.textSecondary }}>Skip</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, borderTop: `1px solid ${V.border}`, paddingTop: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: V.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>Further reading</div>
            <div className="pd-card-header" style={{ borderRadius: 14, cursor: "pointer", transition: "all 0.15s" }}>
               <div style={{ width: 44, height: 44, borderRadius: "50%", background: V.bg, border: `1px solid ${V.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📖</div>
               <div style={{ flex: 1, padding: "0 16px" }}>
                 <div style={{ fontSize: 14, fontWeight: 600, color: V.text }}>Production checklist for launch</div>
                 <div style={{ fontSize: 12, color: V.textSecondary, marginTop: 2, lineHeight: 1.4 }}>Comprehensive guidelines by the TrackCodex team to help you prepare your project.</div>
               </div>
               <div style={{ color: V.textTertiary, fontSize: 18 }}>›</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "20px 48px", borderTop: `1px solid ${V.border}`, display: "flex", justifyContent: "flex-end", background: V.bg }}>
          <button onClick={onClose} className="pd-btn-base" style={{ background: "var(--gh-text)", color: "var(--gh-bg)", border: "none", padding: "10px 32px", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>Done</button>
        </div>
      </div>
    </div>
  );
};

function OverviewTab({ p, done, onOpenChecklist }: { p: ProjInfo, done: number, onOpenChecklist: () => void }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="pd-tab-container" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="pd-overview-header">
        <h2 className="pd-overview-title" style={{ fontSize: 16 }}>Production Deployment</h2>
        <div className="pd-overview-actions">
          <button className="pd-vercel-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21L12 12M12 12L3 3M12 12L21 3M12 12L3 21" /></svg>
            Repository
          </button>
          <button className="pd-vercel-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Instant Rollback
          </button>
          <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid var(--gh-border)" }}>
             <a href={`https://${p.deployUrl}`} target="_blank" rel="noopener noreferrer" className="pd-vercel-btn pd-vercel-btn-primary" style={{ border: "none", borderRadius: 0, height: 38 }}>Visit</a>
             <button className="pd-vercel-btn pd-vercel-btn-primary" style={{ border: "none", borderLeft: "1px solid var(--gh-bg)", borderRadius: 0, padding: "0 8px", width: 32 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
             </button>
          </div>
        </div>
      </div>

      <div className="pd-prod-card-vercel">
        <div className="pd-prod-card-main">
          <div className="pd-prod-preview-vercel" style={{ background: "var(--gh-bg-secondary)", padding: 0 }}>
             <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <div style={{ textAlign: "center", padding: 40, zIndex: 2 }}>
                   <div style={{ color: "var(--gh-text)", fontWeight: 900, fontSize: 36, marginBottom: 16, lineHeight: 1.1, letterSpacing: "-0.05em" }}>Accelerate your<br/>Development<br/>with TrackCodex</div>
                   <div style={{ fontSize: 11, color: "var(--gh-text-secondary)", maxWidth: 220, margin: "0 auto", lineHeight: 1.5 }}>Build, Collaborate, Ship with Confidence. TrackCodex is your ultimate project nursery.</div>
                </div>
                <div style={{ position: "absolute", bottom: 24, right: 24, width: 180, height: 130, background: "var(--gh-bg)", borderRadius: 10, boxShadow: "0 20px 50px rgba(0,0,0,0.3)", padding: 12, border: "1px solid var(--gh-border)", transform: "rotate(-2deg)" }}>
                   <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff5f56" }}></div>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffbd2e" }}></div>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#27c93f" }}></div>
                   </div>
                   <div style={{ fontSize: 8, color: "var(--gh-text)", fontFamily: "JetBrains Mono, monospace" }}>
                     <span style={{ color: "var(--primary-color)" }}>export default function</span> <span style={{ color: "var(--gh-text-secondary)" }}>App</span>() &#123;<br/>
                     &nbsp;&nbsp;<span style={{ color: "var(--primary-color)" }}>return</span> (<br/>
                     &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: "var(--gh-text)" }}>&lt;div&gt;New Project&lt;/div&gt;</span><br/>
                     &nbsp;&nbsp;);<br/>
                     &#125;
                   </div>
                </div>
             </div>
          </div>

          <div className="pd-prod-info-vercel">
            <div className="pd-info-item">
              <div className="pd-info-label">Deployment</div>
              <div className="pd-info-value" style={{ fontSize: 13, fontWeight: 700 }}>{p.deployUrl}</div>
            </div>
            <div className="pd-info-item">
              <div className="pd-info-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                 Domains <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
              </div>
              <div className="pd-info-value" style={{ gap: 16 }}>
                <a href={`https://${p.domain}`} target="_blank" rel="noopener noreferrer">{p.domain} <span style={{ opacity: 0.5 }}>↗</span></a>
                {p.altDomain && <a href={`https://${p.altDomain}`} target="_blank" rel="noopener noreferrer">{p.altDomain} <span style={{ opacity: 0.5 }}>↗</span></a>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 48 }}>
              <div className="pd-info-item">
                <div className="pd-info-label">Status</div>
                <div className="pd-status-pill-vercel">
                  <div className="pd-status-dot-vercel" style={{ background: "#50e3c2", boxShadow: "0 0 10px rgba(80,227,194,0.4)" }}></div>
                  <span style={{ color: "#fff" }}>Ready</span>
                </div>
              </div>
              <div className="pd-info-item">
                <div className="pd-info-label">Created</div>
                <div className="pd-info-value" style={{ fontWeight: 400 }}>
                  {p.createdAgo} by {p.createdBy}
                  <button style={{ background: "transparent", border: "none", color: "#888", padding: 0, display: "flex", cursor: "pointer" }}>
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="7 10 12 15 17 10"></polyline></svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="pd-info-item">
              <div className="pd-info-label">Source</div>
              <div className="pd-info-value" style={{ color: "#fff", fontWeight: 600 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 0 0 1-9 9"/></svg>
                {p.branch}
              </div>
              <div className="pd-info-value" style={{ fontSize: 13, gap: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M3 12h5"/><path d="M16 12h5"/></svg>
                   {p.commitHash.substring(0, 7)}
                </span>
                <span style={{ color: "#888", fontWeight: 400 }}>{p.commitMsg}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "0 32px 24px" }}>
            <div onClick={() => setIsSettingsOpen(!isSettingsOpen)} style={{ display: "flex", alignItems: "center", gap: 12, color: "#0070f3", fontSize: 14, cursor: "pointer", fontWeight: 500 }}>
               <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ transform: isSettingsOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>
                 <polyline points="9 18 15 12 9 6"></polyline>
               </svg>
               Deployment Settings
            </div>
        </div>

        {isSettingsOpen && (
          <div className="pd-expanded-settings">
            <div className="pd-settings-section">
              <div className="pd-settings-section-title">Build Settings</div>
              <div className="pd-settings-dashboard">
                <div className="pd-setting-item">
                  <div className="pd-setting-label">On-Demand Concurrent Builds</div>
                  <div className="pd-setting-value"><div className="pd-status-icon disabled">✕</div> Disabled</div>
                </div>
                <div className="pd-setting-item">
                  <div className="pd-setting-label">Build Machine</div>
                  <div className="pd-setting-value">Standard <span className="pd-setting-pill">4 vCPUs</span> <span className="pd-setting-pill">8 GB Memory</span></div>
                </div>
                <div className="pd-setting-item">
                  <div className="pd-setting-label">Prioritize Production Builds</div>
                  <div className="pd-setting-value"><div className="pd-status-icon enabled">✓</div> Enabled</div>
                </div>
              </div>
            </div>
            <div className="pd-settings-section">
              <div className="pd-settings-section-title">Runtime Settings</div>
              <div className="pd-settings-dashboard" style={{ gridTemplateRows: "repeat(3, auto)" }}>
                <div className="pd-setting-item">
                  <div className="pd-setting-label">Fluid Compute</div>
                  <div className="pd-setting-value"><div className="pd-status-icon enabled">✓</div> Enabled</div>
                </div>
                <div className="pd-setting-item">
                  <div className="pd-setting-label">Function CPU</div>
                  <div className="pd-setting-value">Standard <span className="pd-setting-pill">1 vCPU</span> <span className="pd-setting-pill">2 GB Memory</span></div>
                </div>
                <div className="pd-setting-item">
                  <div className="pd-setting-label">Node.js Version</div>
                  <div className="pd-setting-value">24.x</div>
                </div>
                <div className="pd-setting-item">
                  <div className="pd-setting-label">Deployment Protection</div>
                  <div className="pd-setting-value"><div className="pd-status-icon enabled">✓</div> Standard Protection</div>
                </div>
                <div className="pd-setting-item">
                  <div className="pd-setting-label">Skew Protection</div>
                  <div className="pd-setting-value"><div className="pd-status-icon disabled">✕</div> Disabled</div>
                </div>
                <div className="pd-setting-item">
                  <div className="pd-setting-label">Cold Start Prevention</div>
                  <div className="pd-setting-value"><div className="pd-status-icon disabled">✕</div> Disabled</div>
                </div>
                <div className="pd-setting-item">
                  <div className="pd-setting-label">Function Region</div>
                  <div className="pd-setting-value"><span className="pd-setting-badge">iad1</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pd-prod-card-footer">
          <div className="pd-footer-note">
            To update your Production Deployment, push to the <code style={{ color: "#fff", fontWeight: 600 }}>main</code> branch.
          </div>
          <div className="pd-footer-actions">
            <button className="pd-vercel-btn" style={{ height: 34 }}>
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 21v-7a5 4 0 1 1 5 4v3"/><path d="M12 21v-3a5 4 0 1 1 5 4v2"/></svg>
               Deployments
            </button>
            <button className="pd-vercel-btn" style={{ height: 34, width: 34, padding: 0, justifyContent: "center" }}>
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="pd-overview-grid-vercel">
        <div className="pd-vercel-card" onClick={onOpenChecklist} style={{ cursor: "pointer" }}>
          <div className="pd-vercel-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
               <span className="pd-vercel-card-title">Production Checklist</span>
               <span style={{ fontSize: 12, color: "#888" }}>{done}/5</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
          </div>
          <div className="pd-vercel-card-content" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
             {[
               { id: "repo", title: "Connect Git Repository", done: true, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/></svg> },
               { id: "domain", title: "Add Custom Domain", done: true, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
               { id: "preview", title: "Preview Deployment", done: true, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> },
               { id: "analytics", title: "Enable Web Analytics", done: false, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg> },
               { id: "speed", title: "Enable Speed Insights", done: true, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg> }
             ].map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 6, border: "1px solid #333", background: item.done ? "rgba(0,112,243,0.15)" : "#0a0a0a", color: item.done ? "#0070f3" : "#888", fontSize: 13, fontWeight: 500 }}>
                   <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ opacity: 0.8 }}>{item.icon}</span>
                      {item.title}
                   </div>
                   {item.done && <span>✓</span>}
                </div>
             ))}
          </div>
        </div>
        <div className="pd-vercel-card">
          <div className="pd-vercel-card-header">
             <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
               <span className="pd-vercel-card-title">Observability</span>
               <span style={{ fontSize: 12, color: "#888" }}>6h</span>
             </div>
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
          <div className="pd-vercel-card-content">
             <div className="pd-metric-item">
                <div className="pd-metric-header">
                   <div className="pd-info-label">Edge Requests</div>
                   <div style={{ fontSize: 16, fontWeight: 700 }}>178</div>
                </div>
                <div style={{ height: 40, marginTop: 12 }}><Sparkline /></div>
             </div>
             <div className="pd-metric-item">
                <div className="pd-metric-header">
                   <div className="pd-info-label">Function Invocations</div>
                   <div style={{ fontSize: 16, fontWeight: 700 }}>0</div>
                </div>
                <div className="pd-metric-bar-bg"><div className="pd-metric-bar-fill" style={{ width: 0 }}></div></div>
             </div>
             <div className="pd-metric-item">
                <div className="pd-metric-header">
                   <div className="pd-info-label">Error Rate</div>
                   <div style={{ fontSize: 16, fontWeight: 700 }}>0%</div>
                </div>
                <div className="pd-metric-bar-bg"><div className="pd-metric-bar-fill" style={{ width: 0 }}></div></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeploymentsTab({ p }: { p: ProjInfo & { deployments?: DeploymentItem[] } }) {
  const deployments = p.deployments || [];
  const [tab, setTab] = useState("All");

  return (
   <div className="pd-deployments-container">
    <div className="pd-deployments-header">
      <div className="pd-deployments-title">Deployments</div>
      <div style={{ display: "flex", gap: 12 }}>
         <Btn style={{ padding: "0 12px", height: 32 }} title="Filter by branches">All Branches ▾</Btn>
         <Btn style={{ padding: "0 12px", height: 32 }} title="Filter by environments">All Environments ▾</Btn>
      </div>
    </div>
    <div className="pd-tabs-bar" role="tablist" aria-label="Deployments filter">
      {["All", "Production", "Preview"].map((t) => (
        <button key={t} onClick={() => setTab(t)} className={`pd-tab-btn ${tab === t ? "active" : ""}`} role="tab" aria-selected={tab === t ? "true" : "false"} tabIndex={0}>{t}</button>
      ))}
    </div>
    <div className="pd-deployments-list">
      {deployments.length > 0 ? deployments.map((d) => (
        <div key={d.id} className="pd-deployment-row">
          <div style={{ display: "flex", gap: 16 }}>
            <div className="pd-deployment-icon-box" aria-hidden="true"><div className="pd-deployment-mock-icon"></div></div>
            <div className="pd-deployment-details">
              <div className="pd-deployment-url">{d.url}</div>
              <div className="pd-deployment-meta">
                <span className="pd-status-indicator">
                  <div className="dot" style={{ background: d.status === 'READY' ? "var(--success-color, #0a0)" : "var(--warning-color, #f5a623)" }}></div> 
                  {d.status}
                </span>
                <span>• {new Date(d.createdAt).toLocaleString()}</span>
              </div>
              <div className="pd-branch-commit">
                <span>{p.branch}</span>
                <span className="pd-commit-hash">- {d.commitHash?.substring(0, 7)}</span>
              </div>
            </div>
          </div>
          <Btn style={{ height: 32, padding: "0 12px" }} title={`View logs for deployment ${d.url}`}>View logs</Btn>
        </div>
      )) : (
        <div className="pd-empty-state">No deployments found.</div>
      )}
    </div>
   </div>
  );
}

function LogsTab({ p }: { p: ProjInfo }) {
  return (
   <div className="pd-logs-container">
    <div className="pd-logs-toolbar">
      <div className="pd-logs-search-box" role="search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input type="text" placeholder="Search logs..." aria-label="Search logs" className="pd-logs-search-input" />
      </div>
      <Btn className="pd-toolbar-btn" title="Filter log sources">All Sources ▾</Btn>
      <Btn className="pd-toolbar-btn" title="Filter log levels">All Levels ▾</Btn>
    </div>
    <div className="pd-logs-viewport" role="log" aria-live="polite">
      <div className="pd-log-line"><span className="pd-log-timestamp">14:32:01.041</span> INIT_START Runtime Version: nodejs18.x</div>
      <div className="pd-log-line"><span className="pd-log-timestamp">14:32:01.295</span> <span className="pd-log-level">INFO</span> Server listening on port 3000</div>
      <div className="pd-log-line"><span className="pd-log-timestamp">14:32:05.882</span> <span className="pd-log-level">INFO</span> GET /api/user 200 45ms</div>
      <div className="pd-log-line"><span className="pd-log-timestamp">14:35:12.109</span> <span className="pd-log-level">INFO</span> GET /dashboard 200 120ms</div>
    </div>
   </div>
  );
}

function AnalyticsTab({ projectId }: { projectId: string }) {
  const [activeSubTab, setActiveSubTab] = useState("Overview");
  const [metrics, setMetrics] = useState<ProjectMetric[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [m, s] = await Promise.all([projectService.getAnalytics(projectId), projectService.getAnalyticsSummary(projectId)]);
        setMetrics(m || []);
        setSummary(s || null);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  const chartData = metrics.map(m => ({
    time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    requests: m.requests,
    latency: m.avgLatency,
    bandwidth: Math.round(Number(m.bandwidth) / 1024 / 1024 * 100) / 100
  }));

  if (isLoading) return <div className="pd-loading-state">Loading analytics...</div>;

  return (
   <div className="pd-analytics-view">
    <div className="pd-analytics-header">
      <div className="pd-analytics-title">Web Analytics</div>
      <div className="flex gap-3"><Btn className="pd-toolbar-btn" title="Filter time range">Last 24 Hours ▾</Btn></div>
    </div>
    <div className="pd-analytics-summary-grid">
       <div className="pd-analytics-stat-card">
          <div className="pd-stat-label">Total Requests</div>
          <div className="pd-stat-value">{summary?.totalRequests.toLocaleString() || 0}</div>
       </div>
       <div className="pd-analytics-stat-card">
          <div className="pd-stat-label">Avg Latency</div>
          <div className="pd-stat-value">{summary?.avgLatency || 0} ms</div>
       </div>
       <div className="pd-analytics-stat-card">
          <div className="pd-stat-label">Error Rate</div>
          <div className={`pd-stat-value ${Number(summary?.errorRate) > 5 ? 'error' : ''}`}>{summary?.errorRate || "0.00"}%</div>
       </div>
       <div className="pd-analytics-stat-card">
          <div className="pd-stat-label">Bandwidth</div>
          <div className="pd-stat-value">{summary ? (Number(summary.totalBandwidth) / 1024 / 1024).toFixed(2) : 0} MB</div>
       </div>
    </div>
    <div className="pd-tabs-bar" role="tablist" aria-label="Analytics sub-tabs">
      {["Overview", "Real-time", "Visitors", "Performance"].map((t) => (
        <button key={t} onClick={() => setActiveSubTab(t)} className={`pd-tab-btn ${activeSubTab === t ? "active" : ""}`} role="tab" aria-selected={activeSubTab === t ? "true" : "false"} tabIndex={0}>{t}</button>
      ))}
    </div>
    {activeSubTab === "Overview" && (
      <div className="pd-overview-grid">
        <ChartCard title="Requests" hasChevron={false}>
          <div className="pd-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs><linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="time" hide />
                <Tooltip contentStyle={{ background: V.card, border: `1px solid ${V.border}`, borderRadius: 8 }} itemStyle={{ color: V.text }} />
                <Area type="monotone" dataKey="requests" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRequests)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Average Latency (ms)" hasChevron={false}>
          <div className="pd-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" hide />
                <Tooltip contentStyle={{ background: V.card, border: `1px solid ${V.border}`, borderRadius: 8 }} itemStyle={{ color: V.text }} />
                <Line type="monotone" dataKey="latency" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Bandwidth (MB)" hasChevron={false}>
          <div className="pd-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="time" hide />
                <Tooltip contentStyle={{ background: V.card, border: `1px solid ${V.border}`, borderRadius: 8 }} itemStyle={{ color: "#fff" }} />
                <Bar dataKey="bandwidth" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <div className="pd-analytics-feature-card">
          <div className="pd-feature-icon" aria-hidden="true">🚀</div>
          <div className="pd-feature-title">Edge Performance</div>
          <div className="pd-feature-desc">Your site is being served globally from {metrics.length} distinct edge locations.</div>
        </div>
      </div>
    )}
    {activeSubTab !== "Overview" && (
      <div className="pd-empty-data-card">
        <div className="pd-empty-icon" aria-hidden="true">📈</div>
        <div className="pd-feature-title">{activeSubTab} Data</div>
        <div className="pd-feature-desc">This data is currently being aggregated. Please check back in a few minutes.</div>
      </div>
    )}
  </div>
  );
}

function SpeedInsightsTab() {
  return (
   <div style={{ padding: "32px 24px 60px" }}>
    <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Speed Insights</div>
    <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, padding: 40, textAlign: "center", background: V.card }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Enable Speed Insights</div>
      <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>Measure Core Web Vitals from your actual users and get actionable insights to improve performance.</div>
      <Btn style={{ background: V.text, color: V.bg, border: "none" }}>Enable</Btn>
    </div>
  </div>
  );
}

function ChartCard({ title, children, hasChevron = true }: { title: string, children: React.ReactNode, hasChevron?: boolean }) {
  return (
   <div className="pd-analytics-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--gh-text)" }}>{title}</span>
      {hasChevron && <span style={{ fontSize: 13, color: "var(--gh-text-tertiary)", cursor: "pointer" }}>›</span>}
    </div>
    {children}
   </div>
  );
}

function ObservabilityOverview() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ padding: "6px 12px", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 6, fontSize: 13, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", color: V.text }}>Production <span style={{ fontSize: 10, color: V.textTertiary }}>▾</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 0, border: `1px solid ${V.border}`, borderRadius: 6, overflow: "hidden" }}>
           <div style={{ padding: "6px 10px", background: V.bg, borderRight: `1px solid ${V.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={V.textTertiary} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>
           <div style={{ padding: "6px 12px", background: V.bg, fontSize: 13, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", color: V.text }}>Last 12 hours <span style={{ fontSize: 10, color: V.textTertiary }}>▾</span></div>
        </div>
      </div>
      <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, padding: "12px 20px", background: "linear-gradient(90deg, var(--gh-bg), var(--gh-bg-secondary))", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: V.textSecondary }}><span style={{ color: V.text, filter: "drop-shadow(0 0 4px #fff)" }}>✦</span> Unlock anomaly alerts, custom queries, 30-day retention, and more with Pro and Observability Plus.</div>
        <Btn style={{ background: "#fff", color: V.bg, border: "none", padding: "6px 16px", fontSize: 12, fontWeight: 600 }}>Upgrade to Pro</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <ChartCard title="Edge Requests">
          <div style={{ height: 160, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", gap: 16, fontSize: 11, color: V.textTertiary, marginBottom: 16 }}>
               <span style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0070f3" }}></div> 2XX</span>
               <span style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "#666" }}></div> 3XX</span>
               <span style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f5a623" }}></div> 4XX</span>
            </div>
            <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "flex-end", gap: 4, padding: "0 4px", borderBottom: `1px solid ${V.borderLight}` }}>
               {[0.2, 0.4, 0.6, 0.8].map(p => <div key={p} style={{ position: "absolute", left: 0, right: 0, bottom: `${p * 100}%`, height: 1, background: V.borderLight, opacity: 0.3 }}></div>)}
               {[12, 28, 10, 32, 20, 8, 4, 10, 42, 25, 15, 18, 12, 6, 28, 22, 35, 12, 8, 25].map((h, i) => (
                 <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column-reverse", gap: 1 }}><div style={{ height: `${h * 2}px`, background: i % 4 === 0 ? "#f5a623" : i % 7 === 0 ? "#666" : "#0070f3", opacity: 0.9, borderRadius: "1px 1px 0 0" }}></div></div>
               ))}
               <div style={{ position: "absolute", left: -2, top: -4, fontSize: 10, color: V.textTertiary }}>40</div>
               <div style={{ position: "absolute", right: -4, bottom: -18, fontSize: 10, color: V.textTertiary }}>2m ago</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: V.textTertiary }}><span>12h ago</span><span></span></div>
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
                 <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column-reverse", gap: 1 }}><div style={{ height: `${h}%`, background: i === 14 || i === 6 || i === 3 ? "#0070f3" : i % 5 === 0 ? "#f5a623" : "#0070f3", opacity: 0.9, borderRadius: "1px 1px 0 0" }}></div></div>
               ))}
               <div style={{ position: "absolute", left: -2, top: -4, fontSize: 10, color: V.textTertiary }}>2MB</div>
               <div style={{ position: "absolute", left: -2, top: "50%", fontSize: 10, color: V.textTertiary, marginTop: -5 }}>1MB</div>
               <div style={{ position: "absolute", left: -2, bottom: 2, fontSize: 10, color: V.textTertiary }}>OB</div>
               <div style={{ position: "absolute", right: -4, bottom: -18, fontSize: 10, color: V.textTertiary }}>2m ago</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: V.textTertiary }}><span>12h ago</span><span></span></div>
          </div>
        </ChartCard>
        <ChartCard title="TrackCodex Functions">
           <div style={{ height: 160, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", gap: 16, fontSize: 11, color: V.textTertiary, marginBottom: 16 }}>
               <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>Error <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff4d4f" }}></div> <span style={{ color: V.textTertiary }}>-</span></div>
               <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>Timeout <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f5a623" }}></div> <span style={{ color: V.textTertiary }}>-</span></div>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: V.textTertiary, borderBottom: `1px solid ${V.borderLight}`, background: "rgba(255,255,255,0.01)" }}>No data in this time range</div>
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
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: V.textTertiary, borderBottom: `1px solid ${V.borderLight}`, background: "rgba(255,255,255,0.01)" }}>No data in this time range</div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

function ObservabilityTab({ tab }: { tab: string }) {
  return (
   <div style={{ padding: "32px 24px 60px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>Observability — {tab}</div>
    </div>
    {tab === "Overview" ? <ObservabilityOverview /> : (
      <div style={{ padding: 40, textAlign: "center", color: V.textSecondary, border: `1px solid ${V.border}`, borderRadius: 12, background: V.card }}>Observability data for {tab} is not available yet.</div>
    )}
  </div>
  );
}

function FirewallTab() {
  return (
   <div style={{ padding: "32px 24px 60px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>Firewall</div>
      <Btn style={{ background: V.text, color: V.bg, border: "none" }}>Create Rule</Btn>
    </div>
    <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, padding: 40, textAlign: "center", background: V.card }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No Firewall Rules</div>
      <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>Protect your application from malicious traffic and DDoS attacks with TrackCodex Web Application Firewall.</div>
      <Btn>Configure</Btn>
    </div>
  </div>
  );
}

function CDNTab() {
  return (
   <div style={{ padding: "32px 24px 60px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>Edge Network</div>
    </div>
    <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, padding: 40, textAlign: "center", background: V.card }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🌍</div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Global Edge Network</div>
      <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>Your application is automatically deployed to our global Edge Network for maximum performance.</div>
      <Btn>View Cache Settings</Btn>
    </div>
  </div>
  );
}

function DomainsTab({ p }: { p: ProjInfo }) {
  const { projectId } = useParams<{ projectId: string }>();
  const [domains, setDomains] = useState<DomainItem[]>(p.customDomains || []);
  const [newDomain, setNewDomain] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchDomains = async () => {
    if (!projectId) return;
    try {
      const list = await projectService.listDomains(projectId);
      setDomains(list);
    } catch (err) {
      console.error("Failed to fetch domains:", err);
    }
  };

  const handleAdd = async () => {
    if (!projectId || !newDomain) return;
    setLoading(true);
    try {
      await projectService.addDomain(projectId, { domain: newDomain });
      setNewDomain("");
      setIsAdding(false);
      await fetchDomains();
    } catch {
      alert("Failed to add domain. Make sure it's valid.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (did: string) => {
    if (!projectId || !window.confirm("Are you sure you want to remove this domain?")) return;
    try {
      await projectService.removeDomain(projectId, did);
      await fetchDomains();
    } catch {
      alert("Failed to remove domain.");
    }
  };

  return (
    <div style={{ padding: "32px 24px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Domains</div>
          <div style={{ fontSize: 13, color: V.textSecondary }}>Manage the domains that point to your production deployment.</div>
        </div>
        {!isAdding && (
          <Btn onClick={() => setIsAdding(true)} style={{ background: V.text, color: V.bg, border: "none", padding: "0 16px", height: 36 }}>Add Domain</Btn>
        )}
      </div>

      {isAdding && (
        <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, padding: 24, background: V.card, marginBottom: 32, animation: "slide-down 0.2s" }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>New Domain</div>
          <div style={{ display: "flex", gap: 12 }}>
            <input 
              type="text" 
              placeholder="example.com"
              value={newDomain}
              onChange={e => setNewDomain(e.target.value)}
              style={{ flex: 1, height: 38, background: V.bg, border: `1px solid ${V.border}`, borderRadius: 6, padding: "0 12px", color: V.text, fontSize: 13, outline: "none" }}
            />
            <Btn onClick={handleAdd} style={{ background: V.accent, color: "#fff", border: "none", minWidth: 80 }} disabled={loading}>
              {loading ? "Adding..." : "Add"}
            </Btn>
            <Btn onClick={() => setIsAdding(false)} style={{ background: "transparent", color: V.textSecondary }}>Cancel</Btn>
          </div>
          <div style={{ fontSize: 12, color: V.textSecondary, marginTop: 12 }}>
            Once added, you'll need to configure your DNS records to point to TrackCodex.
          </div>
        </div>
      )}

      <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden" }}>
        {/* Always show the TrackCodex default domain first */}
        <div style={{ padding: "24px", borderBottom: domains.length > 0 ? `1px solid ${V.borderLight}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center", background: V.card }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>{p.deployUrl}</span>
              <span className="pd-setting-pill" style={{ background: "#0070f3", color: "#fff", border: "none" }}>Production</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: V.textSecondary }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0a0" }}></div> Valid Configuration</span>
              <span>•</span>
              <span>Assigned to main branch</span>
            </div>
          </div>
          <Btn style={{ opacity: 0.5, cursor: "not-allowed" }} title="Default domain cannot be removed">⋮</Btn>
        </div>

        {domains.map((d) => (
          <div key={d.id} style={{ borderTop: `1px solid ${V.borderLight}` }}>
            <div style={{ padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: V.bg }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 16 }}>{d.domain}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: V.textSecondary }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.verified ? "#0a0" : "#f5a623" }}></div> 
                    {d.verified ? 'Valid Configuration' : 'Invalid Configuration'}
                  </span>
                  <span>•</span>
                  <span>Assigned to {d.gitBranch || 'main'} branch</span>
                </div>
              </div>
              <Btn onClick={() => handleRemove(d.id)} style={{ color: "#ff4d4f" }}>Remove</Btn>
            </div>
            {!d.verified && (
              <div style={{ padding: "16px 24px", background: "rgba(245,166,35,0.05)", borderTop: `1px solid rgba(245,166,35,0.2)`, fontSize: 13, color: "#f5a623" }}>
                DNS configuration required. Point a CNAME record for <strong>{d.domain}</strong> to <strong>{p.deployUrl}</strong>.
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40, border: `1px solid ${V.border}`, borderRadius: 12, padding: "24px 32px", background: "linear-gradient(to right, rgba(0,112,243,0.05), transparent)" }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Add custom domain names</div>
        <div style={{ fontSize: 13, color: V.textSecondary, lineHeight: 1.6, maxWidth: 600 }}>
          Your project already has a built-in domain, but you can add your own names as well.
          TrackCodex will automatically manage SSL certificates and routing for all added domains.
        </div>
      </div>
    </div>
  );
}

function IntegrationsTab() {
  return (
   <div style={{ padding: "32px 24px 60px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>Integrations</div>
      <Btn>Browse Marketplace</Btn>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {[
        { name: "TrackCodex", desc: "Automatic deployments from your repositories.", status: "Connected" },
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
}

function StorageTab() {
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
}

function FlagsTab() {
  return (
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
}

function AgentTab() {
  return (
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
}

function AIGatewayTab() {
  return (
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
}

function SandboxesTab() {
  return (
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
}

function UsageTab({ usageTab }: { usageTab: string }) {
  return (
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
}



function ProjectMembersSettings() {
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
}

function ProjectDeploymentProtectionSettings() {
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
}

function ProjectActivitySettings() {
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
}

function ProjectNotificationsSettings() {
  const sections = [
    { title: "Team", rows: ["Team join and role change requests"] },
    { title: "Deployments", rows: ["Deployment Access Requests", "Deployment Failures", "Deployment Promotions"] },
    { title: "Domains", rows: ["Configuration", "Renewals", "Transfers"] },
    { title: "Integrations", rows: ["Integration Updates"] },
    { title: "Edge Config", rows: ["Schema Validation Errors", "Size Limit Alerts"] },
  ];

  function Gear() { 
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={V.textSecondary} strokeWidth="2" style={{ cursor: "pointer" }}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
  }
  function Toggle({ on }: { on?: boolean }) {
    return (
    <div style={{ width: 32, height: 18, background: on ? V.accent : V.cardHover, border: `1px solid ${on ? V.accent : V.border}`, borderRadius: 9, padding: 1, display: "flex", alignItems: "center", justifyContent: on ? "flex-end" : "flex-start", cursor: "pointer" }}>
      <div style={{ width: 14, height: 14, background: "#fff", borderRadius: "50%", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}></div>
    </div>
    );
  }
  function Check({ on }: { on?: boolean }) {
    return (
    <div style={{ width: 14, height: 14, border: `1px solid ${on ? V.accent : V.border}`, background: on ? V.accent : "transparent", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
      {on && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
    </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Channels Section */}
      <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden", background: V.bg }}>
        {[
          { icon: "🔔", title: "Web", sub: "Receive notifications in the TrackCodex dashboard.", on: true },
          { icon: "@", title: "Email", sub: "quantaforge25@gmail.com", on: true, settings: true },
          { icon: "📱", title: "Push", sub: "No phone number.", on: true, settings: true, badge: "Notifications Blocked" },
          { icon: "📞", title: "SMS", sub: "No phone number.", on: false, settings: true },
        ].map((item) => (
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
}

function EnvironmentVariablesTab({ projectId }: { projectId: string }) {
  const [vars, setVars] = useState<EnvVar[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchEnv = async () => {
      setLoading(true);
      try {
        const data = await projectService.getEnvVars(projectId);
        setVars(data || []);
      } catch (err) {
        console.error('Failed to fetch env vars:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEnv();
  }, [projectId]);

  const handleAdd = () => {
    if (!newKey || !newValue) return;
    setVars([...vars, { key: newKey, value: newValue, target: ['production', 'preview', 'development'] }]);
    setNewKey("");
    setNewValue("");
  };

  const handleRemove = (key: string) => {
    setVars(vars.filter(v => v.key !== key));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await projectService.updateEnvVars(projectId, vars);
      alert('Environment variables saved successfully!');
    } catch (err) {
      console.error('Failed to save env vars:', err);
      alert('Failed to save environment variables.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden", background: V.bg }}>
        <div style={{ padding: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Environment Variables</div>
          <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 24 }}>
            In order to provide your Deployment with Environment Variables at build and runtime, you may enter them here.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
             <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: V.textSecondary, marginBottom: 4 }}>Key</div>
                  <input 
                    type="text" 
                    value={newKey}
                    onChange={e => setNewKey(e.target.value)}
                    placeholder="EXAMPLE_KEY" 
                    style={{ width: "100%", height: 36, background: V.bg, border: `1px solid ${V.border}`, borderRadius: 6, padding: "0 12px", color: V.text, fontSize: 13, fontFamily: "monospace" }} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: V.textSecondary, marginBottom: 4 }}>Value</div>
                  <input 
                    type="password" 
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    placeholder="••••••••" 
                    style={{ width: "100%", height: 36, background: V.bg, border: `1px solid ${V.border}`, borderRadius: 6, padding: "0 12px", color: V.text, fontSize: 13, fontFamily: "monospace" }} 
                  />
                </div>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <Btn onClick={handleAdd} style={{ height: 36, background: V.text, color: V.bg, border: "none" }}>Add</Btn>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div style={{ border: `1px solid ${V.border}`, borderRadius: 12, overflow: "hidden", background: V.bg }}>
        <div style={{ padding: "12px 24px", background: V.card, borderBottom: `1px solid ${V.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Active Variables</span>
          <span style={{ fontSize: 12, color: V.textSecondary }}>{vars.length} variables</span>
        </div>
        <div>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: V.textSecondary }}>Loading...</div>
          ) : vars.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: V.textSecondary }}>No environment variables defined yet.</div>
          ) : vars.map((v, i) => (
            <div key={v.key} style={{ padding: "16px 24px", borderBottom: i < vars.length - 1 ? `1px solid ${V.borderLight}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                 <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 600 }}>{v.key}</div>
                 <div style={{ fontSize: 12, color: V.textSecondary }}>••••••••</div>
                 <div style={{ display: "flex", gap: 4 }}>
                    {['production', 'preview', 'development'].map(env => (
                      <span key={env} style={{ fontSize: 10, background: V.cardHover, color: V.textSecondary, padding: "1px 6px", borderRadius: 4, textTransform: "capitalize" }}>{env}</span>
                    ))}
                 </div>
              </div>
              <button onClick={() => handleRemove(v.key)} style={{ background: "transparent", border: "none", color: "#ff4d4f", cursor: "pointer", fontSize: 12 }}>Remove</button>
            </div>
          ))}
        </div>
        {vars.length > 0 && (
          <div style={{ padding: "16px 24px", background: V.card, borderTop: `1px solid ${V.borderLight}`, display: "flex", justifyContent: "flex-end" }}>
            <Btn onClick={handleSave} style={{ background: V.text, color: V.bg, border: "none", opacity: saving ? 0.7 : 1 }}>{saving ? "Saving..." : "Save Changes"}</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsTab({ p, tab }: { p: ProjInfo, tab: string }) {
  return (
   <div style={{ padding: "32px 24px 60px" }}>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: ["Members", "Deployment Protection", "Activity", "My Notifications"].includes(tab) ? 8 : 24 }}>
        {tab === "Members" ? "Members" : tab === "Deployment Protection" ? "Deployment Protection" : tab === "Activity" ? "Activity" : tab === "My Notifications" ? "Notifications" : "Project Settings"}
      </div>
      {tab === "Members" && <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 32 }}>Manage team members and invitations</div>}
      {tab === "Deployment Protection" && <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 32 }}>Ensure deployments for your projects are protected, and manage external access to all of your deployments. <span style={{ color: "#3291ff", cursor: "pointer" }}>Learn more <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "inline", marginBottom: 2 }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></span></div>}
      {tab === "Activity" && <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 32 }}>View history of changes to your project</div>}
      {tab === "My Notifications" && <div style={{ fontSize: 14, color: V.textSecondary, marginBottom: 32 }}>Manage your personal notification settings for the TrackCodex team.</div>}

      {tab === "Members" && <ProjectMembersSettings />}
      {tab === "Deployment Protection" && <ProjectDeploymentProtectionSettings />}
      {tab === "Activity" && <ProjectActivitySettings />}
      {tab === "My Notifications" && <ProjectNotificationsSettings />}
      {tab === "Environment Variables" && <EnvironmentVariablesTab projectId={p.name} />}
      
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

      {tab === "Environment Variables" && <EnvironmentVariablesTab projectId={p.name} />}

      {!["General", "Build and Deployment", "Environment Variables", "Members"].includes(tab) && (
        <div style={{ padding: 40, textAlign: "center", color: V.textSecondary, border: `1px solid ${V.border}`, borderRadius: 12, background: V.card }}>
           Settings for {tab} are configured correctly.
        </div>
      )}
   </div>
  );
}

export default ProjectDetailView;
