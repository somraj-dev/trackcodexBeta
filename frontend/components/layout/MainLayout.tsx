import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import ReactGA from "react-ga4";

// Layout & UI Components
import Footer from "./Footer";
import MessagingPanel from "../messaging/MessagingPanel";
import CommandPalette from "./CommandPalette";
import ChatWidget from "../social/ChatWidget";
import UserProfileDropdown from "../profile/UserProfileDropdown";
import ResumePreviewModal from "../profile/ResumePreviewModal";
import TrackCodexLogo from "../branding/TrackCodexLogo";

// Contexts & Services
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { useMessaging } from "../../context/MessagingContext";
import { profileService, UserProfile } from "../../services/activity/profile";

interface NotificationItem {
  id: string;
  type: "job" | "comment" | "community" | "system" | "info";
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  hasActions?: boolean;
  time?: string;
  skipToast?: boolean;
}

const MainLayout: React.FC = () => {
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const { totalUnreadCount, setIsPanelOpen } = useMessaging();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const lastScrollTopRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [profile, setProfile] = useState<UserProfile>(profileService.getProfile());

  useEffect(() => {
    if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
    ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
  }, [location.pathname, location.search]);

  useEffect(() => {
    return profileService.subscribe(setProfile);
  }, []);

  useEffect(() => {
    const handleOpenResume = () => setIsResumeModalOpen(true);
    window.addEventListener("open-resume-modal", handleOpenResume);
    return () => window.removeEventListener("open-resume-modal", handleOpenResume);
  }, []);

  // Global keyboard shortcut: Ctrl+K / Cmd+K / "/" opens the command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      // Forward slash "/" — only if not typing in an input/textarea/select
      else if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Use simple boolean for focus mode for now
  const isFocusMode = false;

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target || typeof target.scrollTop === 'undefined') return;
      const currentScrollTop = target.scrollTop;
      if (Math.abs(currentScrollTop - lastScrollTopRef.current) < 5) return;
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

      if (currentScrollTop > lastScrollTopRef.current && currentScrollTop > 60) {
        setIsNavbarVisible(false);
      } else {
        setIsNavbarVisible(true);
      }
      lastScrollTopRef.current = currentScrollTop;
      scrollTimeoutRef.current = setTimeout(() => setIsNavbarVisible(true), 150);
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const isStandalone =
    window.location.hostname.startsWith("workspace.") ||
    new URLSearchParams(window.location.search).get("standalone") === "true";

  const isIdeView = (
    location.pathname.startsWith("/workspace/") &&
    location.pathname !== "/workspace/new"
  ) || ["/editor", "/trials/live-session"].some(
    (path) => location.pathname.includes(path),
  ) || isStandalone;

  const isFullScreenView = isIdeView || 
    ["/messages", "/notifications"].includes(location.pathname) ||
    location.pathname.startsWith("/dashboard/project/");
  const isFullPageAction = ["/repositories/new", "/repositories/import", "/marketplace/missions/new"].includes(location.pathname);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isAddMenuOpen && !target.closest(".add-menu-container")) setIsAddMenuOpen(false);
      if (isNotificationsOpen && !target.closest(".notifications-container")) setIsNotificationsOpen(false);
      if (isProfileDropdownOpen && !target.closest(".profile-dropdown-container")) setIsProfileDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAddMenuOpen, isNotificationsOpen, isProfileDropdownOpen]);

  const displayNotifications = notifications.length > 0 ? notifications : [
    { id: "mock1", type: "system", title: "Welcome", message: "No new notifications yet.", createdAt: new Date().toISOString(), read: true }
  ];

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden text-gh-text font-display bg-gh-bg transition-colors duration-300">
      {/* Sidebar Overlay & Panel */}
      {isSidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[70] animate-in fade-in duration-200" onClick={() => setIsSidebarOpen(false)} />
          <div className="fixed top-0 left-0 h-full w-[320px] bg-gh-bg-secondary border-r border-gh-border z-[80] animate-in slide-in-from-left duration-300 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-4 h-14 shrink-0">
              <button onClick={() => { setIsSidebarOpen(false); navigate("/dashboard/home"); }} className="text-gh-text">
                <TrackCodexLogo size="sm" collapsed={true} clickable={false} />
              </button>
              <button onClick={() => setIsSidebarOpen(false)} className="text-gh-text-secondary h-8 w-8 flex items-center justify-center">
                <span className="material-symbols-outlined !text-[20px]">close</span>
              </button>
            </div>
            <nav className="px-3 py-2 space-y-0.5">
              {[
                { icon: "home", label: "Home", to: "/dashboard/home" },
                { icon: "account_tree", label: "Dashboard", to: "/dashboard" },
                { icon: "terminal", label: "Workspaces", to: "/workspaces" },
                { icon: "auto_stories", label: "Library", to: "/dashboard/library" },
                { icon: "store", label: "Marketplace", to: "/marketplace" },
                { icon: "diversity_3", label: "Community", to: "/community" },
                { icon: "bolt", label: "ForgeAI", to: "/forge-ai" },
                { icon: "account_circle", label: "Profile", to: "/profile" },
              ].map((item) => (
                <button key={item.label} onClick={() => { setIsSidebarOpen(false); navigate(item.to); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[14px] font-medium ${location.pathname.startsWith(item.to) ? "text-gh-text bg-primary/15" : "text-gh-text hover:bg-gh-bg-secondary hover:text-gh-text"}`}>
                  <span className="material-symbols-outlined !text-[18px]">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </>
      )}

      <div className="flex-1 flex min-h-0 relative">
        <main ref={mainScrollRef} className={`flex-1 min-w-0 flex flex-col bg-gh-bg relative ${isFullScreenView || isFocusMode ? "overflow-hidden" : "overflow-y-auto no-scrollbar"}`}>
          {!isIdeView && !isFocusMode && (
            <div className={`h-12 border-b border-gh-border flex items-center px-4 bg-gh-bg-secondary shrink-0 sticky top-0 z-40 gap-2 transition-transform duration-300 ${isNavbarVisible ? "translate-y-0" : "-translate-y-full"}`}>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsSidebarOpen(true)} className="text-gh-text hover:text-primary h-8 w-8 flex items-center justify-center rounded-md hover:bg-gh-bg-tertiary">
                  <span className="material-symbols-outlined !text-[20px]">menu</span>
                </button>
                <button onClick={() => navigate("/dashboard/home")} aria-label="Home"><TrackCodexLogo size="sm" collapsed={true} clickable={false} /></button>
              </div>
              <div className="flex-1 flex justify-center max-w-[720px] mx-auto">
                <div 
                  onClick={() => setIsCommandPaletteOpen(true)} 
                  className="flex items-center gap-2 px-3 py-1 bg-gh-bg border border-gh-border rounded-md w-full max-w-[272px] cursor-pointer hover:border-primary transition-colors group"
                >
                  <span className="material-symbols-outlined !text-[14px] text-gh-text-secondary">search</span>
                  <input
                    type="text"
                    placeholder="Search TrackCodex..."
                    className="flex-1 bg-transparent border-none text-[13px] text-gh-text placeholder-gh-text-secondary focus:ring-0 outline-none h-6 cursor-pointer"
                    onFocus={() => setIsCommandPaletteOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const q = (e.target as HTMLInputElement).value;
                        if (q.trim()) {
                          navigate(`/search?q=${encodeURIComponent(q)}`);
                        }
                      }
                    }}
                  />
                  <div className="hidden md:flex items-center gap-1 border border-gh-border rounded px-1.5 py-0.5 bg-gh-bg-secondary">
                    <span className="text-[10px] text-gh-text-secondary font-mono">/</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {/* Add Menu */}
                <div className="relative add-menu-container">
                  <button onClick={() => setIsAddMenuOpen(!isAddMenuOpen)} className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors ${isAddMenuOpen ? "bg-primary/20 text-gh-text" : "text-gh-text hover:bg-gh-bg-secondary hover:text-primary"}`}>
                    <span className="material-symbols-outlined !text-[20px]">add</span>
                  </button>
                  {isAddMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-gh-bg-secondary border border-gh-border rounded-lg shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                      {[
                        { icon: "terminal", label: "New Workspace", to: "/workspace/new" },
                        { icon: "account_tree", label: "New Repository", to: "/repositories/new" },
                        { icon: "work", label: "New Mission", to: "/marketplace/missions/new" },
                        { icon: "add_box", label: "New Post", to: "/community?action=create-post" },
                        { icon: "upload", label: "Import Repository", to: "/repositories/import" },
                      ].map((item) => (
                        <button key={item.label} onClick={() => { setIsAddMenuOpen(false); navigate(item.to); }} className="w-full px-3 py-1.5 flex items-center gap-2 text-[13px] text-gh-text hover:bg-gh-bg-tertiary hover:text-primary transition-colors">
                          <span className="material-symbols-outlined !text-[16px]">{item.icon}</span>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notifications Bell */}
                <div className="relative notifications-container">
                  <button
                    onClick={() => {
                      setIsAddMenuOpen(false);
                      setIsProfileDropdownOpen(false);
                      navigate("/notifications");
                    }}
                    className="h-8 w-8 flex items-center justify-center rounded-md text-gh-text hover:bg-gh-bg-secondary hover:text-primary relative"
                  >
                    <span className="material-symbols-outlined !text-[20px]">notifications</span>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 px-1 min-w-[16px] h-[16px] flex items-center justify-center bg-blue-500 text-white text-[10px] font-bold rounded-full border-2 border-gh-bg shadow-sm">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Messages Button */}
                <button onClick={() => setIsPanelOpen(true)} className="h-8 w-8 flex items-center justify-center rounded-md text-gh-text hover:bg-gh-bg-secondary hover:text-primary relative">
                  <span className="material-symbols-outlined !text-[20px]">chat_bubble</span>
                  {totalUnreadCount > 0 && (
                    <span className="absolute top-1 right-1 px-1 min-w-[14px] h-[14px] flex items-center justify-center bg-blue-500 text-white text-[9px] font-bold rounded-full border border-gh-bg shadow-sm">
                      {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
                    </span>
                  )}
                </button>

                <div className="h-4 w-[1px] bg-gh-border mx-1"></div>

                <div className="relative profile-dropdown-container">
                  <div onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="cursor-pointer flex items-center h-8 hover:bg-gh-bg-secondary px-1 rounded-md transition-colors">
                    <img src={profile.avatar} className="size-5 rounded-full border border-gh-border" alt="Profile" />
                    <span className="material-symbols-outlined !text-[14px] text-gh-text-secondary -ml-0.5">arrow_drop_down</span>
                  </div>
                  {isProfileDropdownOpen && <UserProfileDropdown profile={profile} onClose={() => setIsProfileDropdownOpen(false)} logout={logout} />}
                </div>
              </div>
            </div>
          )}


          <Outlet />

          {!isIdeView && !isFocusMode && !isFullPageAction && <Footer />}
        </main>
      </div>
      {!isFocusMode && <MessagingPanel />}
      <ChatWidget />
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
      <ResumePreviewModal 
        isOpen={isResumeModalOpen} 
        onClose={() => setIsResumeModalOpen(false)} 
        profile={profile} 
      />
    </div>
  );
};

export default MainLayout;


