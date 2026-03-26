import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { searchService, SearchResult } from "../../services/infra/searchService";
import { Search } from "lucide-react";

// Navigation Commands (Static default options)
const navCommands: SearchResult[] = [
  {
    id: "nav-home",
    type: "nav",
    label: "Go to Home",
    icon: "home",
    group: "Navigation",
    url: "/home",
  },
  {
    id: "nav-explore",
    type: "nav",
    label: "Explore",
    icon: "explore",
    group: "Navigation",
    url: "/explore",
  },
  {
    id: "nav-repositories",
    type: "nav",
    label: "Your Repositories",
    icon: "book",
    group: "Navigation",
    url: "/repositories",
  },
  {
    id: "nav-jobs",
    type: "nav",
    label: "Jobs",
    icon: "work",
    group: "Navigation",
    url: "/jobs",
  },
  {
    id: "nav-marketplace",
    type: "nav",
    label: "Marketplace",
    icon: "storefront",
    group: "Navigation",
    url: "/marketplace",
  },
  {
    id: "nav-notifications",
    type: "nav",
    label: "Notifications",
    icon: "notifications",
    group: "Navigation",
    url: "/notifications",
  },
  {
    id: "nav-profile",
    type: "nav",
    label: "Your Profile",
    icon: "person",
    group: "Navigation",
    url: "/profile",
  },
  {
    id: "nav-settings",
    type: "nav",
    label: "Settings",
    icon: "settings",
    group: "Navigation",
    url: "/settings",
  },
  {
    id: "nav-create-repo",
    type: "nav",
    label: "Create Repository",
    icon: "add_circle",
    group: "Actions",
    url: "/new",
  },
];

