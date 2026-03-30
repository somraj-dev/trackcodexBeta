import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Repository } from "../../types";
import { projectService, ProjectListItem } from "../../services/infra/projectService";
import { CreateProjectModal } from "../modals/CreateProjectModal";
import LinkProjectModal from "../modals/LinkProjectModal";

interface RepoProjectsTabProps {
  repo: Repository;
}

const RepoProjectsTab: React.FC<RepoProjectsTabProps> = ({ repo }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("is:open");
  
  // Modals
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showLinkProjectModal, setShowLinkProjectModal] = useState(false);

  const repoUrl = `https://github.com/${repo.owner?.username || repo.owner?.name}/${repo.name}`;

  useEffect(() => {
    fetchProjects();
  }, [repo.id]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const allProjects = await projectService.listProjects();
      // In a real app, the API would support filtering by repoId or repoUrl.
      // Here we filter locally for the demonstration.
      const associatedProjects = allProjects.filter(p => 
        p.repoUrl === repoUrl || 
        (p.repoOwner === repo.owner?.username && p.repoName === repo.name)
      );
      setProjects(associatedProjects);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkProject = async (project: ProjectListItem) => {
    try {
      await projectService.updateProject(project.id, {
        repoUrl: repoUrl,
        repoOwner: repo.owner?.username,
        repoName: repo.name
      });
      await fetchProjects();
    } catch (err) {
      console.error("Failed to link project", err);
      throw err;
    }
  };

  const handleCreateProject = async (p: any) => {
    // This is called by CreateProjectModal
    try {
      const result = await projectService.createProject({
        name: p.name,
        repoUrl: repoUrl,
        repoOwner: repo.owner?.username,
        repoName: repo.name,
        framework: p.framework
      });
      await fetchProjects();
      setShowNewProjectModal(false);
      return result;
    } catch (err) {
      console.error("Failed to create project", err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gh-text-secondary">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold animate-pulse">Synchronizing Projects...</p>
      </div>
    );
  }

  const filteredProjects = projects.filter(p => {
    const query = searchQuery.toLowerCase();
    if (query.includes("is:open")) {
      return p.status !== "failed"; // Simple heuristic for "open"
    }
    return p.name.toLowerCase().includes(query);
  });

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 p-0 sm:p-4">
      {/* Top Bar - Matching Mockup */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:flex-1 sm:max-w-2xl relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gh-text-secondary group-focus-within:text-primary transition-colors !text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full bg-gh-bg-secondary border border-gh-border rounded-md pl-10 pr-4 py-1.5 text-sm text-gh-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-gh-text-tertiary"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowLinkProjectModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 bg-[#21262d] border border-[#30363d] rounded-md text-sm font-bold text-gh-text hover:bg-[#30363d] hover:border-[#8b949e] transition-all"
          >
            <span className="material-symbols-outlined !text-[18px]">link</span>
            Link a project
          </button>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 bg-[#238636] hover:bg-[#2ea043] border border-transparent rounded-md text-sm font-bold text-white shadow-sm transition-all"
          >
            <span className="material-symbols-outlined !text-[18px]">add</span>
            New project
          </button>
        </div>
      </div>

      {/* Projects List or Empty State */}
      <div className="min-h-[400px] border border-gh-border rounded-xl bg-gh-bg-secondary flex flex-col overflow-hidden">
        {filteredProjects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-300">
            <div className="size-16 rounded-2xl bg-gh-bg-tertiary flex items-center justify-center mb-6 border border-gh-border shadow-inner">
              <span className="material-symbols-outlined !text-[40px] text-gh-text-secondary opacity-50">
                table_chart
              </span>
            </div>
            <h3 className="text-xl font-bold text-gh-text mb-2">
              Provide quick access to relevant projects.
            </h3>
            <p className="max-w-md mx-auto text-gh-text-secondary mb-8">
              Add projects to view them here. Managed projects allow you to deploy and manage your applications directly from TrackCodex.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowLinkProjectModal(true)}
                className="px-6 py-2 bg-gh-bg-tertiary border border-gh-border rounded-lg text-sm font-bold text-gh-text hover:border-primary transition-all"
              >
                Link existing project
              </button>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                Create new project
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gh-border">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="flex items-center justify-between p-6 hover:bg-gh-bg-tertiary transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-5">
                  <div 
                    className="size-12 rounded-xl flex items-center justify-center text-2xl font-bold text-white border border-gh-border shadow-sm group-hover:scale-105 transition-transform overflow-hidden"
                    style={{ backgroundColor: project.logoBg || 'var(--primary-color)' }}
                  >
                    {project.logo ? (
                      <span className="material-symbols-outlined">{project.logo}</span>
                    ) : project.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold text-gh-text group-hover:text-primary transition-colors">
                        {project.name}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        project.status === 'ready' 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                          : project.status === 'building'
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gh-text-secondary">
                      <span className="flex items-center gap-1 font-mono">
                         <span className="material-symbols-outlined !text-[14px]">link</span>
                         {project.domain || `${project.id}.trackcodex.com`}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline">Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex -space-x-2">
                     {[1, 2].map(i => (
                       <div key={i} className="size-7 rounded-full border-2 border-gh-bg-secondary bg-gh-border flex items-center justify-center text-[10px] font-bold text-gh-text-tertiary shadow-sm">
                         {String.fromCharCode(64 + i)}
                       </div>
                     ))}
                  </div>
                  <span className="material-symbols-outlined text-gh-text-tertiary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                    chevron_right
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal 
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onDeploy={handleCreateProject}
      />

      <LinkProjectModal 
        isOpen={showLinkProjectModal}
        onClose={() => setShowLinkProjectModal(false)}
        onLink={handleLinkProject}
        currentRepoUrl={repoUrl}
      />
    </div>
  );
};

export default RepoProjectsTab;
