import React from "react";
import { motion } from "framer-motion";
import { History, FileText, CheckCircle2, Clock, ChevronRight, Sparkles } from "lucide-react";
import { AgentSession } from "../../services/ai/hand";

interface ArtifactSidebarProps {
  sessions: AgentSession[];
  onSelectSession: (session: AgentSession) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ArtifactSidebar: React.FC<ArtifactSidebarProps> = ({ sessions, onSelectSession, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ x: 320 }}
      animate={{ x: 0 }}
      exit={{ x: 320 }}
      className="fixed right-0 top-[64px] bottom-0 w-80 bg-[#1A1B1E] border-l border-gh-border z-40 flex flex-col shadow-2xl"
    >
      <div className="p-4 border-b border-gh-border flex items-center justify-between bg-[#1A1B1E]/50">
        <div className="flex items-center gap-2">
          <History size={18} className="text-orange-500" />
          <h3 className="font-bold text-sm uppercase tracking-wider text-white">Mission History</h3>
        </div>
        <div className="bg-orange-500/10 text-orange-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
          Agent
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30 px-6">
            <Clock size={40} className="mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest">No Missions Yet</p>
            <p className="text-[10px] mt-2 italic leading-relaxed">Your agentic tasks will appear here for later review.</p>
          </div>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session)}
              className="w-full text-left p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group relative overflow-hidden"
            >
              <div className="flex items-start gap-3 relative z-10">
                <div className={`mt-1 size-2 rounded-full shrink-0 ${session.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate group-hover:text-orange-400 transition-colors">
                    {session.prompt}
                  </p>
                  <div className="flex items-center gap-2 mt-1 opacity-50">
                    <span className="text-[10px] uppercase font-bold tracking-tighter">{session.model}</span>
                    <span className="text-[10px]">•</span>
                    <span className="text-[10px]">{new Date(session.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <ChevronRight size={14} className="mt-1 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
              </div>
            </button>
          ))
        )}
      </div>

      <div className="p-4 border-t border-gh-border bg-black/20 text-center">
        <p className="text-[10px] text-gh-text-secondary font-bold uppercase tracking-[0.2em]">
          Artifact Storage v1.0
        </p>
      </div>
    </motion.div>
  );
};

export default ArtifactSidebar;
