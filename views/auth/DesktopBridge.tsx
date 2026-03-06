import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../lib/firebase";
import TrackCodexLogo from "../../components/branding/TrackCodexLogo";

const DesktopBridge = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState("");

  // Derive status from state instead of calling setState in effect
  const status = errorMsg ? "error" : isAuthenticated ? "handoff" : "checking";

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      localStorage.setItem("redirect_after_login", "/auth/desktop-login");
      navigate("/login", { replace: true });
    } else {
      // User IS logged in. Get Firebase ID token directly and hand off to desktop!
      const performHandoff = async () => {
        try {
          const currentUser = auth.currentUser;
          if (!currentUser) {
            setErrorMsg("No active session found. Please try logging in again.");
            return;
          }

          // Get the Firebase ID token directly from the client
          const idToken = await currentUser.getIdToken(true);

          // Small delay so user sees the "Connecting" UI
          await new Promise((resolve) => setTimeout(resolve, 1200));

          // Redirect to the desktop app via custom protocol with the token
          window.location.href = `trackcodex://auth?token=${idToken}`;
        } catch (err: unknown) {
          console.error("Desktop handoff failed:", err);
          const message = err instanceof Error ? err.message : "Failed to generate authentication token.";
          setErrorMsg(message);
        }
      };

      performHandoff();
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center items-center font-sans tracking-tight">
        <TrackCodexLogo size="lg" collapsed={false} clickable={false} />
        <p className="mt-8 text-[#8b949e]">Checking secure session...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center items-center font-sans tracking-tight">
        <TrackCodexLogo size="lg" collapsed={false} clickable={false} />
        <div className="mt-12 flex flex-col items-center">
          <span className="text-red-500 text-4xl mb-4">⚠</span>
          <h2 className="text-[20px] font-medium text-[#e6edf3] mb-2">Handoff Failed</h2>
          <p className="text-[14px] text-[#8b949e] max-w-sm text-center mb-6">{errorMsg}</p>
          <button
            onClick={() => navigate("/dashboard/home")}
            className="text-[#2f81f7] hover:underline text-[13px]"
          >
            Go to dashboard instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center items-center font-sans tracking-tight">
      <div className="relative flex flex-col items-center">
        {/* Glowing logo effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#2f81f7] opacity-20 blur-3xl rounded-full mix-blend-screen animate-pulse duration-[3000ms]"></div>

        <TrackCodexLogo size="lg" collapsed={false} clickable={false} />

        <div className="mt-12 flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-[#2f81f7] border-t-transparent rounded-full animate-spin mb-4"></div>
          <h2 className="text-[20px] font-medium text-[#e6edf3] mb-2">Connecting to Desktop App</h2>
          <p className="text-[14px] text-[#8b949e] max-w-sm text-center">
            Please accept the browser prompt to open TrackCodex.
          </p>
          <div className="mt-8">
            <button
              onClick={() => navigate("/dashboard/home")}
              className="text-[#2f81f7] hover:underline text-[13px]"
            >
              Cancel and go to dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopBridge;
