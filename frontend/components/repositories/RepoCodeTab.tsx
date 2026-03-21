import React, { useState, useEffect } from "react";
import { MOCK_REPO_FILES } from "../../constants";
import { Repository } from "../../types";
import { api } from "../../services/infra/api";
import { githubService } from "../../services/git/github";
import UniversalFileList from "../common/UniversalFileList";
import RepoCodeViewer from "./RepoCodeViewer";
import RepoAboutSidebar from "./RepoAboutSidebar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { FileItem } from "../common/UniversalFileList";

interface RepoCodeTabProps {
  repo: Repository;
}

const RepoCodeTab: React.FC<RepoCodeTabProps> = ({ repo }) => {
  const [currentPath, setCurrentPath] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<{
    path: string;
    line?: number;
  } | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [currentBranch, setCurrentBranch] = useState("main");
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [readmeContent, setReadmeContent] = useState<string | null>(null);
  const [latestRepoCommit, setLatestRepoCommit] = useState<any>(null);
  const [showGoToFile, setShowGoToFile] = useState(false);
  const [allFiles, setAllFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchingAllFiles, setFetchingAllFiles] = useState(false);
  const [cloneMethod, setCloneMethod] = useState<"HTTPS" | "SSH">("HTTPS");

  useEffect(() => {
    const fetchRepoData = async () => {
      if (!repo.name) return;
      try {
        const branchList = await api.repositories.getBranches(repo.id);
        setBranches(branchList || ["main", "develop"]);
      } catch (e) {
        setBranches(["main", "develop"]);
      }
    };
    fetchRepoData();
  }, [repo.id, repo.name]);

  useEffect(() => {
    const fetchContents = async () => {
      if (!repo.name) return;

      setLoading(true);
      try {
        const data = await api.repositories.getContents(
          repo.id,
          currentPath,
          currentBranch,
        );

        const safeData = Array.isArray(data) ? data : [];

        // Map internal API to FileItem type
        const mappedFiles: FileItem[] = safeData.map((item: any) => ({
          name: item.name,
          type: item.type === "tree" || item.type === "dir" ? "dir" : "file",
          commitVal: "Updated just now",
          time: "Recently",
          path: item.path,
        }));

        setFiles(mappedFiles);
      } catch (err) {
        console.error("Failed to fetch contents", err);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContents();
  }, [repo.id, repo.name, currentPath, currentBranch]);

  useEffect(() => {
    const fetchReadme = async () => {
      if (!repo.id || currentPath !== "") {
        setReadmeContent(null);
        return;
      }
      try {
        const readmeFile = files.find(f => 
          f.name.toLowerCase() === "readme.md" || 
          f.name.toLowerCase() === "readme"
        );
        if (readmeFile) {
          const content = await api.repositories.getContent(repo.id, readmeFile.path, currentBranch);
          if (typeof content === "string") {
            setReadmeContent(content);
          } else if (content && content.content) {
            // Handle base64 or raw content if API returns an object
             setReadmeContent(content.encoding === 'base64' ? atob(content.content) : content.content);
          }
        } else {
          setReadmeContent(null);
        }
      } catch (err) {
        console.error("Failed to fetch README", err);
        setReadmeContent(null);
      }
    };

    if (files.length > 0) {
      fetchReadme();
    }
  }, [repo.id, currentPath, currentBranch, files]);

  useEffect(() => {
    const fetchLatestCommit = async () => {
      if (!repo.id) return;
      try {
        const commits = await api.repositories.getCommits(repo.id, currentBranch, "", 1);
        if (commits && commits.length > 0) {
          setLatestRepoCommit(commits[0]);
        }
      } catch (err) {
        console.error("Failed to fetch latest commit", err);
      }
    };
    fetchLatestCommit();
  }, [repo.id, currentBranch]);

  const handleFileClick = (file: FileItem) => {
    if (file.type === "dir") {
      setCurrentPath(file.path);
    } else {
      setSelectedFile({ path: file.path });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "t" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        openGoToFile();
      }
      if (e.key === "Escape") {
        setShowGoToFile(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [repo.id, currentBranch]);

  const openGoToFile = async () => {
    setShowGoToFile(true);
    setSearchQuery("");
    if (allFiles.length === 0) {
      setFetchingAllFiles(true);
      try {
        const treeData = await api.repositories.getTree(repo.id, currentBranch);
        const mapped: FileItem[] = (treeData || [])
          .filter((item: any) => item.type === "blob" || item.type === "file")
          .map((item: any) => ({
            name: item.path.split("/").pop() || item.path,
            type: "file",
            path: item.path,
            commitVal: "",
            time: ""
          }));
        setAllFiles(mapped);
      } catch (err) {
        console.error("Failed to fetch tree", err);
      } finally {
        setFetchingAllFiles(false);
      }
    }
  };

  const filteredFiles = allFiles.filter(f => 
    f.path.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 50);

  return (
    <div className="flex flex-col gap-4">
      {/* Repo Stats & Controls */}
      <div className="flex items-center justify-between">
        {/* Left: Stats/History */}
        <div className="flex items-center gap-4 text-sm font-medium text-gh-text-secondary">
          <button className="flex items-center gap-2 hover:text-primary transition-colors">
            <span className="material-symbols-outlined !text-[18px]">
              history
            </span>
            <span className="text-gh-text font-bold">Latest History</span>
          </button>
          <span className="text-gh-border">|</span>
          <div className="flex items-center gap-1 font-bold">
            <span className="material-symbols-outlined !text-[14px]">
              adjust
            </span>
            {repo.open_issues_count || 0} issues
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          {/* Branch Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowBranchMenu(!showBranchMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gh-bg-secondary border border-gh-border rounded-md text-xs font-bold text-gh-text hover:bg-gh-bg-tertiary transition-all"
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
              <div className="absolute left-0 mt-2 w-64 bg-[#252526] border border-gh-border rounded-lg shadow-2xl z-50 py-2">
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

          <button
            onClick={openGoToFile}
            className="flex items-center gap-2 px-3 py-1.5 bg-gh-bg-secondary border border-gh-border rounded-md text-xs font-bold text-gh-text hover:bg-gh-bg-tertiary transition-all"
            title="Press 't' to search files"
          >
            Go to file
          </button>

          {/* Add File Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gh-bg-secondary border border-gh-border rounded-md text-xs font-bold text-gh-text hover:bg-gh-bg-tertiary transition-all"
            >
              Add file
              <span className="material-symbols-outlined !text-[16px] text-gh-text-secondary">
                arrow_drop_down
              </span>
            </button>

            {showAddMenu && (
              <div className="absolute left-0 mt-2 w-48 bg-[#252526] border border-gh-border rounded-lg shadow-2xl z-50 py-2">
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

                      setLoading(true);
                      try {
                        for (const file of files) {
                          const reader = new FileReader();
                          const content = await new Promise<string>(
                            (resolve) => {
                              reader.onload = () =>
                                resolve(reader.result as string);
                              reader.readAsText(file);
                            },
                          );

                          await api.repositories.createFile(repo.id, {
                            path: currentPath
                              ? `${currentPath}/${file.name}`
                              : file.name,
                            content,
                            message: `Upload ${file.name}`,
                            branch: currentBranch,
                          });
                        }
                        // Refresh
                        const data = await api.repositories.getContents(
                          repo.id,
                          currentPath,
                          currentBranch,
                        );
                        const safeData = Array.isArray(data) ? data : [];
                        setFiles(
                          safeData.map((item: any) => ({
                            name: item.name,
                            type:
                              item.type === "tree" || item.type === "dir"
                                ? "dir"
                                : "file",
                            commitVal: "Uploaded just now",
                            time: "Recently",
                            path: item.path,
                          })),
                        );
                      } catch (err) {
                        console.error("Upload failed", err);
                      } finally {
                        setLoading(false);
                        setShowAddMenu(false);
                      }
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

          {/* Breadcrumbs */}
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

          <div className="flex-1"></div>

          {/* CLONE & CODESPACE BUTTON */}
          <button
            onClick={async () => {
              try {
                const { url } = await api.workspaces.start(
                  `live-${repo.id}`,
                  repo.id,
                  { liveSync: true }
                );
                window.open(url, "_blank");
              } catch (e) {
                alert("Live Sync initialization failed.");
              }
            }}
            className="px-3 py-1.5 bg-gh-bg-secondary border border-gh-border rounded-md text-xs font-bold text-amber-500 hover:border-amber-500/50 transition-all flex items-center gap-2"
            title="Edit in Cloud IDE with automatic repo syncing"
          >
            <span className="material-symbols-outlined !text-[16px]">
              sync_saved_locally
            </span>
            Live Sync
          </button>

          <button
            onClick={() => {
              const ownerUsername = typeof repo.owner === 'object' ? (repo.owner as any).username : repo.owner || "me";
              const cloneUrl = repo.cloneUrl || `${window.location.protocol}//${window.location.host}/git/${ownerUsername}/${repo.name}.git`;
              const vscodeUri = `vscode://vscode.git/clone?url=${encodeURIComponent(cloneUrl)}`;
              window.location.href = vscodeUri;
            }}
            className="px-3 py-1.5 bg-gh-bg-secondary border border-gh-border rounded-md text-xs font-bold text-blue-400 hover:border-blue-400/50 transition-all flex items-center gap-2"
            title="Open in your local VS Code application"
          >
            <span className="material-symbols-outlined !text-[16px]">
              terminal
            </span>
            VS Code
          </button>

          <button
            onClick={async () => {
              // provision codespace
              try {
                const { url } = await api.workspaces.start(
                  `codespace-${repo.id}`,
                  repo.id,
                );
                window.open(url, "_blank");
              } catch (e) {
                alert("Provisioning failed. Check Docker status.");
              }
            }}
            className="px-3 py-1.5 bg-gh-bg-secondary border border-gh-border rounded-md text-xs font-bold text-emerald-500 hover:border-emerald-500/50 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined !text-[16px]">
              bolt
            </span>
            Codespace
          </button>

          <div className="relative group">
            <button className="bg-primary text-white px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-sm">
              Code
              <span className="material-symbols-outlined !text-[16px]">
                arrow_drop_down
              </span>
            </button>

            <div className="absolute right-0 top-full mt-2 w-80 bg-gh-bg-secondary border border-gh-border rounded-md shadow-xl p-4 hidden group-hover:block z-50">
              <div className="flex items-center gap-2 border-b border-gh-border pb-2 mb-3">
                <span className="material-symbols-outlined text-gh-text-secondary">
                  terminal
                </span>
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
                    const ownerUsername =
                      typeof repo.owner === "object"
                        ? (repo.owner as any).username
                        : repo.owner || "me";
                    const host = window.location.host;
                    if (cloneMethod === "SSH") {
                      return `git@${host}:${ownerUsername}/${repo.name}.git`;
                    }
                    return (
                      repo.cloneUrl ||
                      `${window.location.protocol}//${host}/git/${ownerUsername}/${repo.name}.git`
                    );
                  })()}
                  className="flex-1 bg-transparent px-2 py-1.5 text-xs font-mono outline-none text-gh-text select-all"
                />
                <button
                  onClick={() => {
                    const ownerUsername =
                      typeof repo.owner === "object"
                        ? (repo.owner as any).username
                        : repo.owner || "me";
                    const host = window.location.host;
                    const url =
                      cloneMethod === "SSH"
                        ? `git@${host}:${ownerUsername}/${repo.name}.git`
                        : repo.cloneUrl ||
                          `${window.location.protocol}//${host}/git/${ownerUsername}/${repo.name}.git`;
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

              <p className="text-[10px] text-gh-text-secondary mt-2 mb-4 leading-relaxed">
                {cloneMethod === "HTTPS" 
                  ? "Use Git or checkout with SVN using the web URL."
                  : "Use a password-protected SSH key."}
              </p>

              <button
                onClick={async () => {
                  try {
                    const { url } = await api.workspaces.start(
                      `codespace-${repo.id}`,
                      repo.id,
                    );
                    window.open(url, "_blank");
                  } catch (e) {
                    alert("Provisioning failed.");
                  }
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined !text-[16px]">
                  add_box
                </span>
                Create codespace on main
              </button>

              <div className="mt-3 grid grid-cols-1 gap-2 border-t border-gh-border pt-3">
                <button
                  onClick={() => {
                    const ownerUsername =
                      typeof repo.owner === "object"
                        ? (repo.owner as any).username
                        : repo.owner || "me";
                    const cloneUrl =
                      repo.cloneUrl ||
                      `${window.location.protocol}//${window.location.host}/git/${ownerUsername}/${repo.name}.git`;
                    const vscodeUri = `vscode://vscode.git/clone?url=${encodeURIComponent(
                      cloneUrl,
                    )}`;
                    window.location.href = vscodeUri;
                  }}
                  className="w-full py-2 bg-gh-bg text-gh-text rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-gh-border hover:bg-gh-bg-tertiary"
                >
                  <span className="material-symbols-outlined !text-[16px]">
                    open_in_new
                  </span>
                  Open with VS Code Desktop
                </button>

                <a
                  href={`${api.baseUrl}/repositories/${repo.id}/zipball?branch=${currentBranch}`}
                  download
                  className="w-full py-2 bg-gh-bg text-gh-text rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-gh-border hover:bg-gh-bg-tertiary"
                >
                  <span className="material-symbols-outlined !text-[16px]">
                    download
                  </span>
                  Download ZIP
                </a>
              </div>
            </div>
          </div>
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
              } : {
                message: "Project files synchronized with GitHub Hardware",
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
                      path: currentPath
                        ? `${currentPath}/${newFileName}`
                        : newFileName,
                      content: "// New file created with TrackCodex\n",
                      message: `Create ${newFileName}`,
                      branch: currentBranch,
                    });
                    // Refresh
                    const data = await api.repositories.getContents(
                      repo.id,
                      currentPath,
                      currentBranch,
                    );
                    setFiles(
                      data.map((item: any) => ({
                        name: item.name,
                        type:
                          item.type === "tree" || item.type === "dir"
                            ? "dir"
                            : "file",
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
                  <span className="material-symbols-outlined !text-[12px]">keyboard_arrow_up</span>
                  <span className="material-symbols-outlined !text-[12px]">keyboard_arrow_down</span>
                  to navigate
                </span>
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



