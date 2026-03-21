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
    default:
      return "draft";
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
        <div className="bg-gh-bg-secondary p-3 text-sm text-gh-text-secondary flex items-center gap-3 border-b border-gh-border">
          <div className="flex items-center gap-2">
            {latestCommit.avatar && (
              <img
                src={latestCommit.avatar}
                alt="Avatar"
                className="w-5 h-5 rounded-full"
              />
            )}
            <span className="text-gh-text font-bold">
              {latestCommit.author}
            </span>
          </div>
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="truncate hover:text-primary cursor-pointer hover:underline">
              {latestCommit.message}
            </span>
            {latestCommit.sha && (
              <span className="text-[10px] font-mono bg-gh-bg-tertiary px-1.5 py-0.5 rounded border border-gh-border text-gh-text-tertiary">
                {latestCommit.sha.substring(0, 7)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-gh-text-secondary whitespace-nowrap">
              {latestCommit.time}
            </span>
            {latestCommit.count && (
              <div className="text-gh-text-secondary font-mono text-xs flex items-center gap-1 hover:text-primary cursor-pointer">
                <span className="material-symbols-outlined !text-[14px]">
                  history
                </span>
                <span className="font-bold">{latestCommit.count}</span>
                <span className="text-[10px] opacity-60 ml-0.5">commits</span>
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
            className="flex items-center px-4 py-2 hover:bg-gh-bg-secondary group transition-colors cursor-pointer"
          >
            <div className="w-[240px] flex items-center gap-3 min-w-[200px]">
              <span
                className={`material-symbols-outlined !text-[18px] ${
                  file.type === "dir"
                    ? "text-primary"
                    : "text-gh-text-secondary"
                }`}
              >
                {file.icon || getFileIcon(file.name, file.type)}
              </span>
              <span className="text-gh-text text-sm hover:text-primary hover:underline truncate">
                {file.name}
              </span>
            </div>
            <div className="flex-1 truncate px-4">
              <span className="text-gh-text-secondary text-sm truncate hover:text-primary hover:underline cursor-pointer">
                {file.commitVal}
              </span>
            </div>
            <div className="w-[120px] text-right text-gh-text-secondary text-sm whitespace-nowrap flex items-center justify-end gap-2">
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(file.path);
                  }}
                  title="Copy path"
                  className="p-1 hover:bg-gh-bg-tertiary rounded transition-colors"
                >
                  <span className="material-symbols-outlined !text-[16px]">content_copy</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const permalink = `${window.location.origin}/repo/${window.location.pathname.split('/')[2]}/blob/main/${file.path}`;
                    navigator.clipboard.writeText(permalink);
                  }}
                  title="Copy permalink"
                  className="p-1 hover:bg-gh-bg-tertiary rounded transition-colors"
                >
                  <span className="material-symbols-outlined !text-[16px]">link</span>
                </button>
              </div>
              <span>{file.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UniversalFileList;


