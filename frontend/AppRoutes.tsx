import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import PublicLayout from "./components/layout/PublicLayout";
import RedirectToLogin from "./components/auth/RedirectToLogin";
import RedirectAfterAuth from "./components/auth/RedirectAfterAuth";
import SettingsLayout from "./components/settings/SettingsLayout";
import { useAuth } from "./context/AuthContext";

// Lazy imports (extracted from App.tsx)
// Auth
const Login = React.lazy(() => import("./views/auth/Login"));
const Signup = React.lazy(() => import("./views/auth/Signup"));
const OAuthCallback = React.lazy(() => import("./views/auth/OAuthCallback"));
const DesktopBridge = React.lazy(() => import("./views/auth/DesktopBridge"));
const ForgotPassword = React.lazy(() => import("./views/auth/ForgotPassword"));
const ResetPassword = React.lazy(() => import("./views/auth/ResetPassword"));
const Onboarding = React.lazy(() => import("./views/auth/Onboarding"));
const ResolveConflict = React.lazy(() => import("./views/auth/ResolveConflict"));
const SignOut = React.lazy(() => import("./views/auth/SignOut"));
const LandingPage = React.lazy(() => import("./views/LandingPage"));

// Core
const RepositoriesView = React.lazy(() => import("./views/repo/Repositories"));
const RepoDetailView = React.lazy(() => import("./views/repo/RepoDetail"));
const EditorView = React.lazy(() => import("./views/editor/Editor"));
const ProfileView = React.lazy(() => import("./views/profile/Profile"));
const Overview = React.lazy(() => import("./views/Overview"));
const WorkspacesView = React.lazy(() => import("./views/workspace/Workspaces"));
const CreateWorkspaceView = React.lazy(() => import("./views/workspace/CreateWorkspace"));
const PublicProfile = React.lazy(() => import("./views/profile/PublicProfile"));
const Portfolio = React.lazy(() => import("./views/profile/Portfolio"));
const ReviewMode = React.lazy(() => import("./views/editor/ReviewMode"));
const VSCodeWorkspaceView = React.lazy(() => import("./views/ide/VSCodeWorkspaceView"));
const HomeView = React.lazy(() => import("./views/Home"));
const ExploreView = React.lazy(() => import("./views/Explore"));
const LibraryView = React.lazy(() => import("./views/Library"));
const ForgeAIView = React.lazy(() => import("./views/ForgeAI"));
const NotificationsView = React.lazy(() => import("./views/NotificationsView"));
const MessagesView = React.lazy(() => import("./views/messages/MessagesView"));
const AcceptInvite = React.lazy(() => import("./views/AcceptInvite"));
const Leaderboard = React.lazy(() => import("./views/community/Leaderboard"));
const AdminRoomView = React.lazy(() => import("./views/admin/Admin"));
const TaskVault = React.lazy(() => import("./views/TaskVault"));
const PlatformMatrix = React.lazy(() => import("./views/admin/PlatformMatrix"));
const Terms = React.lazy(() => import("./views/legal/Terms"));
const Privacy = React.lazy(() => import("./views/legal/Privacy"));
const Status = React.lazy(() => import("./views/legal/Status"));
const Security = React.lazy(() => import("./views/legal/Security"));
const Contact = React.lazy(() => import("./views/legal/Contact"));
const CookiePolicy = React.lazy(() => import("./views/legal/CookiePolicy"));
const CommunityView = React.lazy(() => import("./views/community/Community"));
const DiscussionDetail = React.lazy(() => import("./views/community/DiscussionDetail"));
const CreateRepoView = React.lazy(() => import("./views/repo/CreateRepo"));
const ImportRepoView = React.lazy(() => import("./views/repo/ImportRepo"));
const IssueDetail = React.lazy(() => import("./views/repo/IssueDetail"));
const SearchResults = React.lazy(() => import("./views/SearchResults"));
const TrackCoinView = React.lazy(() => import("./views/TrackCoin"));

