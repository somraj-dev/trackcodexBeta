import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

const OAuthCallback: React.FC = () => {
  const { provider } = useParams<{ provider: "google" | "github" }>();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const hasRun = React.useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const handleCallback = async () => {
      try {
        // --- FIX: Check for existing session FIRST ---
        // Supabase's `detectSessionInUrl: true` auto-exchanges the OAuth code
        // before this component runs. If we try to exchange the same code again,
        // it fails because the code was already consumed. So we first check
        // if a session already exists from the auto-detection.

        let session = null;
        let user = null;

        // Attempt 1: Check if Supabase already auto-exchanged the code
        const { data: existingSession } = await supabase.auth.getSession();
        if (existingSession?.session) {
          console.log("[OAuthCallback] Session already exists from auto-detection");
          session = existingSession.session;
          user = session.user;
        }

        // Attempt 2: If no session yet, wait briefly for auto-exchange to complete
        if (!session) {
          console.log("[OAuthCallback] No session yet, waiting for auto-exchange...");
          for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const { data: retrySession } = await supabase.auth.getSession();
            if (retrySession?.session) {
              console.log(`[OAuthCallback] Session found after ${(i + 1) * 500}ms`);
              session = retrySession.session;
              user = session.user;
              break;
            }
          }
        }

        // Attempt 3: Manual code exchange as last resort (code might not have been auto-consumed)
        if (!session) {
          console.log("[OAuthCallback] Attempting manual code exchange...");
          const queryParams = new URLSearchParams(window.location.search);
          let code = queryParams.get("code");

          // Fallback: Check hash (HashRouter legacy)
          if (!code && window.location.hash.includes("code=")) {
            const hashQuery = window.location.hash.split("?")[1] || window.location.hash.split("#")[1];
            const hashParams = new URLSearchParams(hashQuery);
            code = hashParams.get("code");
          }

          // Fallback: Manual regex
          if (!code) {
            const codeMatch = window.location.href.match(/[?&]code=([^&#]+)/);
            code = codeMatch ? codeMatch[1] : null;
          }

          if (!code) {
            throw new Error("No authorization code received from the auth provider.");
          }

          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;

          session = data.session;
          user = data.user;
        }

        if (!session || !user) {
          throw new Error("Session exchange completed but no valid session was returned.");
        }

        // Sync user state into AuthContext immediately
        const mappedUser = {
          id: user.id,
          email: user.email || "",
          username: user.user_metadata?.username || "",
          name: user.user_metadata?.full_name || "",
          avatar: user.user_metadata?.avatar_url || "",
          role: user.user_metadata?.role || "user",
        };

        login(mappedUser, session.access_token, session.access_token);

        // Redirect to dashboard or saved path
        const redirectPath = localStorage.getItem("redirect_after_login") || "/dashboard/home";
        localStorage.removeItem("redirect_after_login");
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
