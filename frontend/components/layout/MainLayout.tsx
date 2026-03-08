import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import ReactGA from "react-ga4";

// Layout & UI Components
import Footer from "./Footer";
import MessagingPanel from "../messaging/MessagingPanel";
import CommandPalette from "./CommandPalette";
import ChatWidget from "../social/ChatWidget";
import UserProfileDropdown from "../profile/UserProfileDropdown";
import TrackCodexLogo from "../branding/TrackCodexLogo";

// Contexts & Services
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { useMessaging } from "../../context/MessagingContext";
import { profileService, UserProfile } from "../../services/activity/profile";
import { logActivity } from "../../services/activity/activityLogger";

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
  const [notification, setNotification] = useState<NotificationItem | null>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { notifications } = useNotifications();
  const { totalUnreadCount, setIsPanelOpen } = useMessaging();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

  const isFullScreenView = isIdeView || ["/messages", "/notifications"].includes(location.pathname);
  const isFullPageAction = ["/repositories/new", "/repositories/import"].includes(location.pathname);

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
    { id: "mock1", type: "system", title: "Welcome", message: "No new notifications yet.", timestamp: new Date().toISOString(), read: true }
  ];

  return (
    <div className="flex flex-col h-full w-full overflow-hidden text-gh-text font-display bg-gh-bg transition-colors duration-300">
      {/* Sidebar Overlay & Panel */}
      {isSidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[70] animate-in fade-in duration-200" onClick={() => setIsSidebarOpen(false)} />
          <div className="fixed top-0 left-0 h-full w-[320px] bg-[#11141A] border-r border-[#1E232E] z-[80] animate-in slide-in-from-left duration-300 flex flex-col overflow-y-auto">
             <div className="flex items-center justify-between px-4 h-14 shrink-0">
               <button onClick={() => { setIsSidebarOpen(false); navigate("/dashboard/home"); }} className="text-white">
                 <TrackCodexLogo size="sm" collapsed clickable={false} />
               </button>
               <button onClick={() => setIsSidebarOpen(false)} className="text-gh-text-secondary h-8 w-8 flex items-center justify-center">
                 <span className="material-symbols-outlined !text-[20px]">close</span>
               </button>
             </div>
             <nav className="px-3 py-2 space-y-0.5">
               {[
                 { icon: "home", label: "Home", to: "/dashboard/home" },
                 { icon: "account_tree", label: "Dashboard", to: "/repositories" },
                 { icon: "terminal", label: "Workspaces", to: "/workspaces" },
                 { icon: "auto_stories", label: "Library", to: "/dashboard/library" },
                 { icon: "store", label: "Marketplace", to: "/marketplace" },
                 { icon: "diversity_3", label: "Community", to: "/community" },
                 { icon: "bolt", label: "ForgeAI", to: "/forge-ai" },
                 { icon: "account_circle", label: "Profile", to: "/profile" },
               ].map((item) => (
                 <button key={item.label} onClick={() => { setIsSidebarOpen(false); navigate(item.to); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[14px] font-medium ${location.pathname.startsWith(item.to) ? "text-white bg-[#1f6feb]/15" : "text-gh-text hover:bg-[#11141A] hover:text-white"}`}>
                   <span className="material-symbols-outlined !text-[18px]">{item.icon}</span>
                   {item.label}
                 </button>
               ))}
             </nav>
          </div>
        </>
      )}

      <div className="flex-1 flex min-h-0">
        <main ref={mainScrollRef} className={`flex-1 min-w-0 flex flex-col bg-gh-bg relative ${isFullScreenView || isFocusMode ? "overflow-hidden" : "overflow-y-auto custom-scrollbar"}`}>
          {!isIdeView && !isFocusMode && (
            <div className={`h-12 border-b border-gh-border flex items-center px-4 bg-[#0A0D14] shrink-0 sticky top-0 z-40 gap-2 transition-transform duration-300 ${isNavbarVisible ? "translate-y-0" : "-translate-y-full"}`}>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsSidebarOpen(true)} className="text-gh-text hover:text-white h-8 w-8 flex items-center justify-center rounded-md hover:bg-[#11141A]">
                  <span className="material-symbols-outlined !text-[20px]">menu</span>
                </button>
                <button onClick={() => navigate("/dashboard/home")}><TrackCodexLogo size="sm" collapsed clickable={false} /></button>
              </div>
              <div className="flex-1 flex justify-center max-w-[720px] mx-auto">
                <div onClick={() => setIsCommandPaletteOpen(true)} className="flex items-center gap-2 px-3 py-1 bg-[#0A0D14] border border-[#1E232E] rounded-md w-full max-w-[272px] cursor-pointer hover:border-[#58a6ff]/50 transition-colors group">
                  <span className="material-symbols-outlined !text-[14px] text-gh-text-secondary">search</span>
                  <span className="text-[13px] text-gh-text-secondary flex-1">Search...</span>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <div className="relative profile-dropdown-container ml-1">
                  <div onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="cursor-pointer flex items-center">
                    <img src={profile.avatar} className="size-5 rounded-full border border-[#1E232E]" alt="Profile" />
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
    </div>
  );
};

export default MainLayout;