// Strata
const StrataIndexView = React.lazy(() => import("./views/organizations/StrataIndexView"));
const StrataDetailView = React.lazy(() => import("./views/organizations/StrataDetailView"));
const StrataOverview = React.lazy(() => import("./components/organizations/StrataOverview"));
const CreateStrataView = React.lazy(() => import("./views/organizations/CreateStrata"));
const StrataRepositories = React.lazy(() => import("./components/organizations/StrataRepositories"));
const StrataPeople = React.lazy(() => import("./components/organizations/StrataPeople"));
const StrataTeams = React.lazy(() => import("./components/organizations/StrataTeams"));
const StrataSettingsLayout = React.lazy(() => import("./components/organizations/StrataSettingsLayout"));
const StrataGeneralSettings = React.lazy(() => import("./views/organizations/settings/StrataGeneralSettings"));
const StrataAuthenticationSecurity = React.lazy(() => import("./views/organizations/settings/StrataAuthenticationSecurity"));
const StrataEnvironments = React.lazy(() => import("./views/organizations/settings/StrataEnvironments"));
const StrataPermissions = React.lazy(() => import("./views/organizations/settings/StrataPermissions"));
const StrataWebhooks = React.lazy(() => import("./views/organizations/settings/StrataWebhooks"));

// Settings
const AppearanceSettings = React.lazy(() => import("./views/settings/AppearanceSettings"));
const EmailSettings = React.lazy(() => import("./views/settings/EmailSettings"));
const SecuritySettings = React.lazy(() => import("./views/settings/SecuritySettings"));
const AccountSettings = React.lazy(() => import("./views/settings/AccountSettings"));
const ProfileSettings = React.lazy(() => import("./views/settings/ProfileSettings"));
const BillingSettings = React.lazy(() => import("./views/settings/BillingSettings"));
const ForgeAIUsageSettings = React.lazy(() => import("./views/settings/ForgeAIUsageSettings"));
const AccessibilitySettings = React.lazy(() => import("./views/settings/AccessibilitySettings"));
const DataManagementView = React.lazy(() => import("./views/settings/DataManagementView"));
const NotificationsSettings = React.lazy(() => import("./views/settings/NotificationsSettings"));
const PersonalAccessTokensSettings = React.lazy(() => import("./views/settings/PersonalAccessTokensSettings"));
const IntegrationsSettings = React.lazy(() => import("./views/settings/IntegrationsSettings"));
const SessionsSettings = React.lazy(() => import("./views/settings/SessionsSettings"));
const SSHKeysSettings = React.lazy(() => import("./views/settings/SSHKeysSettings"));
const AhiCsSettings = React.lazy(() => import("./views/settings/AhiCsSettings"));
const PrivacySettings = React.lazy(() => import("./views/settings/PrivacySettings"));
const BillingUsage = React.lazy(() => import("./views/settings/billing/BillingUsage"));
const BillingAnalytics = React.lazy(() => import("./views/settings/billing/BillingAnalytics"));
const BillingBudgets = React.lazy(() => import("./views/settings/billing/BillingBudgets"));
const BillingLicensing = React.lazy(() => import("./views/settings/billing/BillingLicensing"));
const BillingPaymentInfo = React.lazy(() => import("./views/settings/billing/BillingPaymentInfo"));
const BillingPaymentHistory = React.lazy(() => import("./views/settings/billing/BillingPaymentHistory"));
const BillingAdditional = React.lazy(() => import("./views/settings/billing/BillingAdditional"));

