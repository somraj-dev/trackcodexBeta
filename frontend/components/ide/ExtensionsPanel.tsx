import React, { useState, useEffect, useCallback, useRef } from "react";

/**
 * Extensions Panel — Live Open VSX Integration
 *
 * Connects to /api/v1/extensions/* endpoints which proxy to open-vsx.org.
 * Two tabs: Marketplace (search & browse) + Installed (manage user extensions).
 */

const API_BASE = "/api/v1";

interface OpenVSXExtension {
  namespace: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  publishedBy: { loginName: string };
  averageRating?: number;
  downloadCount?: number;
  reviewCount?: number;
  files?: Record<string, string>;
  iconUrl?: string;
  categories?: string[];
}

interface InstalledExtension {
  id: string;
  extensionId: string;
  publisher: string;
  name: string;
  version: string;
  enabled: boolean;
  installedAt: string;
}

type Tab = "marketplace" | "installed";

const ExtensionsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("marketplace");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<OpenVSXExtension[]>([]);
  const [installed, setInstalled] = useState<InstalledExtension[]>([]);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  // TODO: Replace with actual authenticated user ID
  const userId = "current-user";

  // ── Fetch popular on mount ──────────────────────────────────
  useEffect(() => {
    fetchPopular();
    fetchInstalled();
  }, []);

  const fetchPopular = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/extensions/popular`);
      const data = await res.json();
      setResults(data.extensions || []);
      setTotalResults(data.totalSize || 0);
    } catch (err) {
      console.error("Failed to fetch popular extensions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstalled = async () => {
    try {
      const res = await fetch(`${API_BASE}/extensions/user/${userId}`);
      const data = await res.json();
      setInstalled(Array.isArray(data) ? data : []);
      setInstalledIds(new Set((Array.isArray(data) ? data : []).map((e: InstalledExtension) => e.extensionId)));
    } catch (err) {
      console.error("Failed to fetch installed extensions:", err);
    }
  };

  // ── Debounced search ────────────────────────────────────────
  const searchExtensions = useCallback(async (query: string) => {
    if (!query.trim()) {
      fetchPopular();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/extensions/search?query=${encodeURIComponent(query)}&size=20`
      );
      const data = await res.json();
      setResults(data.extensions || []);
      setTotalResults(data.totalSize || 0);
    } catch (err) {
      console.error("Extension search failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      searchExtensions(searchQuery);
    }, 400);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery, searchExtensions]);

  // ── Install / Uninstall / Toggle ────────────────────────────
  const handleInstall = async (ext: OpenVSXExtension) => {
    const extId = `${ext.namespace}.${ext.name}`;
    try {
      await fetch(`${API_BASE}/extensions/install`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          extensionId: extId,
          publisher: ext.namespace,
          name: ext.displayName || ext.name,
          version: ext.version,
        }),
      });
      await fetchInstalled();
    } catch (err) {
      console.error("Install failed:", err);
    }
  };

  const handleUninstall = async (extensionId: string) => {
    try {
      await fetch(`${API_BASE}/extensions/uninstall`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, extensionId }),
      });
      await fetchInstalled();
    } catch (err) {
      console.error("Uninstall failed:", err);
    }
  };

  const handleToggle = async (extensionId: string, enabled: boolean) => {
    try {
      await fetch(`${API_BASE}/extensions/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, extensionId, enabled: !enabled }),
      });
      await fetchInstalled();
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  const formatDownloads = (count?: number) => {
    if (!count) return "—";
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
    return count.toString();
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    const full = Math.floor(rating);
    return (
      <span className="flex items-center gap-0.5 text-yellow-400 text-[10px]">
        {"★".repeat(full)}
        {"☆".repeat(5 - full)}
        <span className="text-[#858585] ml-1">{rating.toFixed(1)}</span>
      </span>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e] text-[#cccccc]">
      {/* Header */}
      <div className="p-4 border-b border-[#2d2d2d]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#8b5cf6]">
              extension
            </span>
            Extensions
          </h2>
          <span className="text-xs text-[#858585] bg-[#2d2d2d] px-2 py-1 rounded">
            Open VSX
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-3">
          <button
            title="Browse Marketplace"
            onClick={() => setActiveTab("marketplace")}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${activeTab === "marketplace"
                ? "bg-[#8b5cf6] text-white"
                : "bg-[#2d2d2d] text-[#cccccc] hover:bg-[#3c3c3c]"
              }`}
          >
            <span className="material-symbols-outlined text-[14px] align-middle mr-1">
              store
            </span>
            Marketplace
          </button>
          <button
            title="View Installed Extensions"
            onClick={() => setActiveTab("installed")}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${activeTab === "installed"
                ? "bg-[#8b5cf6] text-white"
                : "bg-[#2d2d2d] text-[#cccccc] hover:bg-[#3c3c3c]"
              }`}
          >
            <span className="material-symbols-outlined text-[14px] align-middle mr-1">
              inventory_2
            </span>
            Installed ({installed.length})
          </button>
        </div>

        {/* Search (marketplace tab only) */}
        {activeTab === "marketplace" && (
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#858585] text-[16px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search Open VSX extensions..."
              title="Search extensions"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#2d2d2d] border border-[#3c3c3c] rounded-md text-sm text-white placeholder-[#858585] focus:outline-none focus:border-[#8b5cf6] transition-colors"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "marketplace" ? (
          <>
            {/* Results header */}
            <div className="px-4 py-2 text-xs text-[#858585] border-b border-[#2d2d2d]">
              {searchQuery
                ? `${totalResults} results for "${searchQuery}"`
                : "Popular Extensions"}
            </div>

            {/* Extension cards */}
            <div className="p-3 space-y-2">
              {results.length === 0 && !loading ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-[48px] text-[#3c3c3c] block mb-3">
                    search_off
                  </span>
                  <p className="text-[#858585] text-sm">No extensions found</p>
                </div>
              ) : (
                results.map((ext) => {
                  const extId = `${ext.namespace}.${ext.name}`;
                  const isInstalled = installedIds.has(extId);

                  return (
                    <div
                      key={extId}
                      className="flex items-start gap-3 p-3 bg-[#252526] border border-[#3c3c3c] rounded-lg hover:border-[#8b5cf6]/40 transition-all group"
                    >
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-lg bg-[#2d2d2d] flex items-center justify-center overflow-hidden shrink-0">
                        {ext.iconUrl && ext.files?.icon ? (
                          <img
                            src={ext.files.icon}
                            alt=""
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="material-symbols-outlined text-[#858585] text-[20px]">
                            extension
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">
                          {ext.displayName || ext.name}
                        </h3>
                        <p className="text-xs text-[#858585] line-clamp-2 mt-0.5">
                          {ext.description}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#858585]">
                          <span>{ext.namespace}</span>
                          <span>v{ext.version}</span>
                          <span className="flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[10px]">
                              download
                            </span>
                            {formatDownloads(ext.downloadCount)}
                          </span>
                          {renderStars(ext.averageRating)}
                        </div>
                      </div>

                      {/* Install button */}
                      <button
                        title={isInstalled ? `${ext.displayName || ext.name} is installed` : `Install ${ext.displayName || ext.name}`}
                        onClick={() =>
                          isInstalled
                            ? handleUninstall(extId)
                            : handleInstall(ext)
                        }
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${isInstalled
                            ? "bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400"
                            : "bg-[#8b5cf6] text-white hover:bg-[#7c3aed]"
                          }`}
                      >
                        {isInstalled ? "Installed" : "Install"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* Installed tab */
          <div className="p-3 space-y-2">
            {installed.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-[48px] text-[#3c3c3c] block mb-3">
                  inventory_2
                </span>
                <p className="text-[#858585] text-sm">No extensions installed</p>
                <p className="text-[#555] text-xs mt-1">
                  Browse the Marketplace to find extensions
                </p>
              </div>
            ) : (
              installed.map((ext) => (
                <div
                  key={ext.extensionId}
                  className="flex items-center gap-3 p-3 bg-[#252526] border border-[#3c3c3c] rounded-lg"
                >
                  <div className="w-8 h-8 rounded-md bg-[#8b5cf6]/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#8b5cf6] text-[16px]">
                      extension
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white truncate">
                      {ext.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-[#858585] mt-0.5">
                      <span>{ext.publisher}</span>
                      <span>v{ext.version}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Toggle */}
                    <button
                      title={ext.enabled ? `Disable ${ext.name}` : `Enable ${ext.name}`}
                      onClick={() => handleToggle(ext.extensionId, ext.enabled)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${ext.enabled
                          ? "bg-green-500/20 text-green-400"
                          : "bg-[#3c3c3c] text-[#858585]"
                        }`}
                    >
                      {ext.enabled ? "On" : "Off"}
                    </button>

                    {/* Uninstall */}
                    <button
                      title={`Uninstall ${ext.name}`}
                      onClick={() => handleUninstall(ext.extensionId)}
                      className="px-2.5 py-1 rounded text-xs font-medium bg-[#3c3c3c] text-[#858585] hover:bg-red-500/20 hover:text-red-400 transition-all"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#2d2d2d] text-[10px] text-[#555] flex items-center justify-between">
        <span>
          Powered by{" "}
          <a
            href="https://open-vsx.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8b5cf6] hover:underline"
          >
            Open VSX Registry
          </a>
        </span>
        <span>MIT Licensed</span>
      </div>
    </div>
  );
};

export default ExtensionsPanel;
