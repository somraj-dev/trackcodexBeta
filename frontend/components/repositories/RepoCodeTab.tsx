import React, { useState, useEffect } from "react";
import { Repository, FileItem, Commit } from "../../types";
import { api } from "../../services/infra/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import RepoCodeViewer from "./RepoCodeViewer";
import UniversalFileList from "../common/UniversalFileList";
import RepoAboutSidebar from "./RepoAboutSidebar";

interface RepoCodeTabProps {
  repo: Repository;
}

const RepoCodeTab: React.FC<RepoCodeTabProps> = ({ repo }) => {
  const [currentPath, setCurrentPath] = useState("");
  const [currentBranch, setCurrentBranch] = useState(repo.default_branch || "main");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<{ path: string; line?: number } | null>(null);
  const [readmeContent, setReadmeContent] = useState<string | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [latestRepoCommit, setLatestRepoCommit] = useState<Commit | null>(null);
  const [cloneMethod, setCloneMethod] = useState<"HTTPS" | "SSH">("HTTPS");
  
  // Go to File State
  const [showGoToFile, setShowGoToFile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allFiles, setAllFiles] = useState<{ name: string; path: string }[]>([]);
  const [fetchingAllFiles, setFetchingAllFiles] = useState(false);

  useEffect(() => {
    const fetchContents = async () => {
      setLoading(idx === 0);
      try {
        const data = await api.repositories.getContents(repo.id, currentPath, currentBranch);
        const safeData = Array.isArray(data) ? data : [];
        setFiles(
          safeData.map((item: any) => ({
            name: item.name,
            type: item.type === "tree" || item.type === "dir" ? "dir" : "file",
            commitVal: "Updating files...",
            time: "Recently",
            path: item.path,
          })),
        );

        // Fetch Readme if in root
        if (!currentPath) {
          const readme = safeData.find((f: any) => f.name.toLowerCase() === "readme.md");
          if (readme) {
            const content = await api.repositories.getFileContent(repo.id, readme.path, currentBranch);
            setReadmeContent(content);
          } else {
            setReadmeContent(null);
          }
        }
      } catch (err) {
        console.error("Failed to fetch contents", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContents();
  }, [repo.id, currentPath, currentBranch]);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [branchData, commitData] = await Promise.all([
          api.repositories.getBranches(repo.id),
          api.repositories.getCommits(repo.id, { limit: 1 }),
        ]);
        setBranches(branchData.map((b: any) => b.name));
        if (commitData && commitData.length > 0) {
          setLatestRepoCommit(commitData[0]);
        }
      } catch (err) {
        console.error("Failed to fetch meta", err);
      }
    };
    fetchMeta();
  }, [repo.id]);

  const handleFileClick = (file: FileItem) => {
    if (file.type === "dir") {
      setCurrentPath(file.path);
    } else {
      setSelectedFile({ path: file.path });
    }
  };

  const openGoToFile = async () => {
    setShowGoToFile(true);
    setSearchQuery("");
    if (allFiles.length === 0) {
      setFetchingAllFiles(true);
      try {
        const data = await api.repositories.getAllFiles(repo.id, currentBranch);
        setAllFiles(data.map((f: any) => ({ name: f.name, path: f.path })));
      } catch (err) {
        console.error("Failed to fetch all files", err);
      } finally {
        setFetchingAllFiles(false);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "t" && !showGoToFile && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        openGoToFile();
      }
      if (e.key === "Escape" && showGoToFile) {
        setShowGoToFile(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showGoToFile, allFiles]);

  const filteredFiles = allFiles.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.path.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 50);

  return (
    <div className="flex flex-col gap-4">
      {/* GitHub Style Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Branch Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowBranchMenu(!showBranchMenu)}
              className="flex items-center gap-2 px-3 py-1 bg-[#21262d] border border-gh-border rounded-md text-xs font-bold text-gh-text hover:bg-gh-bg-tertiary transition-all"
            >
              <span className="material-symbols-outlined !text-[16px] text-gh-text-secondary">
                account_tree
              </span>
              {currentBranch}
              <span className="material-symbols-outlined !text-[16px] text-gh-text-secondary">
                arrow_drop_down
              </span>
            </button>

            {showBranchMenu && (
              <div className="absolute left-0 mt-2 w-64 bg-[#0d1117] border border-gh-border rounded-lg shadow-2xl z-50 py-2">
                <div className="px-3 py-2 border-b border-gh-border">
                  <span className="text-[10px] font-medium uppercase text-gh-text-secondary">
                    Switch branches/tags
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {branches.map((b) => (
                    <button
                      key={b}
                      onClick={() => {
                        setCurrentBranch(b);
                        setShowBranchMenu(false);
                        setCurrentPath("");
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-gh-text hover:bg-primary hover:text-white transition-colors flex items-center justify-between"
                    >
                      {b}
                      {currentBranch === b && (
                        <span className="material-symbols-outlined !text-[14px]">
                          check
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-gh-text ml-2">
            <button className="flex items-center gap-1 hover:text-primary transition-colors">
              <span className="material-symbols-outlined !text-[16px] text-gh-text-secondary">account_tree</span>
              <span>{branches.length} <span className="font-normal text-gh-text-secondary">Branch{branches.length !== 1 && 'es'}</span></span>
            </button>
            <button className="flex items-center gap-1 hover:text-primary transition-colors">
              <span className="material-symbols-outlined !text-[16px] text-gh-text-secondary">sell</span>
              <span>1 <span className="font-normal text-gh-text-secondary">Tag</span></span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-grow max-w-md">
           <div className="relative flex-grow group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined !text-[16px] text-gh-text-tertiary group-focus-within:text-primary transition-colors">search</span>
              <input 
                type="text" 
                placeholder="Go to file"
                onClick={openGoToFile}
                readOnly
                className="w-full bg-[#0d1117] border border-gh-border rounded-md pl-9 pr-3 py-1 text-xs text-gh-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gh-text-tertiary bg-gh-bg-tertiary px-1 py-0.5 rounded border border-gh-border opacity-60">t</span>
           </div>
        </div>

        <div className="flex items-center gap-2">
           {/* Add File Dropdown */}
           <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-2 px-3 py-1 bg-[#21262d] border border-gh-border rounded-md text-xs font-bold text-gh-text hover:bg-gh-bg-tertiary transition-all"
            >
              Add file
              <span className="material-symbols-outlined !text-[16px] text-gh-text-secondary">
                arrow_drop_down
              </span>
            </button>

            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#0d1117] border border-gh-border rounded-lg shadow-2xl z-50 py-2">
                <button
                  onClick={() => {
                    setIsCreatingFile(true);
                    setShowAddMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-gh-text hover:bg-primary hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined !text-[16px]">
                    add
                  </span>
                  Create new file
                </button>
                <button
                   onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.multiple = true;
                    input.onchange = async (e: any) => {
                      const files = e.target.files;
                      if (!files.length) return;
                      // Logic handled in RepoCodeTab
                      setShowAddMenu(false);
                    };
                    input.click();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-gh-text hover:bg-primary hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined !text-[16px]">
                    upload
                  </span>
                  Upload files
                </button>
              </div>
            )}
          </div>

          <div className="relative group">
            <button className="bg-[#238636] text-white px-3 py-1 rounded-md text-xs font-bold flex items-center gap-2 hover:bg-[#2ea043] transition-all shadow-sm">
              <span className="material-symbols-outlined !text-[16px]">code</span>
              Code
              <span className="material-symbols-outlined !text-[14px]">
                arrow_drop_down
              </span>
            </button>

            <div className="absolute right-0 top-full mt-2 w-80 bg-[#0d1117] border border-gh-border rounded-md shadow-2xl p-4 hidden group-hover:block z-50">
               <div className="flex items-center gap-2 border-b border-gh-border pb-2 mb-3">
                  <span className="material-symbols-outlined text-gh-text-secondary">terminal</span>
                  <h4 className="font-bold text-sm">Clone</h4>
               </div>
               
               <div className="flex items-center gap-1 mb-3">
                <button
                  onClick={() => setCloneMethod("HTTPS")}
                  className={`text-[11px] font-bold px-3 py-1 rounded-full transition-all ${
                    cloneMethod === "HTTPS"
                      ? "bg-primary text-white"
                      : "text-gh-text-secondary hover:text-gh-text"
                  }`}
                >
                  HTTPS
                </button>
                <button
                  onClick={() => setCloneMethod("SSH")}
                  className={`text-[11px] font-bold px-3 py-1 rounded-full transition-all ${
                    cloneMethod === "SSH"
                      ? "bg-primary text-white"
                      : "text-gh-text-secondary hover:text-gh-text"
                  }`}
                >
                  SSH
                </button>
              </div>

              <div className="flex items-center gap-0 border border-gh-border rounded-md overflow-hidden bg-gh-bg">
                <input
                  readOnly
                  aria-label="Clone URL"
                  title="Repository Clone URL"
                  value={(() => {
                    const host = window.location.host;
                    const ownerUsername = typeof repo.owner === 'object' ? (repo.owner as any).username : repo.owner || "me";
                    if (cloneMethod === "SSH") {
                      return `git@${host}:${ownerUsername}/${repo.name}.git`;
                    }
                    return repo.cloneUrl || `${window.location.protocol}//${host}/git/${ownerUsername}/${repo.name}.git`;
                  })()}
                  className="flex-1 bg-transparent px-2 py-1.5 text-xs font-mono outline-none text-gh-text select-all"
                />
                <button
                  onClick={() => {
                    const host = window.location.host;
                    const ownerUsername = typeof repo.owner === 'object' ? (repo.owner as any).username : repo.owner || "me";
                    const url = cloneMethod === "SSH" 
                      ? `git@${host}:${ownerUsername}/${repo.name}.git`
                      : repo.cloneUrl || `${window.location.protocol}//${host}/git/${ownerUsername}/${repo.name}.git`;
                    navigator.clipboard.writeText(url);
                  }}
                  className="px-2 py-1.5 hover:bg-gh-bg-tertiary border-l border-gh-border"
                  title="Copy to clipboard"
                >
                  <span className="material-symbols-outlined !text-[14px]">
                    content_copy
                  </span>
                </button>
              </div>

               <div className="mt-4 pt-3 border-t border-gh-border space-y-2">
                  <button
                    onClick={async () => {
                      try {
                        const { url } = await api.workspaces.start(`live-${repo.id}`, repo.id, { liveSync: true });
                        window.open(url, "_blank");
                      } catch (e) { alert("Initialization failed."); }
                    }}
                    className="w-full py-1.5 bg-gh-bg text-gh-text text-xs font-bold rounded-md hover:bg-gh-bg-tertiary transition-colors flex items-center justify-center gap-2 border border-gh-border"
                  >
                    <span className="material-symbols-outlined !text-[16px] text-amber-500">sync_saved_locally</span>
                    Open with Live Sync
                  </button>
                  <button
                    onClick={() => {
                      const host = window.location.host;
                      const ownerUsername = typeof repo.owner === 'object' ? (repo.owner as any).username : repo.owner || "me";
                      const url = repo.cloneUrl || `${window.location.protocol}//${host}/git/${ownerUsername}/${repo.name}.git`;
                      window.location.href = `vscode://vscode.git/clone?url=${encodeURIComponent(url)}`;
                    }}
                    className="w-full py-1.5 bg-gh-bg text-gh-text text-xs font-bold rounded-md hover:bg-gh-bg-tertiary transition-colors flex items-center justify-center gap-2 border border-gh-border"
                  >
                    <span className="material-symbols-outlined !text-[16px] text-blue-400">terminal</span>
                    Open with VS Code Desktop
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const { url } = await api.workspaces.start(`codespace-${repo.id}`, repo.id);
                        window.open(url, "_blank");
                      } catch (e) { alert("Provisioning failed."); }
                    }}
                    className="w-full py-1.5 bg-[#238636] text-white text-xs font-bold rounded-md hover:bg-[#2ea043] transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined !text-[16px]">add_box</span>
                    Create codespace on {currentBranch}
                  </button>
                  <a
                    href={`${api.baseUrl}/repositories/${repo.id}/zipball?branch=${currentBranch}`}
                    download
                    className="w-full py-1.5 bg-gh-bg text-gh-text text-xs font-bold rounded-md hover:bg-gh-bg-tertiary transition-colors flex items-center justify-center gap-2 border border-gh-border"
                  >
                    <span className="material-symbols-outlined !text-[16px]">download</span>
                    Download ZIP
                  </a>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumbs & View Modes */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm">
          <button
            onClick={() => setCurrentPath("")}
            className={`hover:underline ${!currentPath ? 'font-semibold text-gh-text' : 'font-normal text-gh-text-secondary hover:text-primary'}`}
          >
            {repo.name}
          </button>
          {currentPath.split("/").map((part, idx, arr) => (
            <React.Fragment key={idx}>
              {part && (
                <>
                  <span className="text-gh-text-secondary/50 font-normal">/</span>
                  <button
                    onClick={() =>
                      setCurrentPath(arr.slice(0, idx + 1).join("/"))
                    }
                    className={`hover:underline ${idx === arr.length - 1 ? 'font-semibold text-gh-text' : 'font-normal text-gh-text-secondary hover:text-primary'}`}
                  >
                    {part}
                  </button>
                </>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gh-text-secondary">
              <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-bold">Synchronizing File Tree...</p>
            </div>
          ) : selectedFile ? (
            <div className="h-[600px] mb-6">
              <RepoCodeViewer
                repoId={repo.id}
                path={selectedFile.path}
                initialLine={selectedFile.line}
                onClose={() => setSelectedFile(null)}
              />
            </div>
          ) : (
            <UniversalFileList
              files={files}
              onFileClick={handleFileClick}
              latestCommit={latestRepoCommit ? {
                message: latestRepoCommit.message,
                author: latestRepoCommit.author?.username || latestRepoCommit.author?.name || "unknown",
                time: latestRepoCommit.createdAt ? new Date(latestRepoCommit.createdAt).toLocaleDateString() : "recently",
                avatar: latestRepoCommit.author?.avatarUrl || "https://github.com/github.png",
                count: String(repo.commits_count || ""),
                sha: latestRepoCommit.sha || latestRepoCommit.id,
              } : {
                message: "Project files synchronized with TrackCodex Hardware",
                author: (repo.owner as any)?.username || (repo.owner as any)?.name || (typeof repo.owner === 'string' ? repo.owner : "trackcodex"),
                time: "Live",
                avatar: "https://github.com/github.png",
              }}
            />
          )}

          {/* Readme Section */}
          <div className="mt-6 border border-gh-border rounded-md overflow-hidden bg-gh-bg">
            <div className="border-b border-gh-border px-4 py-2 flex items-center justify-between sticky top-0 bg-gh-bg z-10">
              <div className="flex items-center gap-2 text-sm font-bold text-gh-text">
                <span className="material-symbols-outlined !text-[18px]">list</span>
                README.md
              </div>
            </div>
            <div className="p-8 prose prose-invert max-w-none text-gh-text selection:bg-primary/30">
              {readmeContent ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {readmeContent}
                </ReactMarkdown>
              ) : (
                <div
                  dangerouslySetInnerHTML={{
                    __html:
                      repo.description ||
                      "No description provided for this repository.",
                  }}
                ></div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {!selectedFile && (
          <div className="w-full md:w-[300px] shrink-0">
            <RepoAboutSidebar repo={repo} />
          </div>
        )}
      </div>

      {/* New File Modal */}
      {isCreatingFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-gh-bg-secondary border border-gh-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gh-border flex items-center justify-between">
              <h3 className="font-bold text-gh-text">Create new file</h3>
              <button
                onClick={() => {
                  setIsCreatingFile(false);
                  setNewFileName("");
                }}
                className="text-gh-text-secondary hover:text-gh-text transition-colors"
                title="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="new-file-name"
                  className="text-xs font-medium uppercase text-gh-text-secondary"
                >
                  File Name
                </label>
                <input
                  id="new-file-name"
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g. index.ts"
                  className="w-full bg-gh-bg border border-gh-border rounded-md px-3 py-2 text-sm text-gh-text focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  autoFocus
                />
              </div>
              <p className="text-[10px] text-gh-text-secondary">
                Creating file in:{" "}
                <code className="bg-gh-bg-tertiary px-1 rounded">
                  {currentPath || "/"}
                </code>
              </p>
            </div>
            <div className="px-6 py-4 bg-gh-bg-tertiary flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setIsCreatingFile(false);
                  setNewFileName("");
                }}
                className="px-4 py-2 text-xs font-bold text-gh-text hover:bg-gh-bg-secondary rounded-md transition-colors border border-gh-border"
              >
                Cancel
              </button>
              <button
                disabled={!newFileName}
                onClick={async () => {
                  if (!newFileName) return;
                  setLoading(true);
                  try {
                    await api.repositories.createFile(repo.id, {
                      path: currentPath ? `${currentPath}/${newFileName}` : newFileName,
                      content: "// New file created with TrackCodex\n",
                      message: `Create ${newFileName}`,
                      branch: currentBranch,
                    });
                    // Refresh
                    const data = await api.repositories.getContents(repo.id, currentPath, currentBranch);
                    const safeData = Array.isArray(data) ? data : [];
                    setFiles(
                      safeData.map((item: any) => ({
                        name: item.name,
                        type: item.type === "tree" || item.type === "dir" ? "dir" : "file",
                        commitVal: "Created just now",
                        time: "Recently",
                        path: item.path,
                      })),
                    );
                    setIsCreatingFile(false);
                    setNewFileName("");
                  } catch (err) {
                    console.error("Failed to create file", err);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-md hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Go to File Modal */}
      {showGoToFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-[100] pt-[10vh] px-4">
          <div className="bg-gh-bg-secondary border border-gh-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="p-4 border-b border-gh-border">
              <div className="flex items-center gap-3 bg-gh-bg border border-gh-border rounded-lg px-3 py-2 focus-within:border-primary transition-all">
                <span className="material-symbols-outlined text-gh-text-secondary">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files..."
                  className="flex-1 bg-transparent text-sm text-gh-text outline-none"
                  autoFocus
                />
                <span className="text-[10px] font-bold text-gh-text-secondary bg-gh-bg-tertiary px-1.5 py-0.5 rounded border border-gh-border">ESC</span>
              </div>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto">
              {fetchingAllFiles ? (
                <div className="p-8 flex flex-col items-center gap-3">
                  <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-gh-text-secondary">Indexing files...</p>
                </div>
              ) : filteredFiles.length > 0 ? (
                <div className="divide-y divide-gh-border/50">
                  {filteredFiles.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => {
                        setSelectedFile({ path: file.path });
                        setShowGoToFile(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-primary/10 group transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined !text-[18px] text-gh-text-secondary group-hover:text-primary">description</span>
                        <div>
                          <p className="text-sm font-medium text-gh-text group-hover:text-primary">{file.name}</p>
                          <p className="text-[10px] text-gh-text-secondary font-mono">{file.path}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined !text-[16px] text-gh-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <span className="material-symbols-outlined !text-[48px] opacity-20 mb-2">search_off</span>
                  <p className="text-sm text-gh-text-secondary">No files matched your search</p>
                </div>
              )}
            </div>

            <div className="px-4 py-2 border-t border-gh-border bg-gh-bg-tertiary flex items-center justify-between">
              <p className="text-[10px] text-gh-text-secondary">
                Showing {filteredFiles.length} of {allFiles.length} files
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gh-text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined !text-[12px]">keyboard_return</span>
                  to select
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepoCodeTab;