// Marketplace & Hiring
const MarketplaceLayout = React.lazy(() => import("./views/marketplace/MarketplaceLayout"));
const MissionsView = React.lazy(() => import("./views/marketplace/MissionsView"));
const MissionDetailView = React.lazy(() => import("./views/marketplace/MissionDetailView"));
const MyApplicationsView = React.lazy(() => import("./views/marketplace/MyApplicationsView"));
const TrialRepositoriesView = React.lazy(() => import("./views/marketplace/TrialRepositoriesView"));
const HiringLayout = React.lazy(() => import("./views/hiring/HiringLayout"));
const CandidateDiscoveryView = React.lazy(() => import("./views/hiring/CandidateDiscoveryView"));
const HiringJobsView = React.lazy(() => import("./views/hiring/HiringJobsView"));
const HiringAnalyticsView = React.lazy(() => import("./views/hiring/HiringAnalyticsView"));
const CandidateScorecardView = React.lazy(() => import("./views/hiring/CandidateScorecardView"));
const CandidateComparisonView = React.lazy(() => import("./views/hiring/CandidateComparisonView"));
const OfferEditorView = React.lazy(() => import("./views/hiring/OfferEditorView"));
const SessionSchedulerView = React.lazy(() => import("./views/hiring/SessionSchedulerView"));
const InterviewerFeedbackView = React.lazy(() => import("./views/hiring/InterviewerFeedbackView"));
const AssessmentsView = React.lazy(() => import("./views/hiring/AssessmentsView"));

// Onboarding & Growth
const WelcomeView = React.lazy(() => import("./views/onboarding/WelcomeView"));
const GrowthLayout = React.lazy(() => import("./views/growth/GrowthLayout"));
const SkillDashboardView = React.lazy(() => import("./views/growth/SkillDashboardView"));
const DeveloperProfileView = React.lazy(() => import("./views/growth/DeveloperProfileView"));

// Finance & Admin
const WalletDashboard = React.lazy(() => import("./views/finance/WalletDashboard"));
const AdminOverview = React.lazy(() => import("./components/admin/AdminOverview"));
const UserManager = React.lazy(() => import("./components/admin/UserManager"));
const TeamManager = React.lazy(() => import("./components/admin/TeamManager"));
const WorkspaceMonitor = React.lazy(() => import("./components/admin/WorkspaceMonitor"));
const RepositoryGovernance = React.lazy(() => import("./components/admin/RepositoryGovernance"));
const JobOversight = React.lazy(() => import("./components/admin/JobOversight"));
const CommunityModeration = React.lazy(() => import("./components/admin/CommunityModeration"));
const RoleEditor = React.lazy(() => import("./components/admin/RoleEditor"));
const AuditLogs = React.lazy(() => import("./components/admin/AuditLogs"));

// Docs & Blog
// (Placeholders removed - will be added when features are ready)

