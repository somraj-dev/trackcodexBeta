import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter,
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  Outlet,
} from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider, useNotifications } from "./context/NotificationContext";
import { RealtimeProvider } from "./contexts/RealtimeContext";
import { MessagingProvider, useMessaging } from "./context/MessagingContext";
import ReactGA from "react-ga4";

// Error boundary to catch stale chunk load failures after redeployments
class ChunkErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    if (
      error.message.includes("Failed to fetch dynamically imported module") ||
      error.message.includes("Importing a module script failed") ||
      error.message.includes("error loading dynamically imported module")
    ) {
      return { hasError: true };
    }
    throw error; // Re-throw non-chunk errors
  }

  componentDidCatch(error: Error) {
    // Auto-reload once to get fresh chunks (prevent infinite loop with sessionStorage flag)
    const reloadKey = "chunk_reload_" + window.location.pathname;
    if (!sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, "1");
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gh-bg text-gh-text">
          <div className="text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-red-500">error</span>
            <h2 className="text-xl font-semibold">Application Updated</h2>
            <p className="text-gh-text-secondary text-sm max-w-md">
              A new version of TrackCodex is available. Please reload to get the latest version.
            </p>
            <button
              onClick={() => {
                sessionStorage.clear();
                window.location.reload();
              }}
              className="px-6 py-2 bg-primary text-white rounded-md hover:bg-[#0A0A0A]lue-600 transition-colors font-medium"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Auth Views
const Login = React.lazy(() => import("./views/auth/Login"));
const Signup = React.lazy(() => import("./views/auth/Signup"));
const OAuthCallback = React.lazy(() => import("./views/auth/OAuthCallback"));
const ForgotPassword = React.lazy(() => import("./views/auth/ForgotPassword"));
const ResetPassword = React.lazy(() => import("./views/auth/ResetPassword"));
const SignOut = React.lazy(() => import("./views/auth/SignOut"));
const LandingPage = React.lazy(() => import("./views/LandingPage"));

// Layout Components

import Footer from "./components/layout/Footer";
import MessagingPanel from "./components/messaging/MessagingPanel";
import SplashScreen from "./components/branding/SplashScreen";
import SettingsLayout from "./components/settings/SettingsLayout";
import CommandPalette from "./components/layout/CommandPalette";
import ChatWidget from "./components/social/ChatWidget"; // Global Chat
import RedirectToLogin from "./components/auth/RedirectToLogin";

import UserProfileDropdown from "./components/profile/UserProfileDropdown";
import { profileService, UserProfile } from "./services/profile";
import TrackCodexLogo from "./components/branding/TrackCodexLogo";

// Core Views
const RepositoriesView = React.lazy(() => import("./views/Repositories"));

// Eager load to debug
import RepoDetailView from "./views/RepoDetail";
// const RepoDetailView = React.lazy(() => import("./views/RepoDetail"));

const EditorView = React.lazy(() => import("./views/Editor"));
const ProfileView = React.lazy(() => import("./views/Profile"));
const Overview = React.lazy(() => import("./views/Overview"));
const WorkspacesView = React.lazy(() => import("./views/Workspaces"));
const CreateWorkspaceView = React.lazy(() => import("./views/CreateWorkspace"));
const PublicProfile = React.lazy(() => import("./views/PublicProfile"));
const Portfolio = React.lazy(() => import("./views/Portfolio"));
const ReviewMode = React.lazy(() => import("./views/ReviewMode"));
const VSCodeWorkspaceView = React.lazy(() => import("./views/ide/VSCodeWorkspaceView"));
const HomeView = React.lazy(() => import("./views/Home"));
const ExploreView = React.lazy(() => import("./views/Explore"));
const LibraryView = React.lazy(() => import("./views/Library"));
const ForgeAIView = React.lazy(() => import("./views/ForgeAI"));
const NotificationsView = React.lazy(() => import("./views/NotificationsView"));
const AcceptInvite = React.lazy(() => import("./views/AcceptInvite"));
const WorkspaceSettings = React.lazy(() => import("./views/WorkspaceSettings"));
const Leaderboard = React.lazy(() => import("./views/Leaderboard"));
const AdminRoomView = React.lazy(() => import("./views/Admin"));
const TaskVault = React.lazy(() => import("./views/TaskVault"));
const PlatformMatrix = React.lazy(() => import("./views/PlatformMatrix"));
const Terms = React.lazy(() => import("./views/legal/Terms"));
const Privacy = React.lazy(() => import("./views/legal/Privacy"));
const Status = React.lazy(() => import("./views/legal/Status"));
const Security = React.lazy(() => import("./views/legal/Security"));
const Contact = React.lazy(() => import("./views/legal/Contact"));
const CookiePolicy = React.lazy(() => import("./views/legal/CookiePolicy"));
import { CookieConsent } from "./components/legal/CookieConsent";
import RoleGuard from "./auth/RoleGuard";
const CommunityView = React.lazy(() => import("./views/Community"));
const DiscussionDetail = React.lazy(() => import("./views/DiscussionDetail"));
const CreateRepoView = React.lazy(() => import("./views/CreateRepo"));
const ImportRepoView = React.lazy(() => import("./views/ImportRepo"));

// Strata Views
const StrataIndexView = React.lazy(
  () => import("./views/organizations/StrataIndexView"),
);
const StrataDetailView = React.lazy(
  () => import("./views/organizations/StrataDetailView"),
);
const StrataOverview = React.lazy(
  () => import("./components/organizations/StrataOverview"),
);
const CreateStrataView = React.lazy(
  () => import("./views/organizations/CreateStrata"),
);
const StrataRepositories = React.lazy(
  () => import("./components/organizations/StrataRepositories"),
);
const StrataPeople = React.lazy(
  () => import("./components/organizations/StrataPeople"),
);
const StrataTeams = React.lazy(
  () => import("./components/organizations/StrataTeams"),
);
const StrataSettingsLayout = React.lazy(
  () => import("./components/organizations/StrataSettingsLayout"),
);
const StrataGeneralSettings = React.lazy(
  () => import("./views/organizations/settings/StrataGeneralSettings"),
);
const StrataAuthenticationSecurity = React.lazy(
  () => import("./views/organizations/settings/StrataAuthenticationSecurity"),
);
const StrataEnvironments = React.lazy(
  () => import("./views/organizations/settings/StrataEnvironments"),
);
const StrataPermissions = React.lazy(
  () => import("./views/organizations/settings/StrataPermissions"),
);
const StrataWebhooks = React.lazy(
  () => import("./views/organizations/settings/StrataWebhooks"),
);

// Settings Sub-views
const AppearanceSettings = React.lazy(
  () => import("./views/settings/AppearanceSettings"),
);
const EmailSettings = React.lazy(
  () => import("./views/settings/EmailSettings"),
);
const SecuritySettings = React.lazy(
  () => import("./views/settings/SecuritySettings"),
);
const AccountSettings = React.lazy(
  () => import("./views/settings/AccountSettings"),
);
const ProfileSettings = React.lazy(
  () => import("./views/settings/ProfileSettings"),
);
const BillingSettings = React.lazy(
  () => import("./views/settings/BillingSettings"),
);
const ForgeAIUsageSettings = React.lazy(
  () => import("./views/settings/ForgeAIUsageSettings"),
);
const AccessibilitySettings = React.lazy(
  () => import("./views/settings/AccessibilitySettings"),
);
const NotificationsSettings = React.lazy(
  () => import("./views/settings/NotificationsSettings"),
);
const PersonalAccessTokensSettings = React.lazy(
  () => import("./views/settings/PersonalAccessTokensSettings"),
);
const IntegrationsSettings = React.lazy(
  () => import("./views/settings/IntegrationsSettings"),
);
const SessionsSettings = React.lazy(
  () => import("./views/settings/SessionsSettings"),
);
const SSHKeysSettings = React.lazy(
  () => import("./views/settings/SSHKeysSettings"),
);
const AhiCsSettings = React.lazy(
  () => import("./views/settings/AhiCsSettings"),
);
const PrivacySettings = React.lazy(
  () => import("./views/settings/PrivacySettings"),
);
const BillingUsage = React.lazy(
  () => import("./views/settings/billing/BillingUsage"),
);
const BillingAnalytics = React.lazy(
  () => import("./views/settings/billing/BillingAnalytics"),
);
const BillingBudgets = React.lazy(
  () => import("./views/settings/billing/BillingBudgets"),
);
const BillingLicensing = React.lazy(
  () => import("./views/settings/billing/BillingLicensing"),
);
const BillingPaymentInfo = React.lazy(
  () => import("./views/settings/billing/BillingPaymentInfo"),
);
const BillingPaymentHistory = React.lazy(
  () => import("./views/settings/billing/BillingPaymentHistory"),
);
const BillingAdditional = React.lazy(
  () => import("./views/settings/billing/BillingAdditional"),
);

// --- NEW HIRING & GROWTH VIEWS ---
const MarketplaceLayout = React.lazy(
  () => import("./views/marketplace/MarketplaceLayout"),
);
const OnboardingLayout = React.lazy(
  () => import("./views/onboarding/OnboardingLayout"),
);
const WelcomeView = React.lazy(() => import("./views/onboarding/WelcomeView"));
const OfferAcceptanceView = React.lazy(
  () => import("./views/trials/OfferAcceptanceView"),
);

const TrialSubmittedView = React.lazy(
  () => import("./views/trials/TrialSubmittedView"),
);

// Enterprise


// --- Marketplace Sub-views ---
const MissionsView = React.lazy(
  () => import("./views/marketplace/MissionsView"),
);
const MissionDetailView = React.lazy(
  () => import("./views/marketplace/MissionDetailView"),
);
const MyApplicationsView = React.lazy(
  () => import("./views/marketplace/MyApplicationsView"),
);
const TrialRepositoriesView = React.lazy(
  () => import("./views/marketplace/TrialRepositoriesView"),
);

// --- Hiring Sub-views ---
const HiringLayout = React.lazy(() => import("./views/hiring/HiringLayout"));
const CandidateDiscoveryView = React.lazy(
  () => import("./views/hiring/CandidateDiscoveryView"),
);
const HiringJobsView = React.lazy(
  () => import("./views/hiring/HiringJobsView"),
);
const HiringAnalyticsView = React.lazy(
  () => import("./views/hiring/HiringAnalyticsView"),
);
const CandidateScorecardView = React.lazy(
  () => import("./views/hiring/CandidateScorecardView"),
);
const CandidateComparisonView = React.lazy(
  () => import("./views/hiring/CandidateComparisonView"),
);
const OfferEditorView = React.lazy(
  () => import("./views/hiring/OfferEditorView"),
);
const SessionSchedulerView = React.lazy(
  () => import("./views/hiring/SessionSchedulerView"),
);
const InterviewerFeedbackView = React.lazy(
  () => import("./views/hiring/InterviewerFeedbackView"),
);
const AssessmentsView = React.lazy(
  () => import("./views/hiring/AssessmentsView"),
);
const JobApplicationsView = React.lazy(
  () => import("./views/hiring/JobApplicationsView"),
);

// --- Growth Sub-views ---
const GrowthLayout = React.lazy(() => import("./views/growth/GrowthLayout"));
const SkillDashboardView = React.lazy(
  () => import("./views/growth/SkillDashboardView"),
);
const DeveloperProfileView = React.lazy(
  () => import("./views/growth/DeveloperProfileView"),
);

// --- Onboarding Sub-views ---
const OnboardingWorkspace = React.lazy(
  () => import("./views/onboarding/OnboardingWorkspace"),
);
const BuddyDashboardView = React.lazy(
  () => import("./views/onboarding/BuddyDashboardView"),
);
const WalletDashboard = React.lazy(
  () => import("./views/finance/WalletDashboard"),
);

// --- Admin Sub-views ---
const AdminOverview = React.lazy(
  () => import("./components/admin/AdminOverview"),
);
const UserManager = React.lazy(() => import("./components/admin/UserManager"));
const TeamManager = React.lazy(() => import("./components/admin/TeamManager"));
const WorkspaceMonitor = React.lazy(
  () => import("./components/admin/WorkspaceMonitor"),
);
const RepositoryGovernance = React.lazy(
  () => import("./components/admin/RepositoryGovernance"),
);
const JobOversight = React.lazy(
  () => import("./components/admin/JobOversight"),
);
const CommunityModeration = React.lazy(
  () => import("./components/admin/CommunityModeration"),
);
const RoleEditor = React.lazy(() => import("./components/admin/RoleEditor"));
const AuditLogs = React.lazy(() => import("./components/admin/AuditLogs"));
const AdminDashboard = React.lazy(() => import("./views/AdminDashboard"));

// Documentation & Blog
const DocsLayout = React.lazy(() => import("./components/docs/DocsLayout"));
const DocsViewer = React.lazy(() => import("./views/docs/DocsViewer"));
const BlogLayout = React.lazy(() => import("./components/blog/BlogLayout"));
const BlogIndex = React.lazy(() => import("./views/blog/BlogIndex"));
const BlogPost = React.lazy(() => import("./views/blog/BlogPost"));

import { logActivity } from "./services/activityLogger";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-gh-bg p-8 text-center">
          <span className="material-symbols-outlined !text-4xl text-red-500 mb-4">
            error
          </span>
          <h1 className="text-xl font-bold text-gh-text mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-gh-text-secondary max-w-md mb-6">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gh-bg-secondary border border-gh-border rounded-lg text-sm font-bold hover:bg-gh-bg-tertiary transition-colors"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface NotificationItem {
  id: string;
  type: "job" | "comment" | "community" | "system" | "info";
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  hasActions?: boolean; // Keep for toast compatibility
  time?: string; // Keep for fallback mock data
  skipToast?: boolean; // New flag to suppress popup
}

