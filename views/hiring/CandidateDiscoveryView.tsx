import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Candidate } from "../../types";
import { api } from "../../context/AuthContext";

const CandidateDiscoveryView = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await api.get('/hiring/candidates/discovery');
        if (response.data.success) {
          setCandidates(response.data.candidates);
        } else {
          setError(response.data.message || 'Failed to fetch candidates');
        }
      } catch (err) {
        console.error("Error fetching candidates:", err);
        setError("Network error or server unavailable.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  const filteredCandidates = candidates.filter(c => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.role.toLowerCase().includes(term);
  });

  return (
    <div className="p-8 text-gh-text max-w-[1200px] mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Candidate Discovery</h1>
          <p className="text-gh-text-secondary font-medium">
            AI-curated talent pool based on your repository requirements.
          </p>
        </div>
        <div className="relative group w-full max-w-sm">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg group-focus-within:text-primary">
            search
          </span>
          <input
            className="w-full bg-gh-bg-secondary border border-gh-border rounded-full pl-12 pr-6 py-2.5 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all duration-300"
            placeholder="Search candidates by name or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-gh-text-secondary">
          <span className="material-symbols-outlined animate-spin text-4xl mb-4 text-primary">autorenew</span>
          <p>Analyzing talent pool capabilities...</p>
        </div>
      ) : error ? (
        <div className="py-16 text-center text-red-400 border border-red-900/50 bg-red-950/20 rounded-2xl">
          <span className="material-symbols-outlined text-4xl mb-4">error</span>
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredCandidates.map(candidate => (
            <div key={candidate.id} className="bg-gh-bg-secondary border border-gh-border rounded-2xl p-6 hover:border-primary/50 transition-colors flex gap-6">
              <img src={candidate.avatar} alt={candidate.name} className="size-20 rounded-2xl object-cover border border-gh-border" />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-white">{candidate.name}</h3>
                    <p className="text-sm text-primary font-mono">{candidate.role}</p>
                  </div>
                  {candidate.status === "Top Match" && (
                    <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase rounded-lg border border-amber-500/20">
                      Top Match
                    </span>
                  )}
                </div>
                <div className="flex gap-4 mb-4 text-sm text-gh-text-secondary">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined !text-base">psychology</span>
                    Complexity: {candidate.aiComplexityScore}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined !text-base">fact_check</span>
                    PR Quality: {candidate.prQuality}
                  </div>
                </div>
                <div className="flex gap-2 mb-6">
                  {candidate.techStackMatch?.map(t => (
                    <span key={t.skill} className="px-2 py-1 bg-gh-bg border border-gh-border text-xs rounded-md text-slate-300">
                      {t.skill} ({t.alignment}%)
                    </span>
                  ))}
                </div>
                <div className="flex gap-3 mt-auto pt-4 border-t border-gh-border border-dashed">
                  <button
                    onClick={() => navigate(`/messages?user=${candidate.id}`)}
                    className="flex-1 py-2 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined !text-sm">chat</span>
                    Message Candidate
                  </button>
                  <button
                    onClick={() => navigate(`/profile/${candidate.id}`)}
                    className="flex-1 py-2 bg-gh-bg-secondary hover:bg-gh-border text-gh-text border border-gh-border hover:border-slate-500 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined !text-sm">person</span>
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredCandidates.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-500 border border-dashed border-gh-border rounded-2xl bg-gh-bg-secondary">
              <span className="material-symbols-outlined text-4xl mb-4 opacity-50">search_off</span>
              <h3 className="text-lg font-bold text-gh-text mb-2">No candidates found.</h3>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CandidateDiscoveryView;
