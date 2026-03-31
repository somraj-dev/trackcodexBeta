import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/infra/api";
import { Workspace, Repository } from "../../types";
import "../../styles/CreateWorkspaceNew.css";

const CreateWorkspaceView = () => {
  const navigate = useNavigate();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>("");
  const [projectName, setProjectName] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [includeReadme, setIncludeReadme] = useState("Yes, with a tutorial (for beginners)");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [includeGitignore, setIncludeGitignore] = useState("Yes (recommended)");
  const [description, setDescription] = useState("");
  const [forking, setForking] = useState("Allow only private forks");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingRepos, setIsLoadingRepos] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingRepos(true);
      try {
        const repoList = await api.repositories.list();
        setRepositories(repoList);
        if (repoList.length > 0) {
          setSelectedRepoId(repoList[0].id);
          setProjectName(repoList[0].name); // Default workspace name to repo name
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setIsLoadingRepos(false);
      }
    };
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!projectName || !selectedRepoId) {
      window.dispatchEvent(
        new CustomEvent("trackcodex-notification", {
          detail: {
            title: "Validation Error",
            message: "Workspace name and Repository are required",
            type: "error",
          },
        })
      );
      return;
    }

    setIsCreating(true);
    try {
      // Create a Workspace linked to the existing repository
      const payload: Partial<Workspace> = {
        name: projectName,
        description,
        visibility: isPrivate ? "private" : "public",
        repo: selectedRepoId,
      };

      const newWorkspace = await api.workspaces.create(payload);

      // Refresh the contribution heatmap cache to show the new activity immediately
      const { gitActivityService } = await import("../../services/git/gitActivityService");
      // Since we don't have user object in this component's top-level yet, but it's likely the current user
      gitActivityService.refresh(null); 

      window.dispatchEvent(
        new CustomEvent("trackcodex-notification", {
          detail: {
            title: "Success",
            message: `Workspace "${projectName}" created successfully!`,
            type: "success",
          },
        })
      );

      navigate(`/workspace/${newWorkspace.id}`);
    } catch (error) {
      console.error("Failed to create workspace", error);
      window.dispatchEvent(
        new CustomEvent("trackcodex-notification", {
          detail: {
            title: "Error",
            message: error instanceof Error ? error.message : "Failed to create repository",
            type: "error",
          },
        })
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="create-repo-container">
      <header className="create-repo-header">
        <h1>Create a new workspace</h1>
        <a href="/workspace/import" className="import-link">Connect workspace</a>
      </header>


      <div className="form-row">
        <div className="form-group flex-1">
          <label className="form-label" htmlFor="project-name">Workspace name<span className="required">*</span></label>
          <input 
            id="project-name" 
            type="text" 
            className="input-field" 
            value={projectName}
            placeholder="e.g., 'Phoenix Core'"
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>
        <div className="form-group flex-1">
          <label className="form-label" htmlFor="repo-select">Select Repository<span className="required">*</span></label>
          <select 
            id="repo-select" 
            className="select-field full-width"
            value={selectedRepoId}
            onChange={(e) => {
              const repoId = e.target.value;
              setSelectedRepoId(repoId);
              const repo = repositories.find(r => r.id === repoId);
              if (repo && !projectName) setProjectName(repo.name);
            }}
            disabled={isLoadingRepos}
          >
            {isLoadingRepos ? (
              <option value="" disabled>Loading repositories...</option>
            ) : repositories.length === 0 ? (
              <option value="" disabled>No repositories found</option>
            ) : (
              <>
                <option value="" disabled>Choose a repository...</option>
                {repositories.map(repo => (
                  <option key={repo.id} value={repo.id}>{repo.name}</option>
                ))}
              </>
            )}
          </select>
        </div>
      </div>

      <div className="form-group mt-4">
        <label className="form-label">Access level</label>
        <div className="access-level-group">
          <input 
            type="checkbox" 
            id="private-repo" 
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />
          <label htmlFor="private-repo" className="checkbox-label">Private workspace</label>
        </div>
        <p className="field-description mt-2">
          Uncheck to make this workspace public. Public workspaces typically contain open-source code and can be viewed by anyone.
        </p>
      </div>

      <div className="form-group mt-6">
        <label className="form-label" htmlFor="readme-select">Include a MaterialMe?</label>
        <select 
          id="readme-select" 
          className="select-field full-width"
          value={includeReadme}
          onChange={(e) => setIncludeReadme(e.target.value)}
        >
          <option>Yes, with a tutorial (for beginners)</option>
          <option>Yes, but empty</option>
          <option>No</option>
        </select>
      </div>

      <div className="form-group mt-4">
        <label className="form-label" htmlFor="default-branch">Default branch name</label>
        <input 
          id="default-branch" 
          type="text" 
          className="input-field full-width" 
          placeholder="e.g., 'main'" 
          value={defaultBranch}
          onChange={(e) => setDefaultBranch(e.target.value)}
        />
      </div>

      <div className="form-group mt-4">
        <label className="form-label" htmlFor="gitignore-select">Include .gitignore?</label>
        <select 
          id="gitignore-select" 
          className="select-field full-width"
          value={includeGitignore}
          onChange={(e) => setIncludeGitignore(e.target.value)}
        >
          <option>Yes (recommended)</option>
          <option>No</option>
        </select>
      </div>

      <div className="advanced-settings mt-8">
        <div 
          className="advanced-toggle" 
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span className={`transition-transform duration-300 advanced-toggle-icon ${showAdvanced ? 'rotate-180' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </span>
          Advanced settings
        </div>
        
        <div className={`advanced-content-wrapper ${showAdvanced ? 'open' : ''}`}>
          <div className="advanced-content">
            <div className="form-group">
              <label className="form-label" htmlFor="description">Description</label>
              <textarea 
                id="description" 
                className="input-field description-area" 
                value={description}
                placeholder="Context for contributors..."
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group mt-4">
              <label className="form-label" htmlFor="forking-select">Forking</label>
              <select 
                id="forking-select" 
                className="select-field full-width"
                value={forking}
                onChange={(e) => setForking(e.target.value)}
              >
                <option>Allow only private forks</option>
                <option>Allow public and private forks</option>
                <option>Disable forking</option>
              </select>
            </div>

          </div>
        </div>
      </div>

      <div className="actions mt-10 pt-6 border-t border-gh-border flex justify-end gap-4">
        <button className="btn-cancel" onClick={() => navigate(-1)}>Cancel</button>
        <button 
          className="btn-submit" 
          onClick={handleCreate}
          disabled={isCreating || isLoadingRepos}
        >
          {isCreating ? "Creating..." : "Create workspace"}
        </button>
      </div>
    </div>
  );
};

export default CreateWorkspaceView;



