import React, { useState, useEffect } from "react";
import { apiInstance } from "../services/infra/api";
import { PromptInputBox } from "../components/ui/ai-prompt-box";
import HandAgentPanel from "../components/ai/HandAgentPanel";
import ArtifactSidebar from "../components/ai/ArtifactSidebar";
import { handService, AgentSession } from "../services/ai/hand";
import { History } from "lucide-react";

type Provider = "google" | "deepseek";

interface DeepSeekConfig {
  serverUrl: string;
  apiKey: string;
  model: string;
}

const ForgeAIView = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<{ type: string; content: string }[]>(
    [],
  );
  const [showSettings, setShowSettings] = useState(false);
  const [agentPanel, setAgentPanel] = useState<{ isOpen: boolean; prompt: string; model: string; session?: AgentSession | null } | null>(null);
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Provider settings
  const [provider, setProvider] = useState<Provider>("google");
  const [deepseekConfig, setDeepseekConfig] = useState<DeepSeekConfig>({
    serverUrl: "",
    apiKey: "",
    model: "deepseek-coder",
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedProvider = localStorage.getItem("forgeai_provider") as Provider;
    const savedConfig = localStorage.getItem("forgeai_deepseek_config");

    if (savedProvider) setProvider(savedProvider);
    if (savedConfig) setDeepseekConfig(JSON.parse(savedConfig));
    
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const data = await handService.getSessions();
      setSessions(data);
    } catch (error) {
      console.error("Failed to fetch agent sessions:", error);
    }
  };


  const handleAsk = async (message: string, files?: File[], options?: { model?: string }) => {
    if (!message.trim()) return;

    // Detect Hand mode
    if (message.includes("[Hand:")) {
      const cleanPrompt = message.replace(/^\[Hand:\s*/, "").replace(/\]$/, "").trim();
      setAgentPanel({ 
        isOpen: true, 
        prompt: cleanPrompt, 
        model: options?.model || "gemini-1.5-flash" 
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await apiInstance.post("/forgeai/complete", {
        prompt: message,
        provider,
        model: options?.model || (provider === "google" ? "gemini-1.5-flash" : deepseekConfig.model),
        workspaceId: localStorage.getItem("current_workspace_id"),
      });

      const data = response.data;
      setResults((prev) => [{ type: "AI", content: data.content }, ...prev]);
    } catch (error) {
      console.error(error);
      setResults((prev) => [
        {
          type: "Error",
          content: `Failed to connect to ForgeAI. ${error instanceof Error ? error.message : ""}`,
        },
        ...prev,
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gh-bg text-gh-text font-sans selection:bg-primary/30 relative">
      {/* Top Navigation / Badge */}
      <div className="pt-12 flex justify-center sticky top-0 bg-gh-bg/80 backdrop-blur-md z-10 pb-4">
        <div className="flex items-center gap-4">
          <div className="px-4 py-1.5 bg-gh-bg-secondary border border-gh-border rounded-full text-[13px] text-gh-text-secondary font-medium flex items-center gap-2 cursor-pointer hover:bg-gh-tertiary transition-colors shadow-sm">
            <span>Free plan</span>
            <span className="opacity-40">•</span>
            <span className="text-[#bbb]">Upgrade</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-full border transition-all ${isSidebarOpen ? 'bg-orange-500/10 border-orange-500/50 text-orange-500' : 'bg-gh-bg-secondary border-gh-border text-gh-text-secondary hover:text-white'}`}
            title="Mission History"
          >
            <History size={18} />
          </button>
        </div>
      </div>

      {/* Main Hero Section */}
      <div className="flex-1 flex flex-col items-center pt-20 pb-32 px-6">
        <div className="w-full max-w-3xl flex flex-col items-center gap-10">

          {/* Header with Serif Font */}
          <div className="flex items-center gap-4 select-none">
            <div className="size-10 flex items-center justify-center text-[#d97757]">
              <span className="material-symbols-outlined !text-[44px] filled">
                blur_on
              </span>
            </div>
            <h1 className="text-[44px] font-serif font-medium text-gh-text tracking-tight text-center lg:text-left">
              Golden hour thinking
            </h1>
          </div>

          {/* Chat Results Area (Hidden if empty) */}
          {results.length > 0 && (
            <div className="w-full space-y-4 mb-4">
              {results.slice(0, 3).map((res, i) => (
                <div key={i} className="p-5 rounded-2xl bg-gh-bg-secondary border border-gh-border shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <p className="text-sm leading-relaxed text-gh-text-secondary">
                    {res.content.length > 300 ? res.content.substring(0, 300) + "..." : res.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="w-full">
            <PromptInputBox
              isLoading={isAnalyzing}
              onSend={(msg, files, opts) => handleAsk(msg, files, opts)}
              placeholder="How can I help you today?"
              className="max-w-3xl mx-auto"
            />

            {/* Sub-toolbar tags */}
            <div className="flex flex-wrap justify-center gap-2 mt-8">
              <PillButton icon="code" label="Code" />
              <PillButton icon="edit_note" label="Write" />
              <PillButton icon="school" label="Learn" />
              <PillButton icon="local_cafe" label="Life stuff" />
              <PillButton icon="lightbulb" label="TrackCodex's Hand" />
            </div>
          </div>

        </div>
      </div>

      {/* Settings Modal (Minimal) */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowSettings(false)}>
          <div className="bg-[#222] border border-[#333] rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6">Model Settings</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#2a2a2a] border border-[#444] flex items-center justify-between cursor-pointer hover:bg-[#333] transition-all">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary filled">google</span>
                  <div>
                    <p className="font-bold text-sm">Google GenAI</p>
                    <p className="text-xs text-[#888]">Gemini 1.5 Flash</p>
                  </div>
                </div>
                <input
                  type="radio"
                  checked={provider === 'google'}
                  onChange={() => setProvider('google')}
                  className="accent-primary size-4"
                  aria-label="Google GenAI"
                />
              </div>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full mt-8 py-3 bg-[#d97757] text-white font-bold rounded-2xl hover:bg-[#e0886a] transition-all"
            >
              Close Settings
            </button>
          </div>
        </div>
      )}

      {/* Hand Agent Panel */}
      {agentPanel && (
        <HandAgentPanel
          isOpen={agentPanel.isOpen}
          prompt={agentPanel.prompt}
          model={agentPanel.model}
          provider={provider}
          initialSession={agentPanel.session}
          onClose={() => {
            setAgentPanel(null);
            fetchSessions();
          }}
        />
      )}

      {/* Artifact Sidebar */}
      <ArtifactSidebar 
        isOpen={isSidebarOpen}
        sessions={sessions}
        onClose={() => setIsSidebarOpen(false)}
        onSelectSession={(session) => {
          setAgentPanel({
            isOpen: true,
            prompt: session.prompt,
            model: session.model,
            session: session
          });
        }}
      />
    </div>
  );
};

const PillButton = ({ icon, label }: { icon: string; label: string }) => (
  <button className="flex items-center gap-2 px-4 py-2.5 bg-transparent border border-[#333] hover:border-[#444] hover:bg-white/5 rounded-full transition-all group">
    <span className="material-symbols-outlined !text-[18px] text-[#777] group-hover:text-[#999] transition-colors">{icon}</span>
    <span className="text-[14px] text-[#999] group-hover:text-[#bbb] transition-colors">{label}</span>
  </button>
);

export default ForgeAIView;

