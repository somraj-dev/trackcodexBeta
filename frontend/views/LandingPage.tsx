import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./LandingPage.css";

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  if (user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="landing-container flex-1 w-full flex flex-col bg-[#f5f5f7] relative font-sans">

      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-[#f5f5f7] pointer-events-none" />

      {/* Main Content Wrapper - Split Layout */}
      <main className="relative z-10 w-full max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center justify-between px-6 py-12 lg:p-20 gap-16">

        {/* LEFT COLUMN: Copy & Testimonial */}
        <div className="flex-1 flex flex-col items-start justify-center max-w-xl">
          <span className="text-[#888888] font-medium text-sm mb-4 uppercase tracking-wider">
            End to End Encryption
          </span>

          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] mb-6 tracking-tight">
            Accelerate your Development with TrackCodex
          </h1>

          <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-[90%]">
            Build. Collaborate. Ship with confidence. TrackCodex turns your ideas into production ready code.
          </p>

        </div>

        {/* RIGHT COLUMN: Interactive Code Editor Mockup */}
        <div className="flex-1 flex w-full justify-center lg:justify-end items-center">
          <div className="w-full max-w-[600px] rounded-2xl bg-[#11141A] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-[#222] overflow-hidden flex flex-col h-[580px]">

            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#222]">
              {/* Mac OS Window Controls */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>
              <div className="text-[#666] text-xs font-medium tracking-wide">
                main.tf
              </div>
              <div 
                onClick={() => navigate("/team")}
                className="text-[#666] text-xs font-mono hover:text-white cursor-pointer transition-colors"
              >
                more
              </div>
            </div>

            {/* Editor Body */}
            <div className="flex-1 p-6 font-mono text-[14px] leading-7 overflow-y-auto no-scrollbar">
              <pre className="text-[#ededed]">
                <span className="text-[#ff7b72]">provider</span> <span className="text-[#a5d6ff]">"TrackCodex"</span> <span className="text-[#a1a1aa]">{'{'}</span>
                <br />
                <span className="text-[#79c0ff]">  api_token</span> <span className="text-[#ff7b72]">=</span> var.welcome_user
                <br />
                <span className="text-[#79c0ff]">  network</span>   <span className="text-[#ff7b72]">=</span> var.quanta_network
                <br />
                <span className="text-[#a1a1aa]">{'}'}</span>
                <br />
                <br />
                <span className="text-[#ff7b72]">resource</span> <span className="text-[#a5d6ff]">"quanta_virtual_network" "core_vnet"</span> <span className="text-[#a1a1aa]">{'{ }'}</span>
                <br />
                <br />
                <span className="text-[#ff7b72]">resource</span> <span className="text-[#a5d6ff]">"shieldnet_user_group" "engineers"</span> <span className="text-[#a1a1aa]">{'{'}</span>
                <br />
                <span className="text-[#79c0ff]">  name</span> <span className="text-[#ff7b72]">=</span> <span className="text-[#a5d6ff]">"Engineering Team"</span>
                <br />
                <span className="text-[#a1a1aa]">{'}'}</span>
                <br />
                <br />
                <span className="text-[#ff7b72]">resource</span> <span className="text-[#a5d6ff]">"shieldnet_service_resource" "main_db"</span> <span className="text-[#a1a1aa]">{'{'}</span>
                <br />
                <span className="text-[#79c0ff]">  name</span> <span className="text-[#ff7b72]">=</span> <span className="text-[#a5d6ff]">"MainDB Server"</span>
                <br />
                <span className="text-[#79c0ff]">  address</span> <span className="text-[#ff7b72]">=</span> <span className="text-[#a5d6ff]">"db.internal"</span>
                <br />
                <span className="text-[#a1a1aa]">{'}'}</span>
              </pre>
            </div>

            {/* Editor Footer Actions */}
            <div className="border-t border-[#222] p-4 flex items-center justify-between">
              <button
                onClick={() => {
                  const isElectron = window.navigator.userAgent.toLowerCase().includes('electron') || window.location.protocol === 'file:';
                  if (isElectron) {
                    // Force open in system browser to allow the handshake bridge to work
                    window.open("https://trackcodex.com/auth/desktop-login", "_blank");
                  } else {
                    navigate("/login");
                  }
                }}

                className="px-6 py-2 rounded-full bg-[#1b2b22] text-[#4ade80] text-sm font-medium hover:bg-[#253b2e] border border-[#2d4d38] transition-colors"
              >
                Login
              </button>

              <button
                onClick={() => navigate("/signup")}
                className="px-6 py-2 rounded-full bg-white text-black text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                Deploy with TrackCodex
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;


