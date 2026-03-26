import React from "react";

export interface FileItem {
  name: string;
  type: "dir" | "file";
  commitVal: string;
  time: string;
  icon?: string;
  path: string;
}

export interface UniversalFileListProps {
  files: FileItem[];
  onFileClick?: (file: FileItem) => void;
  currentPath?: string;
  latestCommit?: {
    message: string;
    author: string;
    time: string;
    avatar?: string;
    count?: string;
    sha?: string;
  };
}

const getFileIcon = (name: string, type: "dir" | "file") => {
  if (type === "dir") return "folder";
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "md":
    case "txt":
      return "description";
    case "js":
    case "ts":
    case "jsx":
    case "tsx":
    case "py":
    case "go":
    case "rb":
    case "java":
    case "cpp":
    case "c":
      return "code";
    case "json":
    case "yaml":
    case "yml":
    case "toml":
      return "settings_input_component";
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
      return "image";
    case "css":
    case "scss":
    case "less":
      return "palette";
    case "html":
      return "html";
    case "pdf":
      return "picture_as_pdf";
    case "zip":
    case "tar":
    case "gz":
      return "inventory_2";
    default:
      return "description";
  }
};

const UniversalFileList: React.FC<UniversalFileListProps> = ({
  files,
  onFileClick,
  latestCommit,
}) => {
  return (
    <div className="border border-gh-border rounded-md overflow-hidden bg-gh-bg">
      {/* Table Header / Latest Commit Info */}
      {latestCommit && (
        <div className="bg-[#161b22] p-3 text-sm text-gh-text-secondary flex items-center justify-between gap-3 border-b border-gh-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0">
              {latestCommit.avatar ? (
                <img
                  src={latestCommit.avatar}
                  alt="Avatar"
                  className="w-6 h-6 rounded-full border border-gh-border"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gh-bg-tertiary border border-gh-border flex items-center justify-center">
                  <span className="material-symbols-outlined !text-[14px]">person</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-gh-text font-bold hover:text-primary cursor-pointer hover:underline shrink-0">
                {latestCommit.author}
              </span>
              <span className="truncate hover:text-primary cursor-pointer hover:underline text-gh-text">
                {latestCommit.message}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 overflow-hidden">
            {latestCommit.sha && (
              <span className="text-[11px] font-mono text-gh-text-tertiary hover:text-primary cursor-pointer hidden sm:block">
                {latestCommit.sha.substring(0, 7)}
              </span>
            )}
            <span className="text-gh-text-secondary whitespace-nowrap text-xs">
              {latestCommit.time}
            </span>
            {latestCommit.count && (
              <div className="text-gh-text-secondary font-bold text-xs flex items-center gap-1 hover:text-primary cursor-pointer border-l border-gh-border pl-4 ml-2">
                <span className="material-symbols-outlined !text-[16px]">
                  history
                </span>
                <span>{latestCommit.count}</span>
                <span className="font-normal opacity-60 ml-0.5 hidden md:inline">commits</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* File List */}
      <div className="divide-y divide-gh-border">
        {files.map((file, idx) => (
          <div
            key={idx}
            onClick={() => onFileClick && onFileClick(file)}
            className="flex items-center px-4 py-[8px] hover:bg-[#161b22] group transition-colors cursor-pointer"
          >
            {/* File Icon and Name */}
            <div className="w-1/3 min-w-[140px] flex items-center gap-3 pr-2">
              <span
                className={`material-symbols-outlined !text-[18px] shrink-0 ${
                  file.type === "dir"
                    ? "text-[#7d8590]"
                    : "text-[#7d8590]"
                }`}
              >
                {file.type === "dir" ? "folder" : getFileIcon(file.name, file.type)}
              </span>
              <span className="text-gh-text text-sm hover:text-primary hover:underline truncate">
                {file.name}
              </span>
            </div>

            {/* Commit Message */}
            <div className="flex-1 truncate px-2 hidden md:block">
              <span className="text-[#8b949e] text-sm truncate hover:text-primary hover:underline cursor-pointer">
                {file.commitVal}
              </span>
            </div>

            {/* Time and Actions */}
            <div className="w-[120px] text-right text-[#8b949e] text-xs whitespace-nowrap flex items-center justify-end gap-3 shrink-0">
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(file.path);
                  }}
                  title="Copy path"
                  className="p-1 hover:bg-gh-bg-tertiary rounded transition-colors text-gh-text-tertiary hover:text-gh-text"
                >
                  <span className="material-symbols-outlined !text-[14px]">content_copy</span>
                </button>
              </div>
              <span className="shrink-0">{file.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UniversalFileList;


