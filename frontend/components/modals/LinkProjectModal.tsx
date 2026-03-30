import React, { useState, useEffect } from "react";
import { projectService, ProjectListItem } from "../../services/infra/projectService";

interface LinkProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLink: (project: ProjectListItem) => Promise<void>;
  currentRepoUrl: string;
}

const LinkProjectModal: React.FC<LinkProjectModalProps> = ({ 
  isOpen, 
  onClose, 
  onLink,
  currentRepoUrl 
}) => {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [linkingId, setLinkingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const allProjects = await projectService.listProjects();
      // Filter out projects already linked to this repo
      const unlinkedProjects = allProjects.filter(p => p.repoUrl !== currentRepoUrl);
      setProjects(unlinkedProjects);
    } catch (err) {
      console.error("Failed to fetch projects for linking", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async (project: ProjectListItem) => {
    setLinkingId(project.id);
    try {
      await onLink(project);
      onClose();
    } catch (err) {
      console.error("Failed to link project", err);
      alert("Failed to link project. Please try again.");
    } finally {
      setLinkingId(null);
    }
  };

  if (!isOpen) return null;

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
      <div className="bg-[#0d1117] border border-[#30363d] rounded-xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Link a project</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-[#30363d] rounded-md transition-colors text-[#8b949e]"
          >
            <span className="material-symbols-outlined !text-[20px]">close</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[#30363d] bg-[#161b22]">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e] !text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search projects by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-md pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#2f81f7] placeholder:text-[#484f58]"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[300px]">
          {loading ? (
            <div className="h-full flex items-center justify-center py-20">
              <div className="size-6 border-2 border-[#2f81f7] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-60">
              <span className="material-symbols-outlined !text-[48px] mb-2 text-[#484f58]">
                layers_clear
              </span>
              <p className="text-sm font-medium text-white">No projects found</p>
              <p className="text-xs text-[#8b949e] mt-1">Try another search or create a new project</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-1">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#21262d] transition-colors group cursor-pointer"
                  onClick={() => handleLink(project)}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="size-10 rounded-md flex items-center justify-center text-lg font-bold text-white border border-[#30363d]"
                      style={{ backgroundColor: project.logoBg || '#1f6feb' }}
                    >
                      {project.logo || project.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white group-hover:text-[#2f81f7] transition-colors">
                        {project.name}
                      </span>
                      <span className="text-xs text-[#8b949e] truncate max-w-[200px]">
                        {project.domain || "no-domain.trackcodex.com"}
                      </span>
                    </div>
                  </div>
                  <button
                    disabled={linkingId === project.id}
                    className="px-3 py-1.5 bg-[#238636] hover:bg-[#2ea043] disabled:bg-[#238636]/50 text-white text-xs font-bold rounded-md flex items-center gap-2 transition-all opacity-0 group-hover:opacity-100"
                  >
                    {linkingId === project.id ? (
                      <div className="size-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span className="material-symbols-outlined !text-[14px]">link</span>
                        Link
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#30363d] bg-[#0d1117] flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-[#c9d1d9] hover:bg-[#30363d] rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkProjectModal;