const ProtectedApp = ({ isFocusMode }: { isFocusMode: boolean }) => {
  const [notification, setNotification] = useState<NotificationItem | null>(
    null,
  );
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;

    // Track page views automatically on route changes
    ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleNotify = (event: Event) => {
      const e = event as CustomEvent<NotificationItem>;
      setNotification(e.detail);
      if (!e.detail.hasActions) {
        setTimeout(() => setNotification(null), 5000);
      }
    };
    window.addEventListener(
      "trackcodex-notification",
      handleNotify as EventListener,
    );
    return () =>
      window.removeEventListener(
        "trackcodex-notification",
        handleNotify as EventListener,
      );
  }, []);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const lastScrollTopRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [profile, setProfile] = useState<UserProfile>(
    profileService.getProfile(),
  );

  useEffect(() => {
    return profileService.subscribe(setProfile);
  }, []);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      // Capture scroll events from any element (global listener with capture phase)
      const target = e.target as HTMLElement;
      if (!target || typeof target.scrollTop === 'undefined') return;

      const currentScrollTop = target.scrollTop;

      // Basic bounce protection
      if (Math.abs(currentScrollTop - lastScrollTopRef.current) < 5) return;

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Hide on scroll down, show on scroll up
      // Only trigger if we've scrolled enough to justify hiding
      if (currentScrollTop > lastScrollTopRef.current && currentScrollTop > 60) {
        setIsNavbarVisible(false);
      } else {
        setIsNavbarVisible(true);
      }

      lastScrollTopRef.current = currentScrollTop;

      // Show when stopped (LinkedIn behavior)
      scrollTimeoutRef.current = setTimeout(() => {
        setIsNavbarVisible(true);
      }, 150);
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

  const isFullPageAction = ["/repositories/new", "/repositories/import"].includes(location.pathname);

  // Global Key Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save: Ctrl+N or Cmd+N
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault(); // Prevent browser new window
        logActivity("save", { context: location.pathname });
        setNotification({
          id: `save-notif-${Date.now()}`,
          type: "info" as const,
          title: "Saved",
          message: "Your changes have been saved.",
          createdAt: new Date().toISOString(),
          read: false,
          hasActions: false,
        });
      }

      // Open Workspace in New Window: Ctrl+Space or Cmd+Space
      if ((e.ctrlKey || e.metaKey) && e.key === " ") {
        e.preventDefault(); // Prevent page scroll
        e.stopPropagation(); // Stop event from bubbling

        // Open workspace in a new window with standalone mode
        let workspaceUrl;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          // Localhost: use query param to trigger standalone mode
          workspaceUrl = `${window.location.origin}/?standalone=true#/workspaces`;
        } else {
          // Production: use subdomain
          workspaceUrl = `https://workspace.trackcodex.com`;
        }

        window.open(workspaceUrl, '_blank', 'width=1200,height=800');
        setNotification({
          id: `workspace-notif-${Date.now()}`,
          type: "info" as const,
          title: "Workspace Opened",
          message: "Workspace opened in a new window.",
          createdAt: new Date().toISOString(),
          read: false,
          hasActions: false,
        });
        return false; // Additional prevention
      }

      // Command Palette: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault(); // Prevent browser search focus
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true); // Use capture phase
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [location.pathname]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isAddMenuOpen && !target.closest(".add-menu-container"))
        setIsAddMenuOpen(false);
      if (isNotificationsOpen && !target.closest(".notifications-container"))
        setIsNotificationsOpen(false);
      if (
        isProfileDropdownOpen &&
        !target.closest(".profile-dropdown-container")
      )
        setIsProfileDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAddMenuOpen, isNotificationsOpen, isProfileDropdownOpen]);

  // Use messaging context
  const { notifications } = useNotifications();
  const { logout } = useAuth();
  const { totalUnreadCount, setIsPanelOpen } = useMessaging();

  // Listen for Real-Time Notification Events (Toast only)
  useEffect(() => {
    const handleRealTimeNotif = (event: Event) => {
      const e = event as CustomEvent<NotificationItem>;
      const newNotif = e.detail;

      // Context handles list update, we only handle toast here
      // Only show toast if not skipped
      if (!newNotif.skipToast) {
        setNotification({
          ...newNotif,
          id: newNotif.id || `toast-${Date.now()}`,
          hasActions: false,
        });
      }
    };
    window.addEventListener(
      "trackcodex-realtime-notification",
      handleRealTimeNotif as EventListener,
    );
    return () =>
      window.removeEventListener(
        "trackcodex-realtime-notification",
        handleRealTimeNotif as EventListener,
      );
  }, []);

  // Use the fetched notifications from Context
  // We explicitly cast to any to avoid type mismatches with legacy NotificationItem during refactor
  // or we just trust the shape is compatible enough for the UI
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const displayNotifications: any[] =
    notifications.length > 0
      ? notifications
      : [
        {
          id: "mock1",
          type: "system",
          title: "Welcome",
          message: "No new notifications yet.",
          timestamp: new Date().toISOString(), // Changed from createdAt
          read: true,
        },
      ];

  return (
    <div className="flex flex-col h-full w-full overflow-hidden text-gh-text font-display bg-gh-bg transition-colors duration-300">
      {/* GitHub-Style Slide-Over Sidebar */}
      {isSidebarOpen && (
        <>
          {/* Dark overlay */}
          <div
            className="fixed inset-0 bg-[#0A0A0A]lack/50 z-[70] animate-in fade-in duration-200"
            onClick={() => setIsSidebarOpen(false)}
          />
          {/* Panel */}
          <div className="fixed top-0 left-0 h-full w-[320px] bg-[#11141A] border-r border-[#1E232E] z-[80] animate-in slide-in-from-left duration-300 flex flex-col overflow-y-auto">
            {/* Header: Logo + Close */}
            <div className="flex items-center justify-between px-4 h-14 shrink-0">
              <button
                onClick={() => { setIsSidebarOpen(false); navigate("/dashboard/home"); }}
                className="text-white hover:text-gh-text-secondary transition-colors group"
                aria-label="Home"
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <TrackCodexLogo size="sm" collapsed clickable={false} />
                </div>
              </button>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-gh-text-secondary hover:text-white transition-colors h-8 w-8 flex items-center justify-center rounded-md hover:bg-[#11141A]"
                aria-label="Close sidebar"
              >
                <span className="material-symbols-outlined !text-[20px]">close</span>
              </button>
            </div>

            {/* Primary Nav */}
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
                <button
                  key={item.label}
                  onClick={() => { setIsSidebarOpen(false); navigate(item.to); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[14px] font-medium transition-colors ${location.pathname === item.to || location.pathname.startsWith(item.to + "/")
                    ? "text-white bg-[#1f6feb]/15"
                    : "text-gh-text hover:bg-[#11141A] hover:text-white"
                    }`}
                >
                  <span className="material-symbols-outlined !text-[18px]">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Divider */}
            <div className="mx-3 my-2 border-t border-[#1E232E]" />

            {/* Footer Nav */}
            <nav className="px-3 py-1 space-y-0.5">
              {[
                { icon: "settings", label: "Settings", to: "/settings" },
                { icon: "help", label: "Help", to: "/help" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => { setIsSidebarOpen(false); navigate(item.to); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[14px] font-medium text-gh-text hover:bg-[#11141A] hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined !text-[18px]">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>

          </div>
        </>
      )}

      <div className="flex-1 flex min-h-0">

        <main
          ref={mainScrollRef}
          className={`flex-1 min-w-0 flex flex-col bg-gh-bg relative ${isIdeView || isFocusMode ? "overflow-hidden" : "overflow-y-auto custom-scrollbar"}`}
        >
          {/* GitHub-Style Navigation Header */}
          {!isIdeView && !isFocusMode && (
            <div className={`h-12 border-b border-gh-border flex items-center px-4 bg-[#0A0D14] shrink-0 sticky top-0 z-40 gap-2 transition-transform duration-300 ${isNavbarVisible ? "translate-y-0" : "-translate-y-full"}`}>
              {/* Left Section: Hamburger + Logo + Page Title */}
              <div className="flex items-center gap-3">
                {/* Hamburger Menu */}
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="text-gh-text hover:text-white transition-colors h-8 w-8 flex items-center justify-center rounded-md hover:bg-[#11141A]"
                  aria-label="Toggle sidebar"
                >
                  <span className="material-symbols-outlined !text-[20px]">menu</span>
                </button>

                {/* Logo */}
                <button
                  onClick={() => navigate("/dashboard/home")}
                  className="text-white hover:text-gh-text-secondary transition-colors flex items-center"
                  aria-label="Home"
                >
                  <div className="w-8 h-8 flex items-center justify-center -translate-y-[2px]">
                    <TrackCodexLogo size="sm" collapsed clickable={false} />
                  </div>
                </button>

                {/* Page Title */}
                <span className="text-gh-text font-semibold text-[14px] hidden sm:inline">
                  {location.pathname === "/repositories/new"
                    ? "New repository"
                    : location.pathname === "/repositories/import"
                      ? "Import repository"
                      : location.pathname.startsWith("/repo/")
                        ? "Repository"
                        : location.pathname.startsWith("/settings")
                          ? "Settings"
                          : ""}
                </span>
              </div>

              {/* Center: Search Bar */}
              <div className="flex-1 flex justify-center max-w-[720px] mx-auto">
                <div
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="flex items-center gap-2 px-3 py-1 bg-[#0A0D14] border border-[#1E232E] rounded-md w-full max-w-[272px] cursor-pointer hover:border-[#58a6ff]/50 transition-colors group"
                >
                  <span className="material-symbols-outlined !text-[14px] text-gh-text-secondary group-hover:text-gh-text">
                    search
                  </span>
                  <span className="text-[13px] text-gh-text-secondary group-hover:text-gh-text flex-1">
                    Type <kbd className="border border-[#1E232E] rounded px-1 text-[10px] bg-[#0A0D14] text-gh-text-secondary ml-0.5">/</kbd> to search
                  </span>
                </div>
              </div>

              {/* Right Section: Action Icons */}
              <div className="flex items-center gap-0.5">
                {/* Divider */}
                <div className="w-px h-5 bg-[#11141A] mx-1" />

                {/* Add/Plus (with dropdown caret) */}
                <div className="relative add-menu-container flex items-center">
                  <button
                    onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                    className="text-gh-text-secondary hover:text-white transition-colors h-8 px-1 flex items-center justify-center rounded-md hover:bg-[#11141A]"
                    aria-label="Create new..."
                  >
                    <span className="material-symbols-outlined !text-[20px]">add</span>
                    <span className="material-symbols-outlined !text-[14px] -ml-0.5">arrow_drop_down</span>
                  </button>
                  {isAddMenuOpen && (
                    <div className="absolute top-full right-0 mt-1 w-56 bg-[#11141A] border border-[#1E232E] rounded-lg shadow-2xl z-50 py-1 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-3 py-2 border-b border-[#1E232E] mb-1">
                        <span className="text-[11px] font-semibold text-gh-text-secondary">
                          Create new...
                        </span>
                      </div>
                      <button
                        onClick={() => { setIsAddMenuOpen(false); navigate("/repositories/new"); }}
                        className="w-full text-left px-4 py-2 text-[13px] text-gh-text hover:bg-[#1f6feb] hover:text-white flex items-center gap-3 transition-colors"
                      >
                        <span className="material-symbols-outlined !text-[16px]">folder_open</span>
                        New repository
                      </button>
                      <button
                        onClick={() => { setIsAddMenuOpen(false); navigate("/repositories/import"); }}
                        className="w-full text-left px-4 py-2 text-[13px] text-gh-text hover:bg-[#1f6feb] hover:text-white flex items-center gap-3 transition-colors"
                      >
                        <span className="material-symbols-outlined !text-[16px]">download</span>
                        Import repository
                      </button>
                      <div className="border-t border-[#1E232E] my-1" />
                      <button
                        onClick={() => { setIsAddMenuOpen(false); navigate("/workspace/new"); }}
                        className="w-full text-left px-4 py-2 text-[13px] text-gh-text hover:bg-[#1f6feb] hover:text-white flex items-center gap-3 transition-colors"
                      >
                        <span className="material-symbols-outlined !text-[16px]">laptop_mac</span>
                        New workspace
                      </button>
                      <button
                        onClick={() => { setIsAddMenuOpen(false); navigate("/strata/new"); }}
                        className="w-full text-left px-4 py-2 text-[13px] text-gh-text hover:bg-[#1f6feb] hover:text-white flex items-center gap-3 transition-colors"
                      >
                        <span className="material-symbols-outlined !text-[16px]">corporate_fare</span>
                        New organization
                      </button>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="w-px h-5 bg-[#11141A] mx-1" />

                {/* Inbox (Repurposed from Issues) */}
                <button
                  onClick={() => setIsPanelOpen(true)}
                  className="text-gh-text-secondary hover:text-white transition-colors relative h-8 w-8 flex items-center justify-center rounded-md hover:bg-[#11141A]"
                  aria-label="Inbox"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path></svg>
                  {totalUnreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 rounded-full ring-2 ring-[#010409] text-[10px] font-bold text-white flex items-center justify-center">
                      {totalUnreadCount}
                    </span>
                  )}
                </button>

                {/* Pull Requests */}
                <button
                  onClick={() => navigate("/repositories")}
                  className="text-gh-text-secondary hover:text-white transition-colors h-8 w-8 flex items-center justify-center rounded-md hover:bg-[#11141A]"
                  aria-label="Pull requests"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"></path></svg>
                </button>

                {/* Notifications */}
                <button
                  onClick={() => navigate("/notifications")}
                  className="text-gh-text-secondary hover:text-white transition-colors relative h-8 w-8 flex items-center justify-center rounded-md hover:bg-[#11141A]"
                  aria-label="Notifications"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 16a2 2 0 0 0 1.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 0 0 8 16ZM3 5a5 5 0 0 1 10 0v2.947c0 .05.015.098.042.139l1.703 2.555A1.519 1.519 0 0 1 13.482 13H2.518a1.516 1.516 0 0 1-1.263-2.36l1.703-2.554A.255.255 0 0 0 3 7.947Zm5-3.5A3.5 3.5 0 0 0 4.5 5v2.947c0 .346-.102.683-.294.97l-1.703 2.556a.017.017 0 0 0-.003.01l.001.006c0 .002.002.004.004.006l.006.004.007.001h10.964l.007-.001.006-.004.004-.006.001-.007a.017.017 0 0 0-.003-.01l-1.703-2.554a1.745 1.745 0 0 1-.294-.97V5A3.5 3.5 0 0 0 8 1.5Z"></path></svg>
                  {displayNotifications.filter((n) => !n.read).length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-[#1f6feb] rounded-full ring-2 ring-[#010409] text-[10px] font-bold text-white flex items-center justify-center">
                      {displayNotifications.filter((n) => !n.read).length}
                    </span>
                  )}
                </button>

                {/* Profile Avatar */}
                <div className="relative profile-dropdown-container ml-1">
                  <div
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="cursor-pointer flex items-center"
                  >
                    <img
                      src={profile.avatar}
                      className="size-5 rounded-full border border-[#1E232E] hover:border-[#58a6ff] transition-colors"
                      alt="Profile"
                    />
                    <span className="material-symbols-outlined !text-[14px] text-gh-text-secondary -ml-0.5">arrow_drop_down</span>
                  </div>
                  {isProfileDropdownOpen && (
                    <UserProfileDropdown
                      profile={profile}
                      onClose={() => setIsProfileDropdownOpen(false)}
                      logout={logout}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          <ErrorBoundary>
            <Routes>
              <Route path="/taskvault" element={<TaskVault />} />
              <Route path="/" element={<Navigate to="/dashboard/home" />} />
              <Route path="/dashboard/home" element={<HomeView />} />
              <Route path="/onboarding/welcome" element={<WelcomeView />} />

              <Route path="/accept-invite" element={<AcceptInvite />} />
              <Route path="/explore" element={<ExploreView />} />
              <Route path="/platform-matrix" element={<PlatformMatrix />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/workspaces" element={<WorkspacesView />} />
              <Route path="/community" element={<CommunityView />} />
              <Route path="/workspace/new" element={<CreateWorkspaceView />} />
              <Route path="/workspace/:id" element={<VSCodeWorkspaceView />} />
              <Route path="/workspace/:id/ide" element={<VSCodeWorkspaceView />} />
              <Route path="/repositories" element={<RepositoriesView />} />
              <Route path="/repositories/new" element={<CreateRepoView />} />
              <Route path="/repositories/import" element={<ImportRepoView />} />
              <Route path="/repo/:owner/:repo/pull/:number" element={<ReviewMode />} />
              <Route path="/repositories/:id/pulls/:number" element={<ReviewMode />} />
              <Route path="/repo/:id/*" element={<RepoDetailView />} />
              <Route
                path="/repositories/:id/discussions/:number"
                element={<DiscussionDetail />}
              />
              <Route path="/dashboard/library" element={<LibraryView />} />
              <Route
                path="/editor"
                element={<EditorView isFocusMode={isFocusMode} />}
              />
              <Route path="/profile" element={<ProfileView />} />
              <Route path="/profile/:userId" element={<PublicProfile />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route
                path="/stars"
                element={<Navigate to="/repositories" replace />}
              />

              <Route path="/notifications" element={<NotificationsView />} />

              {/* Documentation & Blog */}
              <Route path="/docs" element={<DocsLayout />}>
                <Route index element={<DocsViewer />} />
                <Route path="*" element={<DocsViewer />} />
              </Route>

              <Route path="/blog" element={<BlogLayout />}>
                <Route index element={<BlogIndex />} />
                <Route path=":slug" element={<BlogPost />} />
              </Route>

              <Route path="/strata-dashboard" element={<AdminDashboard />} />

              <Route path="/strata" element={<StrataIndexView />} />
              <Route path="/strata/new" element={<CreateStrataView />} />
              <Route path="/strata/:strataId" element={<StrataDetailView />}>
                <Route index element={<StrataOverview />} />
                <Route path="repositories" element={<StrataRepositories />} />
                <Route path="people" element={<StrataPeople />} />
                <Route path="teams" element={<StrataTeams />} />
                <Route path="settings" element={<StrataSettingsLayout />}>
                  <Route index element={<Navigate to="general" replace />} />
                  <Route path="general" element={<StrataGeneralSettings />} />
                  <Route
                    path="authentication"
                    element={<StrataAuthenticationSecurity />}
                  />
                  <Route path="environments" element={<StrataEnvironments />} />
                  <Route path="permissions" element={<StrataPermissions />} />
                  <Route path="webhooks" element={<StrataWebhooks />} />
                  <Route path="*" element={<Navigate to="general" replace />} />
                </Route>
                <Route path="*" element={<Navigate to="" replace />} />
              </Route>

              <Route path="/marketplace" element={<MarketplaceLayout />}>
                <Route index element={<Navigate to="missions" replace />} />
                <Route path="missions" element={<MissionsView />} />
                <Route path="missions/:id" element={<MissionDetailView />} />
                <Route path="trials/:id" element={<MissionDetailView />} />
                <Route path="applications" element={<MyApplicationsView />} />
                <Route path="trials" element={<TrialRepositoriesView />} />

                <Route path="hiring" element={<HiringLayout />}>
                  <Route index element={<Navigate to="discovery" replace />} />
                  <Route
                    path="discovery"
                    element={<CandidateDiscoveryView />}
                  />
                  <Route
                    path="candidate/:id"
                    element={<CandidateScorecardView />}
                  />
                  <Route path="compare" element={<CandidateComparisonView />} />
                  <Route path="offer/:id" element={<OfferEditorView />} />
                  <Route
                    path="schedule/:id"
                    element={<SessionSchedulerView />}
                  />
                  <Route
                    path="feedback/:id"
                    element={<InterviewerFeedbackView />}
                  />
                  <Route path="jobs" element={<HiringJobsView />} />
                  <Route path="analytics" element={<HiringAnalyticsView />} />
                  <Route path="assessments" element={<AssessmentsView />} />
                  <Route
                    path="*"
                    element={<Navigate to="/marketplace/hiring/discovery" replace />}
                  />
                </Route>

                <Route path="growth" element={<GrowthLayout />}>
                  <Route index element={<Navigate to="/marketplace/growth/dashboard" replace />} />
                  <Route path="dashboard" element={<SkillDashboardView />} />
                  <Route path="radar" element={<SkillDashboardView />} />
                  <Route path="path" element={<SkillDashboardView />} />
                  <Route path="certifications" element={<SkillDashboardView />} />
                  <Route
                    path="profile/:id"
                    element={<DeveloperProfileView />}
                  />
                  <Route
                    path="*"
                    element={<Navigate to="/marketplace/growth/dashboard" replace />}
                  />
                </Route>

                <Route path="*" element={<Navigate to="missions" replace />} />
              </Route>

              <Route
                path="/dashboard/jobs"
                element={<Navigate to="/marketplace/missions" replace />}
              />
              <Route
                path="/jobs/:id"
                element={<Navigate to="/marketplace/missions/:id" replace />}
              />
              <Route
                path="/jobs/:id/applications"
                element={<JobApplicationsView />}
              />

              <Route path="/onboarding" element={<OnboardingLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<OnboardingWorkspace />} />
                <Route path="buddy" element={<BuddyDashboardView />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Route>

              <Route path="/finance" element={<WalletDashboard />} />
              <Route path="/welcome/:userId" element={<WelcomeView />} />
              <Route
                path="/offer/:offerId/accept"
                element={<OfferAcceptanceView />}
              />
              <Route
                path="/trials/submitted/:trialId"
                element={<TrialSubmittedView />}
              />

              <Route
                path="/workspace/:id/settings"
                element={<WorkspaceSettings />}
              />
              <Route path="/settings" element={<SettingsLayout />}>
                <Route index element={<Navigate to="profile" replace />} />
                <Route path="profile" element={<ProfileSettings />} />
                <Route path="account" element={<AccountSettings />} />
                <Route path="appearance" element={<AppearanceSettings />} />
                <Route
                  path="accessibility"
                  element={<AccessibilitySettings />}
                />
                <Route
                  path="notifications"
                  element={<NotificationsSettings />}
                />
                <Route path="security" element={<SecuritySettings />} />
                <Route path="emails" element={<EmailSettings />} />
                <Route path="billing" element={<BillingSettings />} />
                <Route
                  path="forge-ai-usage"
                  element={<ForgeAIUsageSettings />}
                />
                <Route
                  path="tokens"
                  element={<PersonalAccessTokensSettings />}
                />
                <Route path="integrations" element={<IntegrationsSettings />} />
                <Route path="sessions" element={<SessionsSettings />} />
                <Route path="ssh-keys" element={<SSHKeysSettings />} />
                <Route path="ahi-cs" element={<AhiCsSettings />} />
                <Route path="privacy" element={<PrivacySettings />} />
                <Route path="billing/usage" element={<BillingUsage />} />
                <Route path="billing/analytics" element={<BillingAnalytics />} />
                <Route path="billing/budgets" element={<BillingBudgets />} />
                <Route path="billing/licensing" element={<BillingLicensing />} />
                <Route path="billing/payment-info" element={<BillingPaymentInfo />} />
                <Route path="billing/payment-history" element={<BillingPaymentHistory />} />
                <Route path="billing/additional" element={<BillingAdditional />} />
                <Route path="*" element={<Navigate to="profile" replace />} />
              </Route>

              <Route path="/forge-ai" element={<ForgeAIView />} />

              <Route
                path="/admin"
                element={
                  <RoleGuard>
                    <AdminRoomView />
                  </RoleGuard>
                }
              >
                <Route index element={<AdminOverview />} />
                <Route path="users" element={<UserManager />} />
                <Route path="teams" element={<TeamManager />} />
                <Route path="workspaces" element={<WorkspaceMonitor />} />
                <Route path="repositories" element={<RepositoryGovernance />} />
                <Route path="jobs" element={<JobOversight />} />
                <Route path="community" element={<CommunityModeration />} />
                <Route path="roles" element={<RoleEditor />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>

              {/* GitHub-style owner/repo URLs (catch-all, must be last) */}
              <Route path="/:owner/:repo/*" element={<RepoDetailView />} />

              {/* GitHub-style user directory fallback (must be after repo catch-all) */}
              <Route path="/:username" element={<PublicProfile />} />

              <Route path="*" element={<Navigate to="/dashboard/home" />} />
            </Routes>
          </ErrorBoundary>

          {!isIdeView && !isFocusMode && !isFullPageAction && <Footer />}
        </main>
      </div >
      {!isFocusMode && <MessagingPanel />}
      <ChatWidget />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div >
  );
};

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [isAppLoading] = useState(false);

  if (isLoading || isAppLoading) {
    return <SplashScreen />;
  }

  return (
    <ChunkErrorBoundary>
      <React.Suspense fallback={<SplashScreen />}>
        <div className="flex flex-col h-screen overflow-hidden">
          <main className={`flex-1 flex flex-col min-h-0 overflow-y-auto ${location.pathname === "/" ? "no-scrollbar" : "custom-scrollbar"}`}>
            <Routes>
              {/* Public Pages with Static Footer */}
              <Route
                element={
                  <>
                    <Outlet />
                    <Footer />
                  </>
                }
              >
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/status" element={<Status />} />
                <Route path="/security" element={<Security />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/cookies" element={<CookiePolicy />} />
                <Route
                  path="/auth/callback/:provider"
                  element={<OAuthCallback />}
                />
                {!isAuthenticated && (
                  <>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/" element={<LandingPage />} />
                    <Route path="*" element={<RedirectToLogin />} />
                  </>
                )}
              </Route>

              {/* Application */}
              {isAuthenticated && (
                <>
                  <Route path="/logout" element={<SignOut />} />
                  <Route path="/*" element={<ProtectedApp isFocusMode={false} />} />
                </>
              )}
            </Routes>
          </main>
          <CookieConsent />
        </div>
      </React.Suspense>
    </ChunkErrorBoundary>
  );
};

const AppWithProviders = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <NotificationProvider>
      {isAuthenticated && user ? (
        <RealtimeProvider userId={user.id}>
          <MessagingProvider>
            <AppContent />
          </MessagingProvider>
        </RealtimeProvider>
      ) : (
        <AppContent />
      )}
    </NotificationProvider>
  );
};

const App = () => {
  // Use HashRouter ONLY for Electron (local file protocol)
  const isElectron = window.navigator.userAgent.toLowerCase().includes('electron') || window.location.protocol === 'file:';
  const Router = isElectron ? HashRouter : BrowserRouter;

  // --- ROOT FIX: Force Hash-to-Path Redirect ---
  // If a user lands on a legacy hashed URL (e.g. /#/login), 
  // we immediately convert it to a clean URL (/login).
  useEffect(() => {
    if (!isElectron && window.location.hash.startsWith('#/')) {
      const cleanPath = window.location.hash.substring(2);
      window.history.replaceState(null, '', `/${cleanPath}`);
    }
  }, [isElectron]);

  return (
    <ThemeProvider>
      <Router
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AuthProvider>
          <AppWithProviders />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
