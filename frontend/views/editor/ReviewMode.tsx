import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/infra/api";
import { DiffEditor } from "@monaco-editor/react";
import { Repository, PullRequest } from "../../types";

// --- Sub-components for VS Code UI ---

const ActivityBarItem = ({
  icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
}) => (
  <button
    onClick={onClick}
    className={`w-12 h-12 flex items-center justify-center relative group transition-all ${active ? "text-white border-l-2 border-[#1f6feb]" : "text-[#858585] hover:text-[#cccccc]"}`}
    title={label}
  >
    <span
      className={`material-symbols-outlined !text-[24px] ${active ? "filled" : ""}`}
    >
      {icon}
    </span>
    {badge && (
      <span className="absolute top-2 right-2 size-4 bg-[#1f6feb] text-white text-[9px] font-semibold rounded-full flex items-center justify-center border-2 border-[#1e1e1e]">
        {badge}
      </span>
    )}
  </button>
);

const ExplorerSection = ({
  title,
  count,
  children,
  defaultOpen = true,
}: {
  title: string;
  count?: number;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="flex flex-col">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 flex items-center px-4 hover:bg-[#2a2d2e] transition-colors text-[11px] font-bold uppercase tracking-widest text-[#858585] gap-2 select-none"
      >
        <span
          className={`material-symbols-outlined !text-[16px] transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`}
        >
          expand_more
        </span>
        <span className="flex-1 text-left">{title}</span>
        {count !== undefined && (
          <span className="text-[10px] opacity-50">({count})</span>
        )}
      </button>
      {isOpen && <div className="pb-2">{children}</div>}
    </div>
  );
};

const ReviewMode = () => {
  const { id, owner, repo: repoNameParam, number } = useParams();
  const navigate = useNavigate();

  const [repo, setRepo] = useState<Repository | null>(null);
  const [pr, setPr] = useState<PullRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [changedFiles, setChangedFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [diffContent, setDiffContent] = useState<{ original: string; modified: string } | null>(null);

  const [rightPanel, setRightPanel] = useState<"ai" | "reviewers">("ai");
  const [aiSummary, setAiSummary] = useState<string>("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const fetchPRData = useCallback(async () => {
    setLoading(true);
    try {
      let resolvedRepoId = id;

      // If we only have owner/repo, find the id
      if (!id && owner && repoNameParam) {
        const r = await api.repositories.getByName(owner, repoNameParam);
        resolvedRepoId = r.id;
        setRepo(r);
      } else if (id) {
        const r = await api.repositories.get(id);
        setRepo(r);
      }

      if (!resolvedRepoId || !number) throw new Error("Missing ID or PR Number");

      const prData = await api.pullRequests.get(resolvedRepoId, parseInt(number));
      setPr(prData);

      // Fetch Diffs
      const { diff } = await api.pullRequests.getDiff(resolvedRepoId, parseInt(number));

      // Parse diff for file list (very basic parser)
      const files: any[] = [];
      const parts = diff.split("diff --git ");
      parts.slice(1).forEach(part => {
        const lines = part.split("\n");
        const fileLine = lines[0];
        // Correctly extract filename: "a/filename b/filename"
        const match = fileLine.match(/ b\/(.+)$/);
        const fileName = match ? match[1] : fileLine.trim();

        files.push({
          name: fileName,
          raw: part
        });
      });
      setChangedFiles(files);
      if (files.length > 0) setSelectedFile(files[0].name);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load PR data");
    } finally {
      setLoading(false);
    }
  }, [id, owner, repoNameParam, number]);

  useEffect(() => {
    fetchPRData();
  }, [fetchPRData]);

  // Load specific file diff
  useEffect(() => {
    if (!selectedFile || !changedFiles.length) return;

    const file = changedFiles.find(f => f.name === selectedFile);
    if (file) {
      const lines = file.raw.split("\n");
      const originalLines: string[] = [];
      const modifiedLines: string[] = [];

      let inHunk = false;
      lines.forEach((line: string) => {
        if (line.startsWith("@@")) {
          inHunk = true;
          return;
        }
        if (!inHunk) return;

        if (line.startsWith("-")) {
          originalLines.push(line.substring(1));
        } else if (line.startsWith("+")) {
          modifiedLines.push(line.substring(1));
        } else {
          originalLines.push(line.substring(1));
          modifiedLines.push(line.substring(1));
        }
      });

      setDiffContent({
        original: originalLines.join("\n"),
        modified: modifiedLines.join("\n")
      });
    }
  }, [selectedFile, changedFiles]);

  const generateAISummary = async () => {
    if (!pr || isGeneratingAi) return;
    setIsGeneratingAi(true);
    try {
      const prompt = `Please review this Pull Request: ${pr.title}. Description: ${pr.body || "No description"}. Current status: ${pr.status}. Provide a concise high-level summary and potential risks.`;
      const { result } = await api.forgeAI.complete({
        prompt,
        workspaceId: id
      });
      setAiSummary(result);
    } catch (err) {
      console.error("AI Review failed", err);
      setAiSummary("Failed to generate AI summary.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  useEffect(() => {
    if (pr && !aiSummary) generateAISummary();
  }, [pr]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1e1e1e]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-[#1f6feb] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#cccccc] text-sm font-bold tracking-widest animate-pulse">SYNCHRONIZING REVIEW HARDWARE...</p>
        </div>
      </div>
    );
  }

  if (error || !pr) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#1e1e1e] p-8 text-center">
        <span className="material-symbols-outlined text-red-500 text-6xl mb-4">error</span>
        <h2 className="text-white text-xl font-bold mb-2">Review Mode Initialization Failed</h2>
        <p className="text-[#858585] max-w-md mb-6">{error || "Pull request not found"}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-[#333333] text-white rounded-lg hover:bg-[#444444] transition-all">Go Back</button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e1e] font-display overflow-hidden select-none">
      {/* VS Code Context Top Bar */}
      <header className="h-12 border-b border-[#2b2b2b] bg-[#1e1e1e] flex items-center justify-between px-4 shrink-0 z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[13px] font-bold text-[#cccccc]">
            <span className="text-[#858585] truncate max-w-[200px]">{repo?.owner || "track-codex"} / {repo?.name || "repository"}</span>
            <span className="text-[#555555]">/</span>
            <span className="text-white">PR #{pr.number}</span>
          </div>
          <div className="h-4 w-px bg-[#333333] mx-2"></div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
            {pr.status}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/repo/${repo?.id || id}`)}
            className="text-[12px] text-[#858585] hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined !text-[16px]">arrow_back</span>
            Back to Repository
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar (Side) */}
        <aside className="w-12 bg-[#333333] flex flex-col shrink-0 z-50">
          <ActivityBarItem
            icon="source_control"
            label="PR Review"
            active
          />
          <ActivityBarItem icon="search" label="Search PR" />
          <ActivityBarItem
            icon="psychology"
            label="ForgeAI Insights"
            badge={1}
            onClick={() => setRightPanel("ai")}
          />
          <div className="mt-auto">
            <ActivityBarItem icon="settings" label="Settings" />
          </div>
        </aside>

        {/* Side Bar (PR Explorer) */}
        <aside className="w-[300px] border-r border-[#2b2b2b] bg-[#252526] flex flex-col shrink-0">
          <div className="h-10 px-4 flex items-center justify-between border-b border-[#2b2b2b]">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#858585]">
              Changed Files
            </span>
            <span className="text-[10px] text-[#555555] font-bold">{changedFiles.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pt-2">
            {changedFiles.map(file => (
              <div
                key={file.name}
                onClick={() => setSelectedFile(file.name)}
                className={`px-4 py-2 flex items-center gap-2 cursor-pointer transition-colors text-[13px] ${selectedFile === file.name ? "bg-[#37373d] text-white font-bold" : "text-[#cccccc] hover:bg-[#2a2d2e]"}`}
              >
                <span className="material-symbols-outlined !text-[18px] text-blue-400">description</span>
                <span className="truncate">{file.name}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Editor Main Section */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e] relative">
          {/* Tab Bar */}
          <div className="h-9 bg-[#252526] flex items-center border-b border-[#2b2b2b] shrink-0">
            <div className="h-full px-4 flex items-center gap-2 text-[12px] font-medium text-white bg-[#1e1e1e] border-t border-[#1f6feb]">
              {selectedFile || "Diff View"}
            </div>
          </div>

          {/* Monaco Diff Editor */}
          <div className="flex-1 overflow-hidden relative">
            {diffContent ? (
              <DiffEditor
                height="100%"
                original={diffContent.original}
                modified={diffContent.modified}
                language="typescript"
                theme="vs-dark"
                options={{
                  renderSideBySide: true,
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  renderIndicators: true,
                  originalEditable: false,
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#555555] flex-col gap-4">
                <span className="material-symbols-outlined text-4xl">folder_zip</span>
                <span>Select a file to view changes</span>
              </div>
            )}
          </div>

          {/* Merge Control Bar */}
          <footer className="h-14 border-t border-[#2b2b2b] bg-[#1e1e1e] flex items-center justify-end px-6 gap-3 shrink-0">
            <button className="px-5 py-2 bg-[#2d2d2d] text-white rounded text-[12px] font-bold hover:bg-[#3d3d3d] transition-all">
              Request Changes
            </button>
            <button className="px-6 py-2 bg-[#1f6feb] text-white rounded text-[12px] font-bold hover:bg-[#2083fd] transition-all flex items-center gap-2">
              <span className="material-symbols-outlined !text-[18px]">merge</span>
              Merge Pull Request
            </button>
          </footer>
        </main>

        {/* Modular Activity Side Bar (Right) */}
        <aside className="w-[350px] border-l border-[#2b2b2b] bg-[#252526] flex flex-col shrink-0">
          <div className="h-10 px-4 flex items-center justify-between border-b border-[#2b2b2b]">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#858585]">
              {rightPanel === "ai" ? "ForgeAI Review" : "Reviewers"}
            </span>
            <span className="material-symbols-outlined !text-[18px] text-[#1f6feb] filled">
              auto_awesome
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            <div className="space-y-4">
              <h4 className="text-[12px] font-bold text-white mb-2">AI Summary</h4>
              {isGeneratingAi ? (
                <div className="flex flex-col gap-2">
                  <div className="h-3 w-full bg-[#333333] animate-pulse rounded"></div>
                  <div className="h-3 w-4/5 bg-[#333333] animate-pulse rounded"></div>
                  <div className="h-3 w-2/3 bg-[#333333] animate-pulse rounded"></div>
                </div>
              ) : (
                <p className="text-[13px] text-[#cccccc] leading-relaxed">
                  {aiSummary || "No summary available."}
                </p>
              )}
              {aiSummary && !isGeneratingAi && (
                <button onClick={generateAISummary} className="text-[11px] text-[#1f6feb] hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined !text-[14px]">refresh</span>
                  Regenerate
                </button>
              )}
            </div>

            <div className="space-y-4 pt-6 border-t border-[#333333]">
              <h4 className="text-[11px] font-bold text-[#858585] uppercase tracking-widest">Metadata</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#858585]">Author:</span>
                  <span className="text-white font-medium">
                    {typeof pr.author === 'object' ? (pr.author as any).username : pr.author}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#858585]">Created:</span>
                  <span className="text-white font-medium">
                    {pr.createdAt ? new Date(pr.createdAt as any).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#858585]">Base:</span>
                  <span className="px-1.5 py-0.5 bg-[#333333] rounded font-mono text-[10px] text-blue-400">{pr.base}</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#858585]">Head:</span>
                  <span className="px-1.5 py-0.5 bg-[#333333] rounded font-mono text-[10px] text-emerald-400">{pr.head}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* VS Code Status Bar */}
      <footer className="h-6 bg-[#1f6feb] text-white flex items-center justify-between px-3 text-[11px] shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined !text-[14px]">account_tree</span>
            <span>{pr.base}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined !text-[14px]">sync</span>
            <span>{changedFiles.length} files changed</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span>TypeScript JSX</span>
          <div className="flex items-center gap-1 cursor-help" title="ForgeAI is monitoring this review">
            <span className="material-symbols-outlined !text-[14px] filled">auto_awesome</span>
            <span>ForgeAI: Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ReviewMode;