import { RoleGuard } from "./components/auth";

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/auth/desktop-login" element={<DesktopBridge />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/status" element={<Status />} />
        <Route path="/security" element={<Security />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/auth/callback/:provider" element={<OAuthCallback />} />

        {!isAuthenticated && (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/resolve-conflict" element={<ResolveConflict />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<RedirectToLogin />} />
          </>
        )}
      </Route>

      {/* Protected Pages */}
      {isAuthenticated && (
        <>
          <Route path="/logout" element={<SignOut />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<RedirectAfterAuth />} />
          <Route path="/signup" element={<RedirectAfterAuth />} />
          <Route path="/forgot-password" element={<RedirectAfterAuth />} />
          <Route path="/reset-password" element={<RedirectAfterAuth />} />
          
          <Route element={<MainLayout />}>
            <Route path="/taskvault" element={<TaskVault />} />
            <Route path="/" element={<HomeView />} />
            <Route path="/dashboard/home" element={<HomeView />} />
            <Route path="/onboarding/welcome" element={<WelcomeView />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route path="/explore" element={<ExploreView />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/platform-matrix" element={<PlatformMatrix />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/workspaces" element={<WorkspacesView />} />
            <Route path="/community" element={<CommunityView />} />
            <Route path="/community/*" element={<CommunityView />} />
            <Route path="/trackcoin" element={<TrackCoinView />} />
            <Route path="/workspace/new" element={<CreateWorkspaceView />} />
            <Route path="/workspace/:id" element={<VSCodeWorkspaceView />} />
            <Route path="/workspace/:id/ide" element={<VSCodeWorkspaceView />} />
            <Route path="/repositories" element={<RepositoriesView />} />
            <Route path="/repositories/new" element={<CreateRepoView />} />
            <Route path="/repositories/import" element={<ImportRepoView />} />
            <Route path="/repo/:owner/:repo/pull/:number" element={<ReviewMode />} />
            <Route path="/repo/:id/pulls/:number" element={<ReviewMode />} />
            <Route path="/repo/:id/discussions/:number" element={<DiscussionDetail />} />
            <Route path="/repo/:id/issues/:number" element={<IssueDetail />} />
            <Route path="/repo/:id/*" element={<RepoDetailView />} />
            <Route path="/dashboard/library" element={<LibraryView />} />
            <Route path="/editor" element={<EditorView />} />
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/profile/:userId" element={<PublicProfile />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/notifications" element={<NotificationsView />} />
            <Route path="/messages" element={<MessagesView />} />

            {/* Strata */}
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
                <Route path="authentication" element={<StrataAuthenticationSecurity />} />
                <Route path="environments" element={<StrataEnvironments />} />
                <Route path="permissions" element={<StrataPermissions />} />
                <Route path="webhooks" element={<StrataWebhooks />} />
              </Route>
            </Route>

            {/* Marketplace */}
            <Route path="/marketplace" element={<MarketplaceLayout />}>
              <Route index element={<Navigate to="missions" replace />} />
              <Route path="missions" element={<MissionsView />} />
              <Route path="missions/:id" element={<MissionDetailView />} />
              <Route path="trials/:id" element={<MissionDetailView />} />
              <Route path="applications" element={<MyApplicationsView />} />
              <Route path="trials" element={<TrialRepositoriesView />} />
              <Route path="hiring" element={<HiringLayout />}>
                <Route index element={<Navigate to="discovery" replace />} />
                <Route path="discovery" element={<CandidateDiscoveryView />} />
                <Route path="candidate/:id" element={<CandidateScorecardView />} />
                <Route path="compare" element={<CandidateComparisonView />} />
                <Route path="offer/:id" element={<OfferEditorView />} />
                <Route path="schedule/:id" element={<SessionSchedulerView />} />
                <Route path="feedback/:id" element={<InterviewerFeedbackView />} />
                <Route path="jobs" element={<HiringJobsView />} />
                <Route path="analytics" element={<HiringAnalyticsView />} />
                <Route path="assessments" element={<AssessmentsView />} />
              </Route>
              <Route path="growth" element={<GrowthLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<SkillDashboardView />} />
                <Route path="profile/:id" element={<DeveloperProfileView />} />
              </Route>
            </Route>

            {/* Settings */}
            <Route path="/settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<ProfileSettings />} />
              <Route path="account" element={<AccountSettings />} />
              <Route path="appearance" element={<AppearanceSettings />} />
              <Route path="accessibility" element={<AccessibilitySettings />} />
              <Route path="notifications" element={<NotificationsSettings />} />
              <Route path="security" element={<SecuritySettings />} />
              <Route path="emails" element={<EmailSettings />} />
              <Route path="billing" element={<BillingSettings />} />
              <Route path="forge-ai-usage" element={<ForgeAIUsageSettings />} />
              <Route path="tokens" element={<PersonalAccessTokensSettings />} />
              <Route path="data" element={<DataManagementView />} />
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
            </Route>

            <Route path="/forge-ai" element={<ForgeAIView />} />
            <Route path="/finance" element={<WalletDashboard />} />

            {/* Admin */}
            <Route path="/admin" element={<RoleGuard><AdminRoomView /></RoleGuard>}>
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<UserManager />} />
              <Route path="teams" element={<TeamManager />} />
              <Route path="workspaces" element={<WorkspaceMonitor />} />
              <Route path="repositories" element={<RepositoryGovernance />} />
              <Route path="jobs" element={<JobOversight />} />
              <Route path="community" element={<CommunityModeration />} />
              <Route path="roles" element={<RoleEditor />} />
              <Route path="audit-logs" element={<AuditLogs />} />
            </Route>

            {/* Catch-alls */}
            <Route path="/:owner/:repo/*" element={<RepoDetailView />} />
            <Route path="/:username" element={<PublicProfile />} />
            <Route path="*" element={<Navigate to="/dashboard/home" replace />} />
          </Route>
        </>
      )}
    </Routes>
  );
};

export default AppRoutes;