const CommandPalette = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch Results
  useEffect(() => {
    if (!search || search.length < 2) {
      // Default initial view: Only show standard navigation commands
      setResults([...navCommands]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const serviceResults = await searchService.search(search);

        // Group and format results for GitHub style
        const formattedResults = serviceResults.map(r => ({
          ...r,
          label: r.type === "user" ? (r.label.startsWith("@") ? r.label : `@${r.label}`) : r.label,
          group: r.type === "user" ? "People" : r.type === "repo" ? "Repositories" : "Other"
        }));

        setResults([
          ...formattedResults,
          ...navCommands.filter((c) =>
            c.label.toLowerCase().includes(search.toLowerCase()),
          ).map(c => ({ ...c, group: "Commands" })),
          // Always add search all option if there's a query
          ...(search.trim().length >= 2 ? [{
            id: "search-all",
            type: "search",
            label: `Search for "${search}" in TrackCodex`,
            icon: "search",
            group: "Search",
            url: `/search?q=${encodeURIComponent(search)}`
          } as SearchResult] : [])
        ]);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [search, navigate]);

  // Grouping for render
  const groupedResults = results.reduce(
    (acc, item) => {
      const group = item.group || "Other";
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    },
    {} as Record<string, SearchResult[]>,
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = (item: SearchResult) => {
    navigate(item.url);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Prevent closing when clicking inside the modal
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex justify-center pt-[10vh] px-4"
      onClick={onClose}
    >
      {/* Subtle backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"></div>

      {/* Main Palette Window — uses CSS variables for theme-awareness */}
      <div
        className="relative w-full max-w-[680px] overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-top-4 duration-200 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
        style={{
          backgroundColor: "var(--gh-bg-secondary)",
          border: "1px solid var(--gh-border)",
        }}
        onClick={handleModalClick}
      >

        {/* Search Header */}
        <div
          className="p-2"
          style={{ borderBottom: "1px solid var(--gh-border)", backgroundColor: "var(--gh-bg-secondary)" }}
        >
          <div
            className="flex items-center rounded-[6px] px-3 py-1.5 transition-shadow"
            style={{
              backgroundColor: "var(--gh-bg)",
              border: "1px solid var(--gh-primary)",
              outline: "1px solid var(--gh-primary)",
            }}
          >
            <Search size={16} style={{ color: "var(--gh-text-secondary)" }} className="mr-2" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search or jump to..."
              className="flex-1 bg-transparent border-none focus:ring-0 outline-none h-6"
              style={{
                fontSize: "var(--tc-font-base)",
                color: "var(--gh-text)",
              }}
            />
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: "var(--tc-font-xs)", color: "var(--gh-text-secondary)" }} className="ml-2">
                Type <kbd
                  className="font-mono rounded-[4px] px-1"
                  style={{
                    fontSize: "var(--tc-font-xs)",
                    backgroundColor: "var(--gh-bg-tertiary)",
                    border: "1px solid var(--gh-border)",
                  }}
                >?</kbd> for help
              </span>
              <button
                onClick={onClose}
                className="p-0.5 ml-2 rounded transition-colors flex items-center justify-center"
                style={{ color: "var(--gh-text-secondary)" }}
              >
                <span className="material-symbols-outlined !text-[16px]">close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading && (
            <div className="p-8 flex justify-center" style={{ color: "var(--gh-text-secondary)" }}>
              <span className="material-symbols-outlined animate-spin text-2xl">
                progress_activity
              </span>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="py-2">
              {Object.entries(groupedResults).map(([group, items]) => (
                <div key={group} className="mb-2">
                  <h3
                    className="px-3 py-1 font-semibold capitalize"
                    style={{ fontSize: "var(--tc-font-xs)", color: "var(--gh-text-secondary)" }}
                  >
                    {group}
                  </h3>
                  <div className="space-y-0" style={{ fontSize: "var(--tc-font-base)" }}>
                    {items.map((item) => {
                      const isSelected = results.indexOf(item) === selectedIndex;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(results.indexOf(item))}
                          className="flex items-center gap-3 px-4 py-2 cursor-pointer group transition-colors relative"
                          style={{
                            backgroundColor: isSelected ? "var(--bg-hover)" : undefined,
                          }}
                        >
                          {/* Selection Indicator bar */}
                          {isSelected && (
                            <div
                              className="absolute left-0 top-0 bottom-0 w-[3px]"
                              style={{ backgroundColor: "var(--gh-primary)" }}
                            ></div>
                          )}

                          {/* Icons */}
                          <div className="flex items-center justify-center" style={{ color: "var(--gh-text-secondary)" }}>
                            {item.icon === "repo" || item.type === "repo" ? (
                              <span className="material-symbols-outlined !text-[18px]">book</span>
                            ) : item.icon === "user" || item.type === "user" ? (
                              <span className="material-symbols-outlined !text-[18px]">account_circle</span>
                            ) : item.icon === "copilot" ? (
                              <span className="material-symbols-outlined !text-[18px] text-[#8b5cf6]">smart_toy</span>
                            ) : item.type === "org" ? (
                              <span className="material-symbols-outlined !text-[18px]">corporate_fare</span>
                            ) : item.type === "job" ? (
                              <span className="material-symbols-outlined !text-[18px]">work</span>
                            ) : item.type === "search" ? (
                              <span className="material-symbols-outlined !text-[18px]">search</span>
                            ) : (
                              <span className="material-symbols-outlined !text-[18px]">bookmark_border</span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 flex items-center">
                            <span
                              className="truncate"
                              style={{ color: isSelected ? "var(--gh-text)" : "var(--gh-text-secondary)" }}
                            >
                              {item.label}
                            </span>
                          </div>

                          {/* Jump to Hint */}
                          <span
                            style={{
                              fontSize: "var(--tc-font-xs)",
                              color: isSelected ? "var(--gh-text-secondary)" : "transparent",
                            }}
                            className="whitespace-nowrap group-hover:!text-[var(--gh-text-secondary)]"
                          >
                            {item.group === "Copilot" ? "Start a new Copilot thread" : "Jump to"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="px-4 py-6 text-center flex flex-col items-center">
              <span className="material-symbols-outlined text-4xl mb-3" style={{ color: "var(--gh-text-secondary)" }}>search</span>
              <p style={{ color: "var(--gh-text)", fontSize: "var(--tc-font-base)" }}>No results matched your search.</p>
              <p style={{ color: "var(--gh-text-secondary)", fontSize: "var(--tc-font-xs)" }} className="mt-1">Try different keywords or filters.</p>
            </div>
          )}
        </div>

        {/* Footer Area */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{
            borderTop: "1px solid var(--gh-border)",
            backgroundColor: "var(--gh-bg-secondary)",
          }}
        >
          <a href="#" style={{ fontSize: "var(--tc-font-xs)", color: "var(--gh-primary)" }} className="hover:underline flex items-center gap-1">
            Search syntax tips
          </a>
          <a href="#" style={{ fontSize: "var(--tc-font-xs)", color: "var(--gh-primary)" }} className="hover:underline">
            Give feedback
          </a>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
