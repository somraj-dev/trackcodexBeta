import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/infra/api";
import { Info, AlertTriangle, Book, Lock, ChevronDown, Building2, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "../../styles/CreateWorkspaceNew.css";

// Mock owners for demonstration of the 3 states
const MOCK_OWNERS = [
  { id: "personal", name: "somraj-dev", type: "user", slug: "somraj-dev" },
  { id: "org", name: "Quantaforze-trackcodex", type: "org", slug: "trackcodex" }
];

const ImportRepoView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceUsername, setSourceUsername] = useState("");
  const [sourceToken, setSourceToken] = useState("");
  
  const [targetRepoName, setTargetRepoName] = useState("");
  const [selectedOwner, setSelectedOwner] = useState<typeof MOCK_OWNERS[0] | null>(null);
  const [visibility, setVisibility] = useState<"public" | "private" | "internal">("public");
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set initial owner to personal if user exists
  useEffect(() => {
    if (user?.username) {
      const personal = MOCK_OWNERS.find(o => o.name === user.username) || MOCK_OWNERS[0];
      setSelectedOwner(personal);
    }
  }, [user]);

  // Reset visibility to public if internal is selected but owner changes to non-org
  useEffect(() => {
    if (visibility === "internal" && selectedOwner?.type !== "org") {
      setVisibility("public");
    }
  }, [selectedOwner, visibility]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl || !targetRepoName || !selectedOwner) return;

    setIsSubmitting(true);
    try {
      const result = await api.repositories.importRepo({
        sourceUrl,
        name: targetRepoName,
        visibility: visibility.toUpperCase(),
        ownerId: user?.id,
        credentials: {
          username: sourceUsername,
          token: sourceToken
        }
      });

      window.dispatchEvent(
        new CustomEvent("trackcodex-notification", {
          detail: {
            title: "Import Started",
            message: `Importing project ${targetRepoName} to your repositories...`,
            type: "success",
          },
        })
      );
      
      if (result && result.id) {
        navigate(`/repo/${result.id}`);
      } else {
        navigate("/repositories");
      }
    } catch (err) {
      console.error("Failed to import repository:", err);
      window.dispatchEvent(
        new CustomEvent("trackcodex-notification", {
          detail: {
            title: "Import Failed",
            message: "Failed to import project. Please check the URL and credentials.",
            type: "error",
          },
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInfoMessage = () => {
    if (!selectedOwner) return "Please choose an owner to see the available visibility options.";
    
    if (selectedOwner.type === "org") {
      if (visibility === "internal") {
        return `You are creating an internal repository in the ${selectedOwner.name} organization (${selectedOwner.slug}).`;
      }
      return `You are creating a ${visibility} repository in the ${selectedOwner.name} organization (${selectedOwner.slug}).`;
    }
    
    return `You are creating a ${visibility} repository in your personal account.`;
  };

  return (
    <div className="create-repo-container" style={{ maxWidth: "768px" }}>
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-[24px] font-semibold text-gh-text mb-1">Import your project to TrackCodex</h1>
        <p className="text-[14px] text-gh-text-secondary">
          Import all the files, including revision history, from another version control system.
        </p>
        <div className="h-px bg-gh-border w-full mt-4" />
        <p className="text-[12px] text-gh-text-secondary mt-2">
          Required fields are marked with an asterisk (*).
        </p>
      </div>

      {/* Legacy Support Warning Banner */}
      <div className="bg-[#3b2300]/30 border border-[#845512] rounded-md p-4 mb-8 flex gap-3">
        <AlertTriangle size={18} className="text-[#e3b341] shrink-0 mt-0.5" />
        <p className="text-[13px] text-gh-text leading-snug">
          Support for importing Mercurial, Subversion and Team Foundation Version Control (TFVC) repositories ended on April 12, 2024. For more details, see the <a href="#" className="text-primary hover:underline">changelog</a>.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Source Repository Details */}
        <section className="mb-10">
          <h2 className="text-[18px] font-semibold text-gh-text mb-4">Your source repository details</h2>
          
          <div className="mb-4">
            <label className="text-[14px] font-semibold text-gh-text block mb-2" htmlFor="source-url">
              The URL for your source repository *
            </label>
            <input 
              id="source-url" 
              type="text" 
              className="w-full bg-[#0d1117] border border-gh-border rounded-md px-3 py-1.5 text-gh-text text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner" 
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://git.example.org/code/git"
              required
            />
            <a href="#" className="text-[12px] text-primary hover:underline inline-flex items-center gap-1 mt-2">
              Learn more about importing git repositories.
            </a>
          </div>

          <div className="h-px bg-gh-border w-full my-6" />

          <p className="text-[13px] italic text-gh-text-secondary mb-4">
            Please enter your credentials if required for cloning your remote repository.
          </p>

          <div className="mb-4">
            <label className="text-[14px] font-semibold text-gh-text block mb-2" htmlFor="source-username">
              Your username for your source repository
            </label>
            <input 
              id="source-username" 
              type="text" 
              className="w-full bg-[#0d1117] border border-gh-border rounded-md px-3 py-1.5 text-gh-text text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
              value={sourceUsername}
              onChange={(e) => setSourceUsername(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="text-[14px] font-semibold text-gh-text block mb-2" htmlFor="source-token">
              Your access token or password for your source repository
            </label>
            <input 
              id="source-token" 
              type="password" 
              className="w-full bg-[#0d1117] border border-gh-border rounded-md px-3 py-1.5 text-gh-text text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
              value={sourceToken}
              onChange={(e) => setSourceToken(e.target.value)}
            />
          </div>
        </section>

        {/* New Repository Details */}
        <section className="mb-8 pt-8 border-t border-gh-border">
          <h2 className="text-[18px] font-semibold text-gh-text mb-4">Your new repository details</h2>

          <div className="flex items-end gap-2 mb-6">
            <div className="shrink-0 relative">
              <label className="text-[14px] font-semibold text-gh-text block mb-2">Owner *</label>
              <button
                type="button"
                onClick={() => setShowOwnerDropdown(!showOwnerDropdown)}
                className="flex items-center gap-2 bg-[#161b22] border border-gh-border rounded-md px-3 py-1.5 text-gh-text text-[14px] outline-none focus:border-primary border-gh-border shadow-sm min-w-[160px] hover:border-gh-text-secondary transition-colors"
              >
                {selectedOwner ? (
                  <>
                    <div className="w-5 h-5 rounded-full bg-gh-border flex items-center justify-center overflow-hidden">
                      {selectedOwner.type === "org" ? <Building2 size={12} className="text-gh-text-secondary" /> : <UserIcon size={12} className="text-gh-text-secondary" />}
                    </div>
                    <span>{selectedOwner.name}</span>
                  </>
                ) : (
                  <span>Choose an owner</span>
                )}
                <ChevronDown size={14} className="ml-auto text-gh-text-secondary" />
              </button>

              <AnimatePresence>
                {showOwnerDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 4 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 mt-1 w-full bg-[#161b22] border border-gh-border rounded-md shadow-xl overflow-hidden"
                  >
                    {MOCK_OWNERS.map(owner => (
                      <div 
                        key={owner.id}
                        onClick={() => {
                          setSelectedOwner(owner);
                          setShowOwnerDropdown(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-[#1f6feb] cursor-pointer text-[14px] transition-colors"
                      >
                         <div className="w-5 h-5 rounded-md bg-gh-border/50 flex items-center justify-center">
                           {owner.type === "org" ? <Building2 size={12} /> : <UserIcon size={12} />}
                         </div>
                         {owner.name}
                      </div>
                    ))}
                    <div 
                      onClick={() => {
                        setSelectedOwner(null);
                        setShowOwnerDropdown(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-[#cf222e] cursor-pointer text-[14px] transition-colors border-t border-gh-border"
                    >
                      Clear selection
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <span className="text-[20px] text-gh-text-secondary pb-1">/</span>

            <div className="flex-1">
              <label className="text-[14px] font-semibold text-gh-text block mb-2" htmlFor="repo-name">Repository name *</label>
              <input 
                id="repo-name" 
                type="text" 
                className="w-full bg-[#0d1117] border border-gh-border rounded-md px-3 py-1.5 text-gh-text text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner" 
                value={targetRepoName}
                onChange={(e) => setTargetRepoName(e.target.value)}
                placeholder="Repository name"
                required
              />
            </div>
          </div>

          {/* Visibility Selection with Animations */}
          <AnimatePresence mode="wait">
            {selectedOwner && (
              <motion.div 
                key="visibility-options"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 mb-6 pt-4 border-t border-gh-border overflow-hidden"
              >
                {/* Public */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="pt-1">
                    <input 
                      type="radio" 
                      name="visibility" 
                      value="public" 
                      checked={visibility === "public"} 
                      onChange={() => setVisibility("public")}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${visibility === "public" ? "border-primary bg-primary" : "border-gh-border group-hover:border-gh-text-secondary"}`}>
                       {visibility === "public" && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Book size={18} className="text-gh-text-secondary mt-0.5" />
                    <div>
                      <div className="text-[14px] font-semibold text-gh-text">Public</div>
                      <div className="text-[12px] text-gh-text-secondary leading-tight">
                        Anyone on the internet can see this repository. You choose who can commit.
                      </div>
                    </div>
                  </div>
                </label>

                {/* Internal (Organization Only) */}
                {selectedOwner.type === "org" && (
                  <motion.label 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 cursor-pointer group"
                  >
                    <div className="pt-1">
                      <input 
                        type="radio" 
                        name="visibility" 
                        value="internal" 
                        checked={visibility === "internal"} 
                        onChange={() => setVisibility("internal")}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${visibility === "internal" ? "border-primary bg-primary" : "border-gh-border group-hover:border-gh-text-secondary"}`}>
                         {visibility === "internal" && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Building2 size={18} className="text-gh-text-secondary mt-0.5" />
                      <div>
                        <div className="text-[14px] font-semibold text-gh-text">Internal</div>
                        <div className="text-[12px] text-gh-text-secondary leading-tight">
                          {selectedOwner.slug} enterprise members can see this repository. You can choose who can commit.
                        </div>
                      </div>
                    </div>
                  </motion.label>
                )}

                {/* Private */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="pt-1">
                    <input 
                      type="radio" 
                      name="visibility" 
                      value="private" 
                      checked={visibility === "private"} 
                      onChange={() => setVisibility("private")}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${visibility === "private" ? "border-primary bg-primary" : "border-gh-border group-hover:border-gh-text-secondary"}`}>
                       {visibility === "private" && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Lock size={18} className="text-gh-text-secondary mt-0.5" />
                    <div>
                      <div className="text-[14px] font-semibold text-gh-text">Private</div>
                      <div className="text-[12px] text-gh-text-secondary leading-tight">
                        You choose who can see and commit to this repository.
                      </div>
                    </div>
                  </div>
                </label>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div 
            layout
            className="bg-[#0d1117] border border-[#30363d] rounded-md p-4 flex gap-3 items-center mt-6 transition-colors"
          >
            <Info size={18} className="text-primary shrink-0" />
            <p className="text-[13px] text-gh-text">
              {getInfoMessage()}
            </p>
          </motion.div>
        </section>

        {/* Footer Actions */}
        <div className="flex justify-end items-center gap-4 mt-8 pt-6 border-t border-gh-border">
          <button 
            type="button" 
            className="text-[14px] text-gh-text hover:text-primary transition-colors cursor-pointer" 
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button 
            type="submit"
            className={`px-4 py-1.5 rounded-md text-[14px] font-semibold transition-all shadow-sm ${
              isSubmitting || !sourceUrl || !targetRepoName || !selectedOwner
                ? "bg-[#238636]/50 text-white/70 cursor-not-allowed"
                : "bg-[#238636] hover:bg-[#2ea043] text-white cursor-pointer active:scale-[0.98]"
            }`}
            disabled={isSubmitting || !sourceUrl || !targetRepoName || !selectedOwner}
          >
            {isSubmitting ? "Importing..." : "Begin import"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ImportRepoView;
