import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_BASE } from "../../services/infra/api";
import TrackCodexLogo from "../../components/branding/TrackCodexLogo";

const DesktopBridge = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState("");

  // Derive status from state
  const status = errorMsg ? "error" : isAuthenticated ? "handoff" : "checking";

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // User is not logged in. Save intention to redirect back here after login.
      localStorage.setItem("redirect_after_login", "/auth/desktop-login");
      navigate("/login", { replace: true });
    } else {
      // User IS logged in. Handoff to backend to generate secure custom token and deep link!
      // Wait a tiny bit so the user can see the "Connecting" UI
      const timer = setTimeout(() => {
        try {
          window.location.href = `${API_BASE}/auth/desktop-redirect`;
        } catch (err: unknown) {
          console.error("Desktop handoff failed:", err);
          setErrorMsg("Failed to initiate secure handoff. Please try again.");
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex-1 w-full bg-[#0d1117] flex flex-col justify-center items-center font-sans tracking-tight">
        <TrackCodexLogo size="lg" collapsed={false} clickable={false} />
        <p className="mt-8 text-[#8b949e]">Checking secure session...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex-1 w-full bg-[#0d1117] flex flex-col justify-center items-center font-sans tracking-tight">
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
    <div className="flex-1 w-full bg-[#0d1117] flex flex-col justify-center items-center font-sans tracking-tight">
      <div className="relative flex flex-col items-center">
        {/* Glowing logo effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#2f81f7] opacity-20 blur-3xl rounded-full mix-blend-screen animate-pulse duration-[3000ms]"></div>

        <TrackCodexLogo size="lg" collapsed={false} clickable={false} />

        <div className="mt-12 flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-[#2f81f7] border-t-transparent rounded-full animate-spin mb-4"></div>
          <h2 className="text-[20px] font-medium text-[#e6edf3] mb-2">Connecting to Desktop App</h2>
          <p className="text-[14px] text-[#8b949e] max-w-sm text-center">
            {isAuthenticated ? "Please accept the browser prompt to open TrackCodex." : "Preparing secure handoff..."}
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


