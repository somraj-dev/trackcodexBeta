import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../services/infra/api";
import IntegrationPermissionModal from "../../components/settings/IntegrationPermissionModal";

// Reusable Section Component (matching ProfileSettings)
const SettingsSection: React.FC<{
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-gh-border first:pt-0 first:border-[#1A1A1A]">
    <div className="md:col-span-1">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="text-sm text-gh-text-secondary mt-1">{description}</p>
    </div>
    <div className="md:col-span-2 bg-gh-bg-secondary border border-gh-border rounded-xl p-6 space-y-6 shadow-sm">
      {children}
    </div>
  </section>
);

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string; // Material symbol or image URL
  connected: boolean;
  color: string;
  isCustomIcon?: boolean;
}

const IntegrationCard: React.FC<{
  integration: Integration;
  onToggle: () => void;
}> = ({ integration, onToggle }) => (
  <div className="flex items-center justify-between p-4 bg-gh-bg border border-gh-border rounded-lg hover:border-slate-600 transition-colors">
    <div className="flex items-center gap-4">
      <div
        className={`size-12 rounded-lg bg-gh-bg border border-gh-border flex items-center justify-center ${integration.color}`}
      >
        <span className="material-symbols-outlined text-2xl">
          {integration.icon}
        </span>
      </div>
      <div>
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          {integration.name}
          {integration.connected && (
            <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Connected
            </span>
          )}
        </h4>
        <p className="text-xs text-gh-text-secondary mt-0.5">
          {integration.description}
        </p>
      </div>
    </div>
    <button
      onClick={onToggle}
      className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${integration.connected
        ? "bg-transparent border-gh-border text-gh-text-secondary hover:text-white hover:border-red-500/50 hover:bg-red-500/10"
        : "bg-primary border-transparent text-white hover:bg-[#0A0A0A]lue-600 shadow-lg shadow-primary/20"
        }`}
    >
      {integration.connected ? "Disconnect" : "Connect"}
    </button>
  </div>
);

const IntegrationsSettings = () => {
  // Initial State with Mock Data
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "google",
      name: "Google",
      description:
        "Connect your Google account to sign in faster and sync data.",
      icon: "mail",
      connected: false,
      color: "text-red-500",
    },
    {
      id: "github",
      name: "GitHub",
      description:
        "Sync repositories, issues, and pull requests via Git protocol.",
      icon: "code",
      connected: false,
      color: "text-white",
    },
    {
      id: "gitlab",
      name: "GitLab",
      description: "Connect your GitLab projects and CI/CD pipelines.",
      icon: "code_blocks",
      connected: false,
      color: "text-orange-500",
    },
    {
      id: "forgebrowser",
      name: "ForgeBrowser",
      description: "Enable deep context search across web resources.",
      icon: "travel_explore",
      connected: true,
      color: "text-cyan-400",
    },
    {
      id: "quantalab",
      name: "QuantaLab",
      description: "Unified lab environment for AI experiments.",
      icon: "science",
      connected: false,
      color: "text-purple-400",
    },
    {
      id: "quantacode",
      name: "QuantaCode",
      description: "Advanced code analysis and refactoring engine.",
      icon: "code_off",
      connected: true,
      color: "text-emerald-400",
    },
  ]);

  // Load integration status from backend (server-side tokens only)
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const saved = localStorage.getItem("trackcodex_integrations");
        let current = integrations;
        if (saved) {
          current = JSON.parse(saved);
        }

        // Check connection status from backend (no tokens stored client-side)
        const status = await api.integrations.status();
        if (status?.connected) {
          current = current.map((int) => ({
            ...int,
            connected: !!status.connected[int.id],
          }));
        }

        setIntegrations(current);
      } catch {
        // Fall back to saved state
      }
    };
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleConnection = useCallback((id: string) => {
    setIntegrations((prev) => {
      const updated = prev.map((int) =>
        int.id === id ? { ...int, connected: !int.connected } : int,
      );
      localStorage.setItem("trackcodex_integrations", JSON.stringify(updated));

      // Show notification
      const integration = updated.find((i) => i.id === id);
      if (integration) {
        window.dispatchEvent(
          new CustomEvent("trackcodex-notification", {
            detail: {
              title: integration.connected
                ? "Integration Connected"
                : "Integration Disconnected",
              message: `${integration.name} has been ${integration.connected ? "successfully connected" : "disconnected"}.`,
              type: integration.connected ? "success" : "info",
            },
          }),
        );
      }
      return updated;
    });
  }, []);


  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [pendingIntegration, setPendingIntegration] = useState<Integration | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Handle GitHub OAuth Callback (Legacy cleanup - effectively handled in OAuthCallback now)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code && !isVerifying) {
      // Small delay to ensure state is ready if needed, 
      // but primarily OAuthCallback handles the redirect now.
      // We keep this as a secondary safety if the redirect is to this page.
      const handleGithubCode = async () => {
        try {
          setIsVerifying(true);
          const response = await api.integrations.githubCallback(code);
          
          if (response.success) {
            if (response.username) {
              localStorage.setItem("trackcodex_github_username", response.username);
            }
            toggleConnection("github");
            api.integrations.syncGithub().catch(console.error);

            window.dispatchEvent(
              new CustomEvent("trackcodex-notification", {
                detail: {
                  title: "GitHub Connected",
                  message: "Successfully integrated with GitHub. Syncing data...",
                  type: "success",
                },
              }),
            );
          }
        } catch (error) {
          console.error("GitHub integration failed:", error);
        } finally {
          setIsVerifying(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };
      handleGithubCode();
    }
  }, [toggleConnection, isVerifying]);

  const handleConnectClick = (integration: Integration) => {
    if (integration.connected) {
      // Disconnect via backend
      toggleConnection(integration.id);
        try {
          api.integrations.disconnect(integration.id);
        } catch (err) {
          console.error("Disconnect failed:", err);
        }
    } else {
      // Open Permission Modal first
      setPendingIntegration(integration);
      setShowPermissionModal(true);
    }
  };

  const handlePermissionConfirm = async () => {
    setShowPermissionModal(false);
    if (!pendingIntegration) return;

    if (pendingIntegration.id === "github") {
      try {
        setIsVerifying(true);
        
        // Use standard redirect URI registered in GitHub App
        const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
        const redirectUri = `${window.location.origin}/auth/callback/github`;
        const scope = "repo,read:user,read:org";
        const state = Math.random().toString(36).substring(7);
        
        const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
        
        // Save state and return path
        localStorage.setItem("github_oauth_state", state);
        localStorage.setItem("integration_return_path", window.location.pathname);
        localStorage.setItem("integration_pending_provider", "github");
        
        // Navigate directly to GitHub
        window.location.href = githubUrl;
        
      } catch (err: any) {
        console.error("GitHub OAuth redirect failed:", err);
        setIsVerifying(false);
      }
    } else if (pendingIntegration.id === "gitlab") {
      try {
        setIsVerifying(true);
        const clientId = import.meta.env.VITE_GITLAB_CLIENT_ID;
        const redirectUri = `${window.location.origin}/auth/callback/gitlab`;
        const scope = "api read_user read_repository";
        const state = Math.random().toString(36).substring(7);

        const gitlabUrl = `https://gitlab.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}`;

        localStorage.setItem("gitlab_oauth_state", state);
        localStorage.setItem("integration_return_path", window.location.pathname);
        localStorage.setItem("integration_pending_provider", "gitlab");

        window.location.href = gitlabUrl;
      } catch (err: any) {
        console.error("GitLab OAuth redirect failed:", err);
        setIsVerifying(false);
      }
    } else {
      // For non-VCS integrations
      toggleConnection(pendingIntegration.id);
    }
    setPendingIntegration(null);
  };

  return (
    <div className="space-y-10 relative">
      {/* Permission Modal */}
      <IntegrationPermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onConfirm={handlePermissionConfirm}
        integration={pendingIntegration}
      />

      <header className="border-b border-gh-border pb-6">
        <h1 className="text-2xl font-black text-white tracking-tight">
          Integrations
        </h1>
        <p className="text-sm text-gh-text-secondary mt-1 leading-relaxed">
          Connect external tools to enhance ForgeAI's context and capabilities.
        </p>
      </header>

      <SettingsSection
        title="Version Control"
        description="Connect your code repositories."
      >
        <div className="space-y-4">
          {integrations
            .filter((i) => ["google", "github", "gitlab"].includes(i.id))
            .map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onToggle={() => handleConnectClick(integration)}
              />
            ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Ecosystem Tools"
        description="Integrate with the wider Quantaforze LLC ecosystem."
      >
        <div className="space-y-4">
          {integrations
            .filter((i) => !["google", "github", "gitlab"].includes(i.id))
            .map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onToggle={() => handleConnectClick(integration)}
              />
            ))}
        </div>
      </SettingsSection>
    </div>
  );
};

export default IntegrationsSettings;


