import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { strataService, EnterpriseResponse } from "../../services/enterprise/strataService";
import EmptyState from "../../components/common/EmptyState";
import "../../styles/StrataIndex.css";

/* ─────────────── Helpers ─────────────── */

/** Generates a deterministic pastel colour from a string. */
const hashColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 55%, 55%)`;
};

/** Human-readable relative time. */
const timeAgo = (dateStr: string) => {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

/* ─────────────── Individual Card ─────────────── */
const StrataCard: React.FC<{ strata: EnterpriseResponse }> = ({ strata }) => {
  const navigate = useNavigate();
  const accent = hashColor(strata.name);
  const memberCount = strata._count?.members;

  return (
    <div
      onClick={() => navigate(`/strata/${strata.slug}`)}
      className="strata-index-card group"
      style={{ "--card-accent": accent } as React.CSSProperties}
    >
      {/* Top accent stripe */}
      <div className="strata-card-accent" style={{ background: accent }} />

      {/* Card body */}
      <div className="strata-card-body">
        {/* Avatar + name row */}
        <div className="strata-card-header">
          {strata.avatar ? (
            <img src={strata.avatar} alt={strata.name} className="strata-card-avatar" />
          ) : (
            <div className="strata-card-avatar-fallback" style={{ background: accent }}>
              {strata.name.charAt(0)}
            </div>
          )}
          <div className="strata-card-title-group">
            <h3 className="strata-card-name">{strata.name}</h3>
            <span className="strata-card-slug">{strata.slug}</span>
          </div>
        </div>

        {/* Description */}
        <p className="strata-card-desc">
          {strata.description || `${strata.plan} plan · ${strata.status}`}
        </p>

        {/* Meta row */}
        <div className="strata-card-meta">
          <div className="strata-card-meta-chips">
            <span className={`strata-card-status ${strata.status === "ACTIVE" ? "active" : "inactive"}`}>
              <span className="strata-status-dot" />
              {strata.status}
            </span>
            <span className="strata-card-plan">{strata.plan}</span>
          </div>

          {memberCount !== undefined && (
            <span className="strata-card-members" title={`${memberCount} member${memberCount !== 1 ? 's' : ''}`}>
              <span className="material-symbols-outlined !text-[14px]">group</span>
              {memberCount}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="strata-card-footer">
          <span className="strata-card-time">{timeAgo(strata.createdAt)}</span>
          <span className="strata-card-arrow material-symbols-outlined">arrow_forward</span>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Index Page ─────────────── */
const StrataIndexView = () => {
  const navigate = useNavigate();
  const [strataList, setStrataList] = useState<EnterpriseResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    let isMounted = true;
    strataService
      .listStrata()
      .then((data) => {
        if (isMounted) {
          setStrataList(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load strata", err);
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const filtered = strataList.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-gh-bg font-display">
      <div className="strata-index-container">
        {/* ─── Top toolbar ─── */}
        <div className="strata-index-toolbar">
          {/* Search */}
          <div className="strata-search-box">
            <span className="material-symbols-outlined strata-search-icon">search</span>
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="strata-search-input"
            />
          </div>

          {/* View toggle + Add new */}
          <div className="strata-toolbar-actions">
            <div className="strata-view-toggle">
              <button
                onClick={() => setViewMode("grid")}
                className={`strata-view-btn ${viewMode === "grid" ? "active" : ""}`}
                aria-label="Grid view"
              >
                <span className="material-symbols-outlined !text-[18px]">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`strata-view-btn ${viewMode === "list" ? "active" : ""}`}
                aria-label="List view"
              >
                <span className="material-symbols-outlined !text-[18px]">view_list</span>
              </button>
            </div>

            <button
              onClick={() => navigate("/stratahub")}
              className="strata-add-btn"
            >
              Add New…
              <span className="material-symbols-outlined !text-[16px]">expand_more</span>
            </button>
          </div>
        </div>

        {/* ─── Content ─── */}
        {isLoading ? (
          <div className="strata-index-loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="strata-skeleton-card">
                <div className="strata-skeleton-accent" />
                <div className="strata-skeleton-body">
                  <div className="strata-skeleton-row short" />
                  <div className="strata-skeleton-row" />
                  <div className="strata-skeleton-row medium" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 && search ? (
          <div className="strata-index-empty-search">
            <span className="material-symbols-outlined text-4xl text-gh-text-secondary mb-3">search_off</span>
            <p className="text-gh-text-secondary text-sm">No Strata matching "{search}"</p>
          </div>
        ) : strataList.length === 0 ? (
          <div className="py-12 border-2 border-[#1A1A1A] border-dashed border-gh-border rounded-2xl">
            <EmptyState
              title="You don't belong to any Strata yet"
              description="Create or join a Strata to collaborate with others."
              action={{
                label: "Create new strata",
                onClick: () => navigate("/stratahub"),
                icon: "add_circle",
              }}
            />
          </div>
        ) : (
          <div className={viewMode === "grid" ? "strata-index-grid" : "strata-index-list"}>
            {filtered.map((strata) => (
              <StrataCard key={strata.id} strata={strata} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StrataIndexView;
