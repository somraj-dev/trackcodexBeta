import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { searchService, SearchResult } from "../../services/searchService";
import { Terminal, Users, Search, Play, Plus, History, ArrowRight } from "lucide-react";

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

  // Navigation Commands (Static default options)
  const navCommands: SearchResult[] = [
    {
      id: "nav-home",
      type: "nav",
      label: "Go to Home",
      icon: "home",
      group: "Navigation",
      url: "/dashboard/home",
    },
    {
      id: "nav-settings",
      type: "nav",
      label: "Settings",
      icon: "settings",
      group: "Navigation",
      url: "/settings",
    },
  ];

  // Fetch Results
  useEffect(() => {
    if (!search || search.length < 2) {
      // Default initial view 
      setResults([
        { id: "owner-1", type: "user", label: "Quantaforge-Trackcodex", group: "Owners", url: "/Quantaforge-Trackcodex", icon: "user" },
        { id: "owner-2", type: "user", label: "quantaforze", group: "Owners", url: "/quantaforze", icon: "user" },
        { id: "repo-1", type: "repo", label: "Quantaforge-trackcodex/TrackcodexVersion1.0.0", group: "Repositories", url: "/repo", icon: "repo" },
        { id: "repo-2", type: "repo", label: "Quantaforge-trackcodex/TrackcodexBeta", group: "Repositories", url: "/repo-beta", icon: "repo" },
        { id: "copilot-1", type: "nav", label: "Chat with Copilot", group: "Copilot", url: "/forge-ai", icon: "copilot" },
      ]);
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
        ]);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [search]);

  // Grouping for render
  const groupedResults = results.reduce(
    (acc, item) => {
      // Use "Repositories" "Owners" "Copilot" as standard groups
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

      {/* Main Palette Window */}
      <div
        className="relative w-full max-w-[680px] bg-[#161b22] border border-[#30363d] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-top-4 duration-200"
        onClick={handleModalClick}
      >

        {/* Search Header Container - Has standard GitHub blue focus ring */}
        <div className="p-2 border-b border-[#30363d] bg-[#161b22]">
          <div className="flex items-center bg-[#0d1117] border border-[#2f81f7] rounded-[6px] outline outline-1 outline-[#2f81f7] px-3 py-1.5 focus-within:shadow-[0_0_0_3px_rgba(47,129,247,0.4)] transition-shadow">
            <Search size={16} className="text-[#7d8590] mr-2" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search or jump to..."
              className="flex-1 bg-transparent text-[14px] text-[#c9d1d9] placeholder-[#7d8590] border-none focus:ring-0 outline-none h-6"
            />
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-[#7d8590] ml-2">Type <kbd className="font-mono bg-[#21262d] border border-[#30363d] rounded-[4px] px-1 text-[10px]">?</kbd> for help</span>
              <button onClick={onClose} className="p-0.5 ml-2 hover:bg-[#30363d] rounded text-[#7d8590] transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined !text-[16px]">close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading && (
            <div className="p-8 flex justify-center text-[#7d8590]">
              <span className="material-symbols-outlined animate-spin text-2xl">
                progress_activity
              </span>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="py-2">
              {Object.entries(groupedResults).map(([group, items]) => (
                <div key={group} className="mb-2">
                  <h3 className="px-3 py-1 text-[12px] font-semibold text-[#7d8590] capitalize">
                    {group}
                  </h3>
                  <div className="space-y-0 text-[14px]">
                    {items.map((item) => {
                      const isSelected = results.indexOf(item) === selectedIndex;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(results.indexOf(item))}
                          className={`
                              flex items-center gap-3 px-4 py-2 cursor-pointer group transition-colors relative
                              ${isSelected ? "bg-[#1f242c]" : "hover:bg-[#1f242c]"}
                            `}
                        >
                          {/* Selection Indicator bar (GitHub subtle style) */}
                          {isSelected && (
                            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#2f81f7]"></div>
                          )}

                          {/* GitHub-style Icons */}
                          <div className="flex items-center justify-center text-[#7d8590]">
                            {item.icon === "repo" ? (
                              <span className="material-symbols-outlined !text-[18px]">book</span>
                            ) : item.icon === "user" ? (
                              <span className="material-symbols-outlined !text-[18px]">account_circle</span>
                            ) : item.icon === "copilot" ? (
                              <span className="material-symbols-outlined !text-[18px] text-[#8b5cf6]">smart_toy</span>
                            ) : (
                              <span className="material-symbols-outlined !text-[18px]">bookmark_border</span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 flex items-center">
                            <span className={`${isSelected ? "text-white" : "text-[#c9d1d9]"} truncate`}>
                              {item.label}
                            </span>
                          </div>

                          {/* Jump to Hint */}
                          <span
                            className={`text-[12px] whitespace-nowrap ${isSelected ? "text-[#7d8590]" : "text-transparent"} group-hover:text-[#7d8590]`}
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
              <span className="material-symbols-outlined text-4xl text-[#7d8590] mb-3">search</span>
              <p className="text-[#c9d1d9] text-[14px]">No results matched your search.</p>
              <p className="text-[#7d8590] text-[12px] mt-1">Try different keywords or filters.</p>
            </div>
          )}
        </div>

        {/* Footer Area */}
        <div className="px-4 py-3 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between">
          <a href="#" className="text-[12px] text-[#2f81f7] hover:underline flex items-center gap-1">
            Search syntax tips
          </a>
          <a href="#" className="text-[12px] text-[#2f81f7] hover:underline">
            Give feedback
          </a>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
