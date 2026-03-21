import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Circle, Loader2, Sparkles, StopCircle, ChevronDown, ChevronUp, Search, FileText, Terminal, Save } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { AgentSession } from "../../services/ai/hand";
import { API_URL } from "../../services/infra/api";

interface ToolCall {
  name: string;
  args: any;
  result?: string;
}

interface Step {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: string;
  toolCalls?: ToolCall[];
}

interface HandAgentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  model: string;
  provider: string;
  initialSession?: AgentSession | null;
}

const HandAgentPanel: React.FC<HandAgentPanelProps> = ({ isOpen, onClose, prompt, model, provider, initialSession }) => {
  const [steps, setSteps] = useState<Step[]>(() => {
    if (initialSession) {
      return initialSession.steps.map(s => ({
        ...s,
        status: s.status.toLowerCase() as any,
        toolCalls: s.toolCalls as any
      }));
    }
    return [];
  });
  const [finalResult, setFinalResult] = useState<string>(initialSession?.result || "");
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);


  const stopExecution = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsExecuting(false);
  }, []);

  const startAgentExecution = useCallback(() => {
    stopExecution();
    setSteps([]);
    setFinalResult("");
    setIsExecuting(true);
    setError(null);

    const url = new URL(`${API_URL}/api/v1/forgeai/agent/stream`);
    url.searchParams.append("prompt", prompt);
    url.searchParams.append("model", model);
    url.searchParams.append("provider", provider);

    const es = new EventSource(url.toString(), { withCredentials: true });
    eventSourceRef.current = es;

    es.addEventListener("plan", (event: any) => {
      const data = JSON.parse(event.data);
      setSteps(data.map((s: any) => ({ ...s, status: "pending" })));
    });

    es.addEventListener("step_start", (event: any) => {
      const { stepId } = JSON.parse(event.data);
      setSteps(prev => prev.map(s => s.id === stepId ? { ...s, status: "running" } : s));
      setExpandedStep(stepId);
    });

    es.addEventListener("step_complete", (event: any) => {
      const { stepId } = JSON.parse(event.data);
      setSteps(prev => prev.map(s => s.id === stepId ? { ...s, status: "completed" } : s));
    });

    es.addEventListener("tool_call", (event: any) => {
      const { stepId, data } = JSON.parse(event.data);
      setSteps(prev => prev.map(s => {
        if (s.id === stepId) {
          const toolCalls = s.toolCalls || [];
          return { ...s, toolCalls: [...toolCalls, { ...data }] };
        }
        return s;
      }));
    });

    es.addEventListener("tool_result", (event: any) => {
      const { stepId, data } = JSON.parse(event.data);
      setSteps(prev => prev.map(s => {
        if (s.id === stepId && s.toolCalls) {
          return {
            ...s,
            toolCalls: s.toolCalls.map(tc => tc.name === data.name ? { ...tc, result: data.result } : tc)
          };
        }
        return s;
      }));
    });

    es.addEventListener("done", (event: any) => {
      const data = JSON.parse(event.data);
      setFinalResult(data);
      setIsExecuting(false);
      es.close();
    });

    es.addEventListener("error", (event: any) => {
      const data = JSON.parse(event.data);
      setError(data.message || "An error occurred during execution.");
      setIsExecuting(false);
      es.close();
    });

    es.onerror = () => {
      if (!finalResult) {
        setError("Connection lost. Failed to complete execution.");
      }
      setIsExecuting(false);
      es.close();
    };
  }, [prompt, model, provider, finalResult, stopExecution]);

  useEffect(() => {
    if (isOpen && !initialSession && prompt) {
      startAgentExecution();
    }
    return () => {
      stopExecution();
    };
  }, [isOpen, prompt, initialSession, startAgentExecution, stopExecution]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-[#1A1B1E] border border-gh-border rounded-[32px] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative selection:bg-orange-500/30">
        
        {/* Header */}
        <div className="p-6 border-b border-gh-border flex items-center justify-between bg-[#1A1B1E]/50 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Sparkles className="size-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Hand Agent</h2>
              <p className="text-xs text-gh-text-secondary font-medium uppercase tracking-wider">
                Model: <span className="text-orange-400">{model}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExecuting && (
              <button 
                onClick={stopExecution}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-bold transition-all border border-red-500/20"
              >
                <StopCircle size={16} />
                Stop Execution
              </button>
            )}
            <button 
              onClick={onClose}
              title="Close Panel"
              className="size-10 rounded-full hover:bg-white/5 flex items-center justify-center text-gh-text-secondary hover:text-white transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth lg:px-12">
          
          {/* User Prompt Summary */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-inner">
            <p className="text-sm text-gh-text-secondary mb-2 font-bold uppercase tracking-widest opacity-50">Task</p>
            <p className="text-lg text-white font-medium leading-relaxed italic">"{prompt}"</p>
          </div>

          {/* Steps Progress */}
          {steps.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gh-text-secondary uppercase tracking-[0.2em] mb-4">Execution Plan</h3>
              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div 
                    key={step.id} 
                    className={`rounded-2xl border transition-all duration-300 ${
                      step.status === 'running' 
                        ? 'bg-orange-500/5 border-orange-500/30 ring-1 ring-orange-500/20 shadow-lg shadow-orange-500/10' 
                        : step.status === 'completed'
                        ? 'bg-emerald-500/5 border-gh-border opacity-90'
                        : 'bg-transparent border-gh-border opacity-50'
                    }`}
                  >
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center size-6">
                          {step.status === 'completed' ? (
                            <CheckCircle2 className="text-emerald-500 animate-in zoom-in-50 duration-300" size={20} />
                          ) : step.status === 'running' ? (
                            <Loader2 className="text-orange-500 animate-spin" size={20} />
                          ) : (
                            <Circle className="text-gh-text-secondary opacity-30" size={20} />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${step.status === 'running' ? 'text-orange-400' : 'text-white'}`}>
                            {idx + 1}. {step.title}
                          </span>
                        </div>
                      </div>
                      {step.result && (
                        <div className="text-gh-text-secondary group-hover:text-white transition-colors">
                          {expandedStep === step.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      )}
                    </div>
                    
                    <AnimatePresence>
                      {expandedStep === step.id && (step.description || step.result) && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 pt-0 border-t border-gh-border/50 mt-1 mx-4 mb-4">
                            <p className="text-sm text-gh-text-secondary mb-4 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5 italic">
                              {step.description}
                            </p>
                            {step.result && (
                              <div className="prose prose-invert prose-sm max-w-none bg-black/10 rounded-xl p-4 border border-white/5 font-mono text-[13px] leading-relaxed">
                                <ReactMarkdown>{step.result}</ReactMarkdown>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Tool Calls within Step */}
                    <AnimatePresence>
                      {step.toolCalls && step.toolCalls.length > 0 && (
                        <div className="px-4 pb-4 space-y-2">
                          {step.toolCalls.map((tc, tcIdx) => (
                            <div key={tcIdx} className="bg-black/20 rounded-xl p-3 border border-white/5 flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {tc.name === 'web_search' && <Search size={14} className="text-blue-400" />}
                                  {tc.name === 'file_read' && <FileText size={14} className="text-purple-400" />}
                                  {tc.name === 'file_write' && <Save size={14} className="text-emerald-400" />}
                                  {tc.name === 'shell_exec' && <Terminal size={14} className="text-yellow-400" />}
                                  <span className="text-[11px] font-bold text-gh-text-secondary uppercase tracking-wider">
                                    {tc.name.replace('_', ' ')}
                                  </span>
                                </div>
                                {!tc.result ? (
                                  <Loader2 size={12} className="text-gh-text-secondary animate-spin" />
                                ) : (
                                  <CheckCircle2 size={12} className="text-emerald-500" />
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-white/70 bg-black/40 p-2 rounded border border-white/5 truncate">
                                {JSON.stringify(tc.args)}
                              </div>
                              {tc.result && (
                                <div className="text-[11px] text-gh-text-secondary line-clamp-2 italic pl-2 border-l border-white/10">
                                  {tc.result}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl flex items-center gap-3 animate-in shake-in duration-500">
              <span className="material-symbols-outlined">error</span>
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          {/* Final Result */}
          {finalResult && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 pb-20"
            >
              <div className="flex items-center gap-2 text-white mb-2">
                <Sparkles size={20} className="text-orange-500" />
                <h3 className="text-lg font-bold tracking-tight">Final Synthesis</h3>
              </div>
              <div className="prose prose-invert prose-orange max-w-none bg-orange-500/[0.02] border border-orange-500/20 rounded-[24px] p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={() => navigator.clipboard.writeText(finalResult)}
                    className="p-2 hover:bg-white/10 rounded-lg text-gh-text-secondary hover:text-white transition-all"
                    title="Copy to clipboard"
                   >
                     <span className="material-symbols-outlined text-[20px]">content_copy</span>
                   </button>
                </div>
                <ReactMarkdown>{finalResult}</ReactMarkdown>
              </div>
            </motion.div>
          )}

          {/* Loading Indicator for general state */}
          {isExecuting && !steps.length && (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
              <div className="size-16 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin mb-6" />
              <p className="text-lg font-bold text-white mb-1">Planning Mission...</p>
              <p className="text-gh-text-secondary text-sm">Decomposing your request into actionable steps.</p>
            </div>
          )}
        </div>

        {/* Footer info Bar */}
        <div className="px-6 py-3 bg-[#1A1B1E]/80 border-t border-gh-border text-[11px] text-gh-text-secondary font-bold uppercase tracking-[0.25em] flex items-center justify-between">
          <span>TrackCodex Neural Engine v2.4</span>
          <span>© 2026 ForgeAI Agentic Layer</span>
        </div>
      </div>
    </div>
  );
};

export default HandAgentPanel;
