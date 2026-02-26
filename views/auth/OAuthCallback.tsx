import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

const OAuthCallback: React.FC = () => {
  const { provider } = useParams<{ provider: "google" | "github" }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const hasRun = React.useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const handleCallback = async () => {
      try {
        // Root fix extraction: Check search params (modern/clean), and fallback to hash (legacy/desktop)
        const queryParams = new URLSearchParams(window.location.search);
        let code = queryParams.get("code");

        // Fallback 1: Check if it's in the hash (HashRouter legacy)
        if (!code && window.location.hash.includes("code=")) {
          const hashQuery = window.location.hash.split("?")[1] || window.location.hash.split("#")[1];
          const hashParams = new URLSearchParams(hashQuery);
          code = hashParams.get("code");
        }

        // Fallback 2: Manual regex check on full URL as extreme fallback
        if (!code) {
          const codeMatch = window.location.href.match(/[?&]code=([^&#]+)/);
          code = codeMatch ? codeMatch[1] : null;
        }

        if (!code) {
          throw new Error("No authorization code received from the auth provider.");
        }

        // Exchange code for session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;

        if (!data.session || !data.user) {
          throw new Error("Session exchange completed but no valid session was returned.");
        }

        // --- ROOT FIX: Immediate State Sync ---
        // Instead of waiting for the AuthContext listener to fire, we manually
        // push the user data into the context. This prevents the "RedirectToLogin"
        // from firing during the transition.
        const mappedUser = {
          id: data.session.user.id,
          email: data.session.user.email || "",
          username: data.session.user.user_metadata?.username || "",
          name: data.session.user.user_metadata?.full_name || "",
          avatar: data.session.user.user_metadata?.avatar_url || "",
          role: data.session.user.user_metadata?.role || "user",
        };

        // This triggers the immediate re-render of App.tsx, which will
        // unmount OAuthCallback and mount ProtectedApp.
        // We call login with user data and access token.
        login(mappedUser, data.session.access_token, data.session.access_token);

        // Redirect to dashboard or saved path
        const redirectPath = localStorage.getItem("redirect_after_login") || "/dashboard/home";
        localStorage.removeItem("redirect_after_login");

        // Navigation still happens but now we are GUARANTEED to be authenticated in the context
        navigate(redirectPath, { replace: true });

      } catch (err: any) {
        console.error("OAuth callback error:", err);
        setError(err.message || "Authentication failed. Please try again.");
        setTimeout(() => navigate("/login"), 5000);
      }
    };

    handleCallback();
  }, [provider, navigate, login]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gh-bg text-gh-text-secondary">
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gh-bg text-gh-text-secondary">
      <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-8 max-w-md text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
        <h1 className="text-xl font-bold mb-2">Completing Sign In</h1>
        <p className="text-gh-text-secondary">
          Authenticating with {provider === "google" ? "Google" : "GitHub"}...
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;
