import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/infra/api";

type Visibility = "PUBLIC" | "INTERNAL" | "PRIVATE";
type OwnerType = "PERSONAL" | "ORG";

interface Owner {
  id: string;
  name: string;
  type: OwnerType;
  avatar?: string;
}

const ImportRepo: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceUsername, setSourceUsername] = useState("");
  const [sourceToken, setSourceToken] = useState("");
  const [repoName, setRepoName] = useState("");
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);

  // Mock owners for the demo/UI based on screenshots
  const owners: Owner[] = [
    {
      id: user?.id || "personal",
      name: user?.username || "Quantaforge-trackcodex",
      type: "PERSONAL",
      avatar: user?.avatar || `https://ui-avatars.com/api/?name=${user?.username || 'U'}&background=random`,
    },
    {
      id: "quantaforze", // Static org ID for demo/default
      name: "quantaforze",
      type: "ORG",
      avatar: "https://github.com/quantaforze.png",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl || !repoName || !selectedOwner) return;

    setIsSubmitting(true);
    try {
      await api.repositories.importRepo({
        sourceUrl,
        sourceUsername: sourceUsername || undefined,
        sourceToken: sourceToken || undefined,
        name: repoName,
        visibility,
        ownerId: selectedOwner.id,
      });

      window.dispatchEvent(
        new CustomEvent("trackcodex-notification", {
          detail: {
            title: "Import Started",
            message: `Starting import for ${repoName}. This might take a few minutes.`,
            type: "success",
          },
        }),
      );
      navigate("/repositories");
    } catch (err) {
      console.error("Failed to import repository:", err);
      window.dispatchEvent(
        new CustomEvent("trackcodex-notification", {
          detail: {
            title: "Import Failed",
            message: `Failed to import ${repoName}. Please check the source URL and try again.`,
            type: "error",
          },
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gh-bg min-h-screen font-sans selection:bg-primary/30">
      <div className="max-w-[768px] mx-auto py-12 px-6 animate-in fade-in duration-500">
        <header className="mb-8 border-b border-gh-border pb-6">
          <h1 className="text-2xl font-semibold text-gh-text mb-2 tracking-tight">
            Import your project to TrackCodex
          </h1>
          <p className="text-gh-text-secondary text-[14px] leading-relaxed">
            Import all the files, including revision history, from another version control system.
          </p>
          <p className="text-gh-text-secondary text-[12px] mt-4">
            Required fields are marked with an asterisk (*).
          </p>
        </header>

        {/* Alert Box */}
        <div className="mb-10 bg-[#fff5b1]/10 border border-[#fff5b1]/20 rounded-md p-4 animate-in slide-in-from-top-4 duration-500">
          <p className="text-[#e3b341] text-[14px] leading-relaxed">
            Support for importing Mercurial, Subversion and Team Foundation Version Control (TFVC) repositories ended on April 12, 2024. For more details, see the{" "}
            <button className="text-primary hover:underline">changelog</button>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Section 1: Source */}
          <div className="space-y-6">
            <h2 className="text-[18px] font-semibold text-gh-text">Your source repository details</h2>

            <div className="space-y-2">
              <label htmlFor="source-url" className="block text-[14px] font-semibold text-gh-text">
                The URL for your source repository *
              </label>
              <input
                id="source-url"
                required
                type="url"
                placeholder="https://git.example.org/code/git"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full bg-gh-bg border border-gh-border rounded-md px-3 py-1.5 text-[14px] text-gh-text focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
              <p className="text-[12px] text-gh-text-secondary">
                Learn more about <button className="text-primary hover:underline">importing git repositories</button>.
              </p>
            </div>

            <div className="border-t border-gh-border pt-6 space-y-4">
              <p className="text-[13px] text-gh-text italic">Please enter your credentials if required for cloning your remote repository.</p>

              <div className="space-y-2">
                <label htmlFor="source-username" className="block text-[14px] font-semibold text-gh-text">
                  Your username for your source repository
                </label>
                <input
                  id="source-username"
                  type="text"
                  value={sourceUsername}
                  onChange={(e) => setSourceUsername(e.target.value)}
                  className="w-full bg-gh-bg border border-gh-border rounded-md px-3 py-1.5 text-[14px] text-gh-text focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="source-token" className="block text-[14px] font-semibold text-gh-text">
                  Your access token or password for your source repository
                </label>
                <input
                  id="source-token"
                  type="password"
                  value={sourceToken}
                  onChange={(e) => setSourceToken(e.target.value)}
                  className="w-full bg-gh-bg border border-gh-border rounded-md px-3 py-1.5 text-[14px] text-gh-text focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gh-border" />

          {/* Section 2: Destination */}
          <div className="space-y-6">
            <h2 className="text-[18px] font-semibold text-gh-text">Your new repository details</h2>

            <div className="flex gap-4 items-end">
              <div className="space-y-2 flex-1 max-w-[240px]">
                <label className="block text-[14px] font-semibold text-gh-text">
                  Owner *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsOwnerDropdownOpen(!isOwnerDropdownOpen)}
                    className="w-full bg-gh-bg-secondary border border-gh-border rounded-md px-3 py-1.5 text-[14px] text-gh-text text-left flex items-center justify-between hover:bg-gh-border/20 transition-all shadow-sm active:scale-[0.98]"
                  >
                    {selectedOwner ? (
                      <span className="flex items-center gap-2">
                        <img src={selectedOwner.avatar} className="size-4 rounded-full" alt="" />
                        {selectedOwner.name}
                      </span>
                    ) : (
                      <span className="text-gh-text-secondary">Choose an owner</span>
                    )}
                    <span className="material-symbols-outlined !text-[16px]">arrow_drop_down</span>
                  </button>

                  {isOwnerDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-gh-bg border border-gh-border rounded-md shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      {owners.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => {
                            setSelectedOwner(o);
                            setIsOwnerDropdownOpen(false);
                            // Initial visibility default
                            setVisibility(o.type === "ORG" ? "INTERNAL" : "PUBLIC");
                          }}
                          className="w-full px-3 py-2 text-left text-[14px] text-gh-text hover:bg-primary hover:text-white flex items-center gap-2 transition-colors"
                        >
                          <img src={o.avatar} className="size-4 rounded-full border border-gh-border/20" alt="" />
                          {o.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xl text-gh-text-secondary pb-1.5 font-light">/</div>

              <div className="space-y-2 flex-1">
                <label htmlFor="new-repo-name" className="block text-[14px] font-semibold text-gh-text">
                  Repository name *
                </label>
                <input
                  id="new-repo-name"
                  required
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  className="w-full bg-gh-bg border border-gh-border rounded-md px-3 py-1.5 text-[14px] text-gh-text focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            {/* Dynamic Visibility Logic */}
            {!selectedOwner ? (
              <div className="bg-primary/5 border border-primary/20 rounded-md p-4 flex items-center gap-3 animate-in fade-in duration-500">
                <span className="material-symbols-outlined text-primary !text-[18px]">info</span>
                <p className="text-[13px] text-gh-text">Please choose an owner to see the available visibility options.</p>
              </div>
            ) : (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-500">
                <div className="space-y-3">
                  {/* Public (Hidden if Internal is selected and it's an Org) */}
                  <label className="flex items-start gap-4 p-3 border border-transparent rounded-md cursor-pointer hover:bg-gh-bg-secondary transition-colors group">
                    <input
                      type="radio"
                      name="visibility"
                      checked={visibility === "PUBLIC"}
                      onChange={() => setVisibility("PUBLIC")}
                      className="mt-1 size-4 rounded-full border-gh-border text-primary focus:ring-primary focus:ring-offset-gh-bg"
                    />
                    <div className="flex gap-3">
                      <span className="material-symbols-outlined text-gh-text-secondary group-hover:text-gh-text transition-colors">public</span>
                      <div>
                        <span className="block text-[14px] font-semibold text-gh-text">Public</span>
                        <span className="block text-[12px] text-gh-text-secondary">Anyone on the internet can see this repository. You choose who can commit.</span>
                      </div>
                    </div>
                  </label>

                  {/* Internal (Organization only) */}
                  {selectedOwner.type === "ORG" && (
                    <label className="flex items-start gap-4 p-3 border border-transparent rounded-md cursor-pointer hover:bg-gh-bg-secondary transition-colors group">
                      <input
                        type="radio"
                        name="visibility"
                        checked={visibility === "INTERNAL"}
                        onChange={() => setVisibility("INTERNAL")}
                        className="mt-1 size-4 rounded-full border-gh-border text-primary focus:ring-primary focus:ring-offset-gh-bg"
                      />
                      <div className="flex gap-3">
                        <span className="material-symbols-outlined text-gh-text-secondary group-hover:text-gh-text transition-colors">domain</span>
                        <div>
                          <span className="block text-[14px] font-semibold text-gh-text">Internal</span>
                          <span className="block text-[12px] text-gh-text-secondary">
                            {selectedOwner.name} <button type="button" className="text-primary hover:underline">enterprise members</button> can see this repository. You can choose who can commit.
                          </span>
                        </div>
                      </div>
                    </label>
                  )}

                  {/* Private */}
                  <label className="flex items-start gap-4 p-3 border border-transparent rounded-md cursor-pointer hover:bg-gh-bg-secondary transition-colors group">
                    <input
                      type="radio"
                      name="visibility"
                      checked={visibility === "PRIVATE"}
                      onChange={() => setVisibility("PRIVATE")}
                      className="mt-1 size-4 rounded-full border-gh-border text-primary focus:ring-primary focus:ring-offset-gh-bg"
                    />
                    <div className="flex gap-3">
                      <span className="material-symbols-outlined text-gh-text-secondary group-hover:text-gh-text transition-colors">lock</span>
                      <div>
                        <span className="block text-[14px] font-semibold text-gh-text">Private</span>
                        <span className="block text-[12px] text-gh-text-secondary">You choose who can see and commit to this repository.</span>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Info Message */}
                <div className="p-4 border-t border-gh-border flex items-center gap-2">
                  <span className="material-symbols-outlined text-gh-text-secondary !text-[16px]">info</span>
                  <p className="text-[12px] text-gh-text-secondary">
                    {selectedOwner.type === "PERSONAL" ? (
                      <>You are creating a <span className="font-semibold">{visibility.toLowerCase()}</span> repository in your personal account.</>
                    ) : (
                      <>You are creating {visibility === "INTERNAL" ? "an" : visibility === "PRIVATE" ? "a" : "a"} <span className="font-semibold">{visibility.toLowerCase()}</span> repository in the {selectedOwner.name} organization (quantaforge).</>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gh-border pt-6 flex justify-end gap-3 animate-in fade-in slide-in-from-top-4 duration-500 delay-300">
            <button
              type="button"
              onClick={() => navigate("/repositories")}
              className="px-4 py-2 text-[14px] font-semibold text-gh-text hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting || !sourceUrl || !repoName || !selectedOwner}
              type="submit"
              className="px-6 py-1.5 bg-[#238636] hover:bg-[#2eaa42] active:bg-[#238636] disabled:opacity-50 disabled:bg-[#238636]/60 disabled:cursor-not-allowed text-white rounded-md font-bold text-[14px] shadow-sm transition-all active:scale-[0.98] border border-[rgba(240,246,252,0.1)] flex items-center gap-2"
            >
              {isSubmitting && <span className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isSubmitting ? "Importing..." : "Begin import"}
            </button>
          </div>
        </form>

        {/* GitHub-style Page Footer */}
        <footer className="mt-20 pt-10 border-t border-gh-border flex flex-col md:flex-row items-center justify-between gap-6 text-[12px] text-gh-text-secondary animate-in fade-in duration-700 delay-500 pb-10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined !text-[18px]">account_tree</span>
            <span>© 2026 TrackCodex, Inc.</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <button type="button" className="hover:text-primary hover:underline">Terms</button>
            <button type="button" className="hover:text-primary hover:underline">Privacy</button>
            <button type="button" className="hover:text-primary hover:underline">Security</button>
            <button type="button" className="hover:text-primary hover:underline">Status</button>
            <button type="button" className="hover:text-primary hover:underline">Docs</button>
            <button type="button" className="hover:text-primary hover:underline">Contact</button>
            <button type="button" className="hover:text-primary hover:underline">Manage cookies</button>
          </nav>
        </footer>
      </div>
    </div>
  );
};

export default ImportRepo;
