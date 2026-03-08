import React, { useState, useEffect } from "react";
import { auth, githubProvider } from "../../lib/firebase";
import { signInWithPopup, GithubAuthProvider } from "firebase/auth";
import { api } from "../../services/infra/api";
import { githubService } from "../../services/git/github";
import { gitlabService } from "../../services/git/gitlab";
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
  }, []);

  const toggleConnection = (id: string) => {
    const updated = integrations.map((int) =>
      int.id === id ? { ...int, connected: !int.connected } : int,
    );
    setIntegrations(updated);
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
  };


  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [pendingIntegration, setPendingIntegration] = useState<Integration | null>(null);

  // Manual Token flow state (Fallback)
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [activeIntegrationId, setActiveIntegrationId] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OAuth Handler
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const service = params.get("service");
    const token = params.get("token");
    const username = params.get("username");

    if (service && token) {
      // Persist token to backend (server-side only)
      const submitOAuthToken = async () => {
        try {
          await api.integrations.connect(service, token, username || undefined);
        } catch { }
      };
      submitOAuthToken();
      if (service === "github") {
        if (username) localStorage.setItem("trackcodex_github_username", username);
        toggleConnection("github");
      } else if (service === "gitlab") {
        toggleConnection("gitlab");
      }

      // Clear URL
      window.history.replaceState({}, document.title, window.location.pathname);

      window.dispatchEvent(
        new CustomEvent("trackcodex-notification", {
          detail: {
            title: "Integration Successful",
            message: `Successfully connected to ${service === 'github' ? 'GitHub' : 'GitLab'}.`,
            type: "success",
          },
        }),
      );
    }
  }, [integrations]);

  const handleConnectClick = (integration: Integration) => {
    if (integration.connected) {
      // Disconnect via backend
      toggleConnection(integration.id);
      try {
        api.integrations.disconnect(integration.id);
      } catch { }
    } else {
      // Open Permission Modal first
      setPendingIntegration(integration);
      setShowPermissionModal(true);
    }
  };

  const handlePermissionConfirm = async () => {
    setShowPermissionModal(false);
    if (!pendingIntegration) return;

    // Use Firebase OAuth to link GitHub/GitLab identity
    if (pendingIntegration.id === "github" || pendingIntegration.id === "gitlab") {
      try {
        const provider = pendingIntegration.id as "github" | "gitlab";

        // Save return path so we come back to integrations after OAuth
        localStorage.setItem("integration_return_path", window.location.pathname);
        localStorage.setItem("integration_pending_provider", provider);

        // Use Firebase signInWithPopup for GitHub
        if (provider === "github") {
          const result = await signInWithPopup(auth, githubProvider);
          const credential = GithubAuthProvider.credentialFromResult(result);
          const accessToken = credential?.accessToken;
          if (accessToken) {
            // Persist token to backend
            await api.integrations.connect(provider, accessToken);
          }
        } else {
          // GitLab: Fall back to manual token entry
          setActiveIntegrationId(pendingIntegration.id);
        }
      } catch (err: any) {
        console.error("OAuth link failed:", err);
        // Fallback to manual token entry
        setActiveIntegrationId(pendingIntegration.id);
        setShowTokenModal(true);
      }
    } else {
      // For non-VCS integrations, just toggle
      toggleConnection(pendingIntegration.id);
    }
    setPendingIntegration(null);
  };

  const submitToken = async () => {
    setError(null);
    setIsVerifying(true);
    try {
      if (activeIntegrationId === "github") {
        const data = await githubService.verifyToken(tokenInput);
        // Persist to backend only, never localStorage
        await api.integrations.connect("github", tokenInput, data.login || undefined);
        if (data.login) {
          localStorage.setItem("trackcodex_github_username", data.login);
        }
      } else if (activeIntegrationId === "gitlab") {
        await gitlabService.verifyToken(tokenInput);
        await api.integrations.connect("gitlab", tokenInput);
      }

      toggleConnection(activeIntegrationId || "");
      setShowTokenModal(false);
      setTokenInput("");

      window.dispatchEvent(
        new CustomEvent("trackcodex-notification", {
          detail: {
            title: `${activeIntegrationId === "github" ? "GitHub" : "GitLab"} Verified`,
            message: "Token valid. Fetching repositories...",
            type: "success",
          },
        }),
      );
    } catch (error) {
      console.error("Token verification failed:", error);
      setError("Invalid Personal Access Token. Please check scopes.");
    } finally {
      setIsVerifying(false);
    }
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

      {/* Token Modal - Fallback for when OAuth is not configured */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]lack/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gh-bg-secondary border border-gh-border p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setShowTokenModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-xl font-bold text-white mb-2">
              Connect {activeIntegrationId === "github" ? "GitHub" : "GitLab"}
            </h3>
            <p className="text-sm text-yellow-500/80 mb-6 bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
              <strong>Development Mode:</strong> OAuth Client ID not configured. Please enter a Personal Access Token manually.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Personal Access Token
                </label>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder={
                    activeIntegrationId === "github" ? "ghp_..." : "glpat-..."
                  }
                  className="w-full bg-gh-bg border border-gh-border rounded-xl px-4 py-3 text-white text-sm focus:ring-1 focus:ring-primary outline-none"
                />
                {error && (
                  <p className="text-xs text-rose-500 mt-2 font-bold">
                    {error}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <a
                  href={
                    activeIntegrationId === "github"
                      ? "https://github.com/settings/tokens/new?scopes=repo&description=TrackCodex"
                      : "https://gitlab.com/-/profile/personal_access_tokens?name=TrackCodex&scopes=api"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-4 py-2 hover:bg-white/5 rounded-xl text-xs font-bold text-slate-400 transition-colors"
                >
                  Generate Token
                  <span className="material-symbols-outlined !text-[14px] ml-1">
                    open_in_new
                  </span>
                </a>
                <button
                  onClick={submitToken}
                  disabled={!tokenInput || isVerifying}
                  className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#0A0A0A]lue-600 transition-all disabled:opacity-50"
                >
                  {isVerifying ? "Verifying..." : "Connect"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
