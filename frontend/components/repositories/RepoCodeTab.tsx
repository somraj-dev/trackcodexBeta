import React, { useState, useEffect } from "react";
import { Repository } from "../../types";
import { api } from "../../services/infra/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import RepoCodeViewer from "./RepoCodeViewer";
import UniversalFileList from "../common/UniversalFileList";
import RepoAboutSidebar from "./RepoAboutSidebar";

interface RepoCodeTabProps {
  repo: Repository;
}

interface FileItem {
  name: string;
  type: "dir" | "file";
  commitVal: string;
  time: string;
  path: string;
}

interface Commit {
  id: string;
  sha: string;
  message: string;
  createdAt: string;
  author: {
    name: string;
    username: string;
    avatarUrl?: string;
  };
}

const RepoCodeTab: React.FC<RepoCodeTabProps> = ({ repo }) => {
  const [currentPath, setCurrentPath] = useState("");
  const [currentBranch, setCurrentBranch] = useState(repo.settings?.defaultBranch || "main");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<{ path: string; line?: number } | null>(null);
  const [readmeContent, setReadmeContent] = useState<string | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
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
      setLoading(true);
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
            const content = await api.repositories.getContent(repo.id, readme.path, currentBranch);
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
        const [branchData, tagData, commitData] = await Promise.all([
          api.repositories.getBranches(repo.id),
          api.repositories.getTags(repo.id),
          api.repositories.getCommits(repo.id, currentBranch),
        ]);
        setBranches(branchData || []);
        setTags(tagData || []);
        if (commitData && commitData.length > 0) {
          setLatestRepoCommit(commitData[0] as Commit);
        }
      } catch (err) {
        console.error("Failed to fetch meta", err);
      }
    };
    fetchMeta();
  }, [repo.id, currentBranch]);

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
        // Fallback to current path contents if specific recursive tree is not available
        const data = await api.repositories.getContents(repo.id, "", currentBranch);
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

  const isEmptyRepo = !loading && files.length === 0 && !currentPath;
  const host = "trackcodex.com";
  const ownerUsername = typeof repo.owner === 'object' ? (repo.owner as any).username : repo.owner || "me";
  const httpsUrl = `https://${host}/git/${ownerUsername}/${repo.name}.git`;
  const sshUrl = `git@${host}:${ownerUsername}/${repo.name}.git`;
  const activeCloneUrl = cloneMethod === "SSH" ? sshUrl : httpsUrl;

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-gh-text-secondary min-h-[50vh]">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold">Synchronizing File Tree...</p>
      </div>
    );
  }

  if (isEmptyRepo) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in py-2">
       {/* Cards */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="border border-gh-border rounded-lg p-5 bg-gh-bg">
            <div className="flex items-center gap-2 mb-3 text-gh-text font-bold">
               <span className="material-symbols-outlined !text-[20px] text-gh-text-secondary">computer</span>
               Start coding with Live Sync
            </div>
            <p className="text-[13px] text-gh-text-secondary mb-4 leading-relaxed">
               Add a README file and start coding in a secure, configurable, and dedicated development environment.
            </p>
            <button
               onClick={async () => {
                  try {
                    const { url } = await api.workspaces.start(`live-${repo.id}`, repo.id, { liveSync: true });
                    window.open(url, "_blank");
                  } catch (e) { alert("Initialization failed."); }
               }}
               className="px-4 py-1.5 bg-gh-bg-secondary hover:bg-gh-bg-tertiary border border-gh-border rounded-md text-xs font-bold text-gh-text transition-colors"
            >
               Create a Workspace
            </button>
         </div>

         <div className="border border-gh-border rounded-lg p-5 bg-gh-bg">
            <div className="flex items-center gap-2 mb-3 text-gh-text font-bold">
               <span className="material-symbols-outlined !text-[20px] text-gh-text-secondary">person_add</span>
               Add collaborators to this repository
            </div>
            <p className="text-[13px] text-gh-text-secondary mb-4 leading-relaxed">
               Search for people using their TrackCodex username or email address.
            </p>
            <button
               className="px-4 py-1.5 bg-gh-bg-secondary hover:bg-gh-bg-tertiary border border-gh-border rounded-md text-xs font-bold text-gh-text transition-colors"
            >
               Invite collaborators
            </button>
         </div>
       </div>

       {/* Quick Setup */}
       <div className="border border-gh-border rounded-lg bg-gh-bg overflow-hidden mt-2">
         <div className="bg-[#0d1626] border-b border-[#1f375c] p-5">
           <h3 className="font-bold text-[16px] text-white">
             Quick setup — if you’ve done this kind of thing before
           </h3>
           <div className="mt-3 flex items-center gap-[1px] flex-wrap md:flex-nowrap">
             <button className="flex items-center gap-2 px-3 py-1 bg-gh-bg-secondary border border-gh-border md:border-r-0 rounded-md md:rounded-r-none md:rounded-l-md text-xs font-bold text-gh-text hover:bg-gh-bg-tertiary">
                <span className="material-symbols-outlined !text-[16px]">desktop_windows</span>
                Set up in Desktop
             </button>
             <div className="flex text-xs font-bold border border-gh-border rounded-md overflow-hidden bg-transparent mb-2 md:mb-0 md:mx-2 mt-2 md:mt-0">
                <button
                  onClick={() => setCloneMethod("HTTPS")}
                  className={`px-3 py-1 ${cloneMethod === 'HTTPS' ? 'bg-[#1f6feb] text-white' : 'bg-gh-bg-secondary text-gh-text hover:bg-gh-bg-tertiary'}`}
                >HTTPS</button>
                <button
                  onClick={() => setCloneMethod("SSH")}
                  className={`px-3 py-1 border-l border-gh-border ${cloneMethod === 'SSH' ? 'bg-[#1f6feb] text-white' : 'bg-gh-bg-secondary text-gh-text hover:bg-gh-bg-tertiary'}`}
                >SSH</button>
             </div>
             
             <div className="flex-1 flex items-center border border-gh-border rounded-md overflow-hidden md:ml-1 mt-2 md:mt-0 w-full min-w-[200px]">
                <input
                   readOnly
                   value={activeCloneUrl}
                   className="flex-1 bg-black/30 px-3 py-1 text-[13px] font-mono outline-none text-gh-text-secondary select-all min-w-0"
                />
                <button
                   onClick={() => navigator.clipboard.writeText(activeCloneUrl)}
                   className="px-3 py-1 bg-gh-bg-secondary hover:bg-gh-bg-tertiary border-l border-gh-border flex items-center justify-center transition-colors text-gh-text-secondary hover:text-white"
                   title="Copy to clipboard"
                >
                   <span className="material-symbols-outlined !text-[14px]">content_copy</span>
                </button>
             </div>
           </div>
           
           <p className="text-[13px] text-gh-text-secondary mt-3">
             Get started by <button onClick={() => setIsCreatingFile(true)} className="text-[#3b82f6] hover:underline">creating a new file</button> or <button onClick={() => {
                 const input = document.createElement("input");
                 input.type = "file"; input.multiple = true;
                 input.onchange = async (e: any) => {
                    const filesList = e.target.files;
                    if (!filesList.length) return;
                    setIsCreatingFile(true); // Let user know it's "loading" somewhat
                 };
                 input.click();
             }} className="text-[#3b82f6] hover:underline">uploading an existing file</button>. We recommend every repository include a README, LICENSE, and .gitignore.
           </p>
         </div>

         <div className="p-5 border-b border-gh-border">
           <h4 className="font-bold text-[14px] text-gh-text mb-3">...or create a new repository on the command line</h4>
           <div className="bg-gh-bg-secondary border border-gh-border rounded-md flex relative overflow-hidden group">
             <pre className="p-4 text-[13px] font-mono text-gh-text-secondary leading-relaxed w-full overflow-x-auto">
{`echo "# ${repo.name}" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin ${activeCloneUrl}
git push -u origin main`}
             </pre>
             <button onClick={() => navigator.clipboard.writeText(`echo "# ${repo.name}" >> README.md\ngit init\ngit add README.md\ngit commit -m "first commit"\ngit branch -M main\ngit remote add origin ${activeCloneUrl}\ngit push -u origin main`)} className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-gh-bg-tertiary text-gh-text-secondary transition-opacity opacity-0 group-hover:opacity-100 border border-transparent hover:border-gh-border bg-gh-bg-secondary shadow-md">
                <span className="material-symbols-outlined !text-[16px]">content_copy</span>
             </button>
           </div>
         </div>

         <div className="p-5">
           <h4 className="font-bold text-[14px] text-gh-text mb-3">...or push an existing repository from the command line</h4>
           <div className="bg-gh-bg-secondary border border-gh-border rounded-md flex relative overflow-hidden group">
             <pre className="p-4 text-[13px] font-mono text-gh-text-secondary leading-relaxed w-full overflow-x-auto">
{`git remote add origin ${activeCloneUrl}
git branch -M main
git push -u origin main`}
             </pre>
             <button onClick={() => navigator.clipboard.writeText(`git remote add origin ${activeCloneUrl}\ngit branch -M main\ngit push -u origin main`)} className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-gh-bg-tertiary text-gh-text-secondary transition-opacity opacity-0 group-hover:opacity-100 border border-transparent hover:border-gh-border bg-gh-bg-secondary shadow-md">
                <span className="material-symbols-outlined !text-[16px]">content_copy</span>
             </button>
           </div>
         </div>
       </div>

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
                  htmlFor="new-file-name-empty"
                  className="text-xs font-medium uppercase text-gh-text-secondary"
                >
                  File Name
                </label>
                <input
                  id="new-file-name-empty"
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g. README.md"
                  className="w-full bg-gh-bg border border-gh-border rounded-md px-3 py-2 text-sm text-gh-text focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  autoFocus
                />
              </div>
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
                      path: newFileName,
                      content: newFileName.toLowerCase() === 'readme.md' ? `# ${repo.name}\n` : "// New file\n",
                      message: `Create ${newFileName}`,
                      branch: currentBranch,
                    });
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
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* GitHub Style Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-y-3 mb-4">
        <div className="flex items-center gap-2">
          {/* Branch Switcher */}
          <div className="relative group/branch">
            <button
              onClick={() => setShowBranchMenu(!showBranchMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded-md text-xs font-bold text-gh-text hover:bg-[#30363d] transition-all"
            >
              <span className="material-symbols-outlined !text-[16px] text-gh-text-secondary">
                account_tree
              </span>
              {currentBranch}
              <span className="material-symbols-outlined !text-[14px] text-gh-text-secondary opacity-70">
                arrow_drop_down
              </span>
            </button>

            {showBranchMenu && (
              <div className="absolute left-0 mt-2 w-72 bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl z-50 py-2">
                <div className="px-3 py-2 border-b border-[#30363d] flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gh-text">
                    Switch branches/tags
                  </span>
                  <button onClick={() => setShowBranchMenu(false)} className="text-gh-text-secondary hover:text-gh-text">
                    <span className="material-symbols-outlined !text-[16px]">close</span>
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto pt-1">
                  {branches.map((b) => (
                    <button
                      key={b}
                      onClick={() => {
                        setCurrentBranch(b);
                        setShowBranchMenu(false);
                        setCurrentPath("");
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-gh-text hover:bg-[#2f81f7] hover:text-white transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                         <span className="material-symbols-outlined !text-[16px] opacity-60">
                            {b === (repo.settings?.defaultBranch || "main") ? 'star' : 'account_tree'}
                         </span>
                         {b}
                      </div>
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

          <div className="flex items-center gap-4 text-xs font-bold text-gh-text-secondary ml-2">
            <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <span className="material-symbols-outlined !text-[18px] opacity-70">account_tree</span>
              <span>{branches.length} <span className="font-normal opacity-70">Branches</span></span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <span className="material-symbols-outlined !text-[18px] opacity-70">sell</span>
              <span>{tags.length} <span className="font-normal opacity-70">Tags</span></span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-grow justify-end">
           <div className="relative w-full max-w-[240px] group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined !text-[16px] text-gh-text-secondary group-focus-within:text-primary transition-colors">search</span>
              <input 
                type="text" 
                placeholder="Go to file"
                onClick={openGoToFile}
                readOnly
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-md pl-9 pr-8 py-1.5 text-xs text-gh-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gh-text-secondary bg-[#161b22] px-1.5 py-0.5 rounded border border-[#30363d] opacity-80">t</span>
           </div>

           {/* Add File Dropdown */}
           <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded-md text-xs font-bold text-gh-text hover:bg-[#30363d] transition-all"
            >
              Add file
              <span className="material-symbols-outlined !text-[14px] text-gh-text-secondary opacity-70">
                arrow_drop_down
              </span>
            </button>

            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl z-50 py-1">
                <button
                  onClick={() => {
                    setIsCreatingFile(true);
                    setShowAddMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-gh-text hover:bg-[#2f81f7] hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined !text-[16px]">add</span>
                  Create new file
                </button>
                <button
                   onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file"; input.multiple = true;
                    input.onchange = async (e: any) => { setShowAddMenu(false); };
                    input.click();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-gh-text hover:bg-[#2f81f7] hover:text-white transition-colors flex items-center gap-2 border-t border-[#30363d]"
                >
                  <span className="material-symbols-outlined !text-[16px]">upload</span>
                  Upload files
                </button>
              </div>
            )}
          </div>

          <div className="relative group/code">
            <button className="bg-[#238636] text-white px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 hover:bg-[#2ea043] transition-all shadow-sm">
              <span className="material-symbols-outlined !text-[16px]">code</span>
              Code
              <span className="material-symbols-outlined !text-[14px] opacity-80">
                arrow_drop_down
              </span>
            </button>

            <div className="absolute right-0 top-full mt-2 w-80 bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl p-4 hidden group-hover/code:block z-50">
               <div className="flex items-center gap-2 border-b border-[#30363d] pb-2 mb-3">
                  <span className="material-symbols-outlined text-gh-text-secondary !text-[18px]">terminal</span>
                  <h4 className="font-bold text-xs">Clone</h4>
               </div>
               
               <div className="flex items-center gap-1 mb-3 bg-[#0d1117] p-1 rounded-lg border border-[#30363d]">
                <button
                  onClick={() => setCloneMethod("HTTPS")}
                  className={`flex-1 text-[11px] font-bold py-1 rounded-md transition-all ${
                    cloneMethod === "HTTPS"
                      ? "bg-[#21262d] text-white border border-[#30363d]"
                      : "text-gh-text-secondary hover:text-gh-text"
                  }`}
                >HTTPS</button>
                <button
                  onClick={() => setCloneMethod("SSH")}
                  className={`flex-1 text-[11px] font-bold py-1 rounded-md transition-all ${
                    cloneMethod === "SSH"
                      ? "bg-[#21262d] text-white border border-[#30363d]"
                      : "text-gh-text-secondary hover:text-gh-text"
                  }`}
                >SSH</button>
              </div>

              <div className="flex items-center gap-0 border border-[#30363d] rounded-md overflow-hidden bg-[#0d1117] mb-4">
                <input
                  readOnly
                  value={activeCloneUrl}
                  className="flex-1 bg-transparent px-3 py-1.5 text-[11px] font-mono outline-none text-gh-text selection:bg-primary/30"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(activeCloneUrl)}
                  className="px-2.5 py-1.5 hover:bg-[#21262d] border-l border-[#30363d] text-gh-text-secondary hover:text-gh-text"
                  title="Copy to clipboard"
                >
                  <span className="material-symbols-outlined !text-[14px]">content_copy</span>
                </button>
              </div>

               <div className="space-y-2 border-t border-[#30363d] pt-3">
                  <button
                    onClick={async () => {
                      try {
                        const { url } = await api.workspaces.start(`live-${repo.id}`, repo.id, { liveSync: true });
                        window.open(url, "_blank");
                      } catch (e) { alert("Initialization failed."); }
                    }}
                    className="w-full py-1.5 bg-[#21262d] text-gh-text text-xs font-bold rounded-md hover:bg-[#30363d] transition-colors flex items-center justify-center gap-2 border border-[#30363d]"
                  >
                    <span className="material-symbols-outlined !text-[18px] text-amber-500">sync_saved_locally</span>
                    Open with Live Sync
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const { url } = await api.workspaces.start(`codespace-${repo.id}`, repo.id);
                        window.open(url, "_blank");
                      } catch (e) { alert("Provisioning failed."); }
                    }}
                    className="w-full py-1.5 bg-[#238636] text-white text-xs font-bold rounded-md hover:bg-[#2ea043] transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span className="material-symbols-outlined !text-[18px]">add_box</span>
                    Create codespace on {currentBranch}
                  </button>
                  <a
                    href={`${api.baseUrl}/repositories/${repo.id}/zipball?branch=${currentBranch}`}
                    download
                    className="w-full py-1.5 bg-[#21262d] text-gh-text text-xs font-bold rounded-md hover:bg-[#30363d] transition-colors flex items-center justify-center gap-2 border border-[#30363d]"
                  >
                    <span className="material-symbols-outlined !text-[18px]">download</span>
                    Download ZIP
                  </a>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-sm mb-3">
             <button
               onClick={() => setCurrentPath("")}
               className={`hover:text-primary transition-colors font-semibold ${!currentPath ? 'text-gh-text' : 'text-gh-text-secondary'}`}
             >
               {repo.name}
             </button>
             {currentPath && currentPath.split("/").map((part, idx, arr) => (
               <React.Fragment key={idx}>
                 <span className="text-gh-text-secondary opacity-40">/</span>
                 <button
                   onClick={() => setCurrentPath(arr.slice(0, idx + 1).join("/"))}
                   className={`hover:text-primary transition-colors ${idx === arr.length - 1 ? 'text-gh-text font-semibold' : 'text-gh-text-secondary'}`}
                 >
                   {part}
                 </button>
               </React.Fragment>
             ))}
          </div>

          {selectedFile ? (
            <div className="h-[650px] mb-6 rounded-lg overflow-hidden border border-[#30363d]">
              <RepoCodeViewer
                repoId={repo.id}
                path={selectedFile.path}
                initialLine={selectedFile.line}
                onClose={() => setSelectedFile(null)}
              />
            </div>
          ) : (
            <>
              <UniversalFileList
                files={files}
                onFileClick={handleFileClick}
                latestCommit={latestRepoCommit ? {
                  message: latestRepoCommit.message,
                  author: latestRepoCommit.author?.username || latestRepoCommit.author?.name || (repo.owner as any)?.username || "trackcodex",
                  time: latestRepoCommit.createdAt ? new Date(latestRepoCommit.createdAt).toLocaleDateString() : "recently",
                  avatar: latestRepoCommit.author?.avatarUrl || "https://github.com/github.png",
                  count: String(repo.commits_count || branches.length * 2 + 5), // Mock count if not available
                  sha: latestRepoCommit.sha || latestRepoCommit.id,
                } : {
                  message: "Initial commit via TrackCodex",
                  author: (repo.owner as any)?.username || "trackcodex",
                  time: "recently",
                  avatar: "https://github.com/github.png",
                }}
              />

              {/* Readme Preview Section */}
              <div className="mt-6 border border-[#30363d] rounded-lg overflow-hidden bg-[#0d1117]">
                <div className="border-b border-[#30363d] px-4 py-2.5 flex items-center justify-between sticky top-0 bg-[#0d1117] z-10 shadow-sm">
                  <div className="flex items-center gap-2.5 text-xs font-bold text-gh-text uppercase tracking-wider">
                    <span className="material-symbols-outlined !text-[18px] opacity-70">list</span>
                    README.md
                  </div>
                  <button className="text-gh-text-secondary hover:text-gh-text">
                     <span className="material-symbols-outlined !text-[18px]">edit</span>
                  </button>
                </div>
                <div className="p-10 prose prose-invert max-w-none text-gh-text selection:bg-primary/30 min-h-[200px]">
                  {readmeContent ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {readmeContent}
                    </ReactMarkdown>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 opacity-60">
                       <span className="material-symbols-outlined !text-[48px] mb-2">menu_book</span>
                       <p className="text-sm font-medium">{repo.description || "No description provided."}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar (Desktop only) */}
        {!selectedFile && (
          <div className="w-full lg:w-[320px] shrink-0">
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
