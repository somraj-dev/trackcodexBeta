import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../lib/firebase";
import { getRedirectResult } from "firebase/auth";
import { api } from "../../services/infra/api";

const OAuthCallback: React.FC = () => {
  const { provider } = useParams<{ provider: "google" | "github" | "gitlab" }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const hasRun = React.useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const handleCallback = async () => {
      try {
        // Check for manual code in URL (direct redirect flow)
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (provider === "github" && code) {
          const response = await api.integrations.githubCallback(code);
          if (response.success) {
            const redirectPath =
              localStorage.getItem("integration_return_path") ||
              "/settings/integrations";
            localStorage.removeItem("integration_return_path");
            localStorage.removeItem("integration_pending_provider");
            navigate(redirectPath, { replace: true });
            return;
          }
        }

        if (provider === "gitlab" && code) {
          const response = await api.integrations.gitlabCallback(code);
          if (response.success) {
            const redirectPath =
              localStorage.getItem("integration_return_path") ||
              "/settings/integrations";
            localStorage.removeItem("integration_return_path");
            localStorage.removeItem("integration_pending_provider");
            navigate(redirectPath, { replace: true });
            return;
          }
        }

        // Firebase handles OAuth redirect internally
        // getRedirectResult picks up the result after redirect
        const result = await getRedirectResult(auth);

        if (result?.user) {
          // Auth state change handled by onAuthStateChanged in AuthContext
          const redirectPath =
            localStorage.getItem("integration_return_path") ||
            localStorage.getItem("redirect_after_login") ||
            "/home";
          localStorage.removeItem("integration_return_path");
          localStorage.removeItem("integration_pending_provider");
          localStorage.removeItem("redirect_after_login");
          navigate(redirectPath, { replace: true });
        } else if (isAuthenticated) {
          // Already authenticated (popup flow completed)
          navigate("/home", { replace: true });
        } else {
          // Wait briefly for auth state to update
          setTimeout(() => {
            if (auth.currentUser) {
              navigate("/home", { replace: true });
            } else {
              setError("Authentication did not complete. Please try again.");
              setTimeout(() => navigate("/login"), 3000);
            }
          }, 2000);
        }
      } catch (err: any) {
        console.error("OAuth callback error:", err);
        setError(err.message || "Authentication failed. Please try again.");
        setTimeout(() => navigate("/login"), 5000);
      }
    };

    handleCallback();
  }, [provider, navigate, isAuthenticated]);

  if (error) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center bg-gh-bg text-gh-text-secondary">
        <div className="bg-gh-bg-secondary border border-red-500 rounded-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold mb-2 text-red-400">
            Authentication Failed
          </h1>
          <p className="text-gh-text-secondary mb-4">{error}</p>
          <p className="text-sm text-gh-text-secondary">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center bg-gh-bg text-gh-text-secondary">
      <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-8 max-w-md text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
        <h1 className="text-xl font-bold mb-2">Completing Sign In</h1>
        <p className="text-gh-text-secondary">
          Authenticating with {provider === "google" ? "Google" : provider === "gitlab" ? "GitLab" : "GitHub"}...
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;


