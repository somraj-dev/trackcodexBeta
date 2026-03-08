import { useState, useEffect, useCallback } from "react";

const SIDEBAR_STORAGE_KEY = "tc_sidebar_expanded_v2";

export const useSidebarState = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleSidebar = useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(next));
      // Dispatch custom event for other instances
      window.dispatchEvent(new CustomEvent("tc-sidebar-toggle", { detail: next }));
      return next;
    });
  }, []);

  useEffect(() => {
    const handleSync = (e: Event) => {
      setIsExpanded((e as CustomEvent).detail);
    };
    window.addEventListener("tc-sidebar-toggle", handleSync);
    return () => window.removeEventListener("tc-sidebar-toggle", handleSync);
  }, []);

  // Keyboard shortcut: Ctrl/Cmd + B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  return { isExpanded, toggleSidebar, setIsExpanded };
};
