import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/infra/api";

const REPO_NAME_SUGGESTIONS = [
  "super-fiesta",
  "ideal-disco",
  "legendary-octo-engine",
  "fuzzy-memory",
  "scaling-happiness",
];

const CreateRepo: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [repoName, setRepoName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [suggestion, setSuggestion] = useState("");
  const [initReadme, setInitReadme] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSuggestion(
      REPO_NAME_SUGGESTIONS[Math.floor(Math.random() * REPO_NAME_SUGGESTIONS.length)],
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoName) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await api.repositories.create({
        name: repoName,
        description: description,
        isPublic: visibility === "PUBLIC",
        initReadme: initReadme,
      });

      window.dispatchEvent(
        new CustomEvent("trackcodex-notification", {
          detail: {
            title: "Repository Created",
            message: `${created.name} has been created successfully.`,
            type: "success",
          },
        }),
      );

      navigate(`/repo/${created.id}`);
    } catch (err: any) {
      console.error("Failed to create repository:", err);
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to create repository";
      setError(errorMessage);
      window.dispatchEvent(
        new CustomEvent("trackcodex-notification", {
          detail: {
            title: "Error",
            message: errorMessage,
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
            Create a new repository
          </h1>
          <p className="text-gh-text-secondary text-[14px] leading-relaxed">
            Repositories contain a project's files and version history. Have a project elsewhere?{" "}
            <button
              onClick={() => navigate("/repositories/import")}
              className="text-[#0969da] hover:underline"
            >
              Import a repository.
            </button>
          </p>
          <p className="text-gh-text-secondary text-[12px] mt-4">
            Required fields are marked with an asterisk (*).
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-0">
          {/* Section 1: General */}
          <div className="relative pb-10 group/step">
            {/* Vertical Line Connector */}
            <div className="absolute left-[13px] top-[26px] bottom-0 w-[1px] bg-gh-border group-last/step:hidden transition-colors duration-300 group-hover/step:bg-gh-border-secondary" />

            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="size-[28px] rounded-full bg-gh-bg-secondary border border-gh-border flex items-center justify-center text-[12px] font-bold text-gh-text-secondary transition-all duration-300 group-hover/step:border-primary group-hover/step:text-primary">
                1
              </div>
              <h2 className="text-[16px] font-semibold text-gh-text tracking-tight">General</h2>
            </div>

            <div className="pl-11 space-y-6 animate-in slide-in-from-left-4 duration-500">
              <div className="flex gap-4 items-end">
                <div className="space-y-2 flex-1 max-w-[240px]">
                  <label htmlFor="owner-select" className="block text-[14px] font-semibold text-gh-text">
                    Owner *
                  </label>
                  <div className="relative">
                    <button
                      id="owner-select"
                      type="button"
                      aria-label="Select Owner"
                      className="w-full bg-gh-bg-secondary border border-gh-border rounded-md px-3 py-[5px] text-[14px] text-gh-text text-left flex items-center justify-between hover:bg-gh-border/20 hover:border-gh-border-secondary transition-all shadow-sm active:scale-[0.98]"
                    >
                      <span className="flex items-center gap-2">
                        <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username || 'U'}`} className="size-4 rounded-full" alt="" />
                        {user?.username || "Choose an owner"}
                      </span>
                      <span className="material-symbols-outlined !text-[16px] text-gh-text-secondary">arrow_drop_down</span>
                    </button>
                  </div>
                </div>

                <div className="text-xl text-gh-text-secondary pb-1.5 font-light">/</div>

                <div className="space-y-2 flex-1">
                  <label htmlFor="repository-name" className="block text-[14px] font-semibold text-gh-text">
                    Repository name *
                  </label>
                  <input
                    id="repository-name"
                    required
                    type="text"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    autoComplete="off"
                    spellCheck="false"
                    className="w-full bg-gh-bg border border-gh-border rounded-md px-3 py-[5px] text-[14px] text-gh-text focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gh-text-secondary/50"
                  />
                </div>
              </div>

              <p className="text-[12px] text-gh-text-secondary">
                Great repository names are short and memorable. How about{" "}
                <button
                  type="button"
                  onClick={() => setRepoName(suggestion)}
                  className="text-[#0969da] font-semibold hover:underline"
                >
                  {suggestion}
                </button>
                ?
              </p>

              <div className="space-y-2">
                <label htmlFor="repository-description" className="block text-[14px] font-semibold text-gh-text">
                  Description <span className="text-gh-text-secondary font-normal text-[12px] ml-1">(optional)</span>
                </label>
                <input
                  id="repository-description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gh-bg border border-gh-border rounded-md px-3 py-[5px] text-[14px] text-gh-text focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                <div className="text-[11px] text-gh-text-secondary font-mono">
                  {description.length} / 350 characters
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Configuration */}
          <div className="relative pb-10 group/step">
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="size-[28px] rounded-full bg-gh-bg-secondary border border-gh-border flex items-center justify-center text-[12px] font-bold text-gh-text-secondary transition-all duration-300 group-hover/step:border-primary group-hover/step:text-primary">
                2
              </div>
              <h2 className="text-[16px] font-semibold text-gh-text tracking-tight">Configuration</h2>
            </div>

            <div className="pl-11 space-y-4 animate-in slide-in-from-left-4 duration-500 delay-150">
              <div className="bg-[#0A0D14] border border-gh-border rounded-md overflow-hidden shadow-sm">
                {/* Visibility Selection */}
                <div className="p-4 border-b border-gh-border flex items-center justify-between hover:bg-gh-bg-secondary/30 transition-colors">
                  <div>
                    <h3 className="text-[14px] font-semibold text-gh-text">Choose visibility *</h3>
                    <p className="text-[12px] text-gh-text-secondary mt-0.5">Choose who can see and commit to this repository</p>
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setVisibility(visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC")}
                      className="bg-gh-bg border border-gh-border rounded-md px-3 py-1.5 text-[12px] text-gh-text font-semibold flex items-center gap-2 hover:bg-gh-bg-secondary hover:border-gh-border-secondary transition-all shadow-sm active:scale-95"
                    >
                      <span className="material-symbols-outlined !text-[16px] text-gh-text-secondary">
                        {visibility === "PUBLIC" ? "public" : "lock"}
                      </span>
                      <span>{visibility === "PUBLIC" ? "Public" : "Private"}</span>
                      <span className="material-symbols-outlined !text-[14px] text-gh-text-secondary">arrow_drop_down</span>
                    </button>
                  </div>
                </div>

                {/* Template Selection */}
                <div className="p-4 border-b border-gh-border flex items-center justify-between hover:bg-gh-bg-secondary/30 transition-colors">
                  <div>
                    <h3 className="text-[14px] font-semibold text-gh-text">Start with a template</h3>
                    <p className="text-[12px] text-gh-text-secondary mt-0.5">Templates pre-configure your repository with files.</p>
                  </div>
                  <button type="button" className="bg-gh-bg border border-gh-border rounded-md px-3 py-1.5 text-[12px] text-gh-text-secondary cursor-not-allowed opacity-60 flex items-center gap-2">
                    <span>No template</span>
                    <span className="material-symbols-outlined !text-[14px]">arrow_drop_down</span>
                  </button>
                </div>

                {/* README initialization */}
                <div className="p-4 border-b border-gh-border flex items-center justify-between hover:bg-gh-bg-secondary/30 transition-colors group/row">
                  <div>
                    <h3 className="text-[14px] font-semibold text-gh-text group-hover/row:text-[#0969da] transition-colors">Add README</h3>
                    <p className="text-[12px] text-gh-text-secondary mt-0.5">
                      READMEs can be used as longer descriptions. <button type="button" className="text-[#0969da] hover:underline">About READMEs</button>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[12px] font-semibold transition-colors duration-200 ${initReadme ? "text-gh-text" : "text-gh-text-secondary opacity-60"}`}>
                      {initReadme ? "On" : "Off"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setInitReadme(!initReadme)}
                      className={`relative w-[44px] h-[24px] rounded-full transition-all duration-[350ms] ease-in-out p-[3px] border ${initReadme ? "bg-[#238636] border-[#2ea44f]" : "bg-[#11141A] border-[#1E232E]"}`}
                      aria-label={`Toggle README: ${initReadme ? 'On' : 'Off'}`}
                    >
                      <div className={`size-[16px] bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-[350ms] ease-in-out transform ${initReadme ? "translate-x-[20px]" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>

                {/* Gitignore placeholder */}
                <div className="p-4 border-b border-gh-border flex items-center justify-between hover:bg-gh-bg-secondary/30 transition-colors">
                  <div>
                    <h3 className="text-[14px] font-semibold text-gh-text">Add .gitignore</h3>
                    <p className="text-[12px] text-gh-text-secondary mt-0.5">
                      .gitignore tells git which files not to track. <button type="button" className="text-[#0969da] hover:underline">About ignoring files</button>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[#8b949e] text-[12px] font-medium">
                    <span>None</span>
                    <span className="material-symbols-outlined !text-[16px]">arrow_drop_down</span>
                  </div>
                </div>

                {/* License placeholder */}
                <div className="p-4 flex items-center justify-between hover:bg-gh-bg-secondary/30 transition-colors">
                  <div>
                    <h3 className="text-[14px] font-semibold text-gh-text">Add license</h3>
                    <p className="text-[12px] text-gh-text-secondary mt-0.5">
                      Licenses explain how others can use your code. <button type="button" className="text-[#0969da] hover:underline">About licenses</button>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[#8b949e] text-[12px] font-medium">
                    <span>None</span>
                    <span className="material-symbols-outlined !text-[16px]">arrow_drop_down</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-4 pt-8 animate-in fade-in slide-in-from-top-4 duration-500 delay-300">
            {error && (
              <div className="bg-[#f85149]/10 border border-[#f85149]/50 text-[#f85149] px-4 py-3 rounded-md text-[13px] flex items-center gap-3 w-full max-w-[400px]">
                <span className="material-symbols-outlined !text-[18px]">error</span>
                <span>{error}</span>
              </div>
            )}
            <button
              disabled={isSubmitting || !repoName}
              type="submit"
              className="px-8 py-2.5 bg-[#238636] hover:bg-[#2eaa42] active:bg-[#238636] disabled:opacity-50 disabled:bg-[#238636]/60 disabled:cursor-not-allowed text-white rounded-md font-bold text-[14px] shadow-[0_1px_0_rgba(255,255,255,0.1)_inset] transition-all hover:shadow-[0_4px_12px_rgba(46,164,79,0.2)] active:scale-[0.98] border border-[rgba(240,246,252,0.1)] flex items-center gap-2 group/btn"
            >
              {isSubmitting && <span className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isSubmitting ? "Creating..." : "Create repository"}
              {!isSubmitting && <span className="material-symbols-outlined !text-[18px] group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>}
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

export default CreateRepo;



