import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWorkspaces } from "../../hooks/useWorkspaces";
import { api } from "../../services/infra/api";
import SearchableDropdown from "../../components/common/SearchableDropdown";
import "../../styles/CreateWorkspaceNew.css";

const ConnectWorkspaceView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workspaces, loading: workspacesLoading } = useWorkspaces();
  const [sourceUrl, setSourceUrl] = useState("");
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [repoName, setRepoName] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [description, setDescription] = useState("");
  const [forking, setForking] = useState("Allow only private forks");
  const [language, setLanguage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(true); // Keeping it open based on screenshot

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl || !projectName || !repoName) return;

    setIsSubmitting(true);
    try {
      const result = await api.repositories.importRepo({
        sourceUrl,
        name: repoName,
        visibility: isPrivate ? "PRIVATE" : "PUBLIC",
        ownerId: user?.id,
        settings: {
          projectName,
          description,
          forking,
          language
        }
      });

      window.dispatchEvent(
        new CustomEvent("trackcodex-notification", {
          detail: {
            title: "Connection Started",
            message: `Connecting workspace for ${repoName} from ${sourceUrl}...`,
            type: "success",
          },
        })
      );
      if (result && result.id) {
        navigate(`/workspace/${result.id}`);
      } else {
        navigate("/workspaces");
      }
    } catch (err) {
      console.error("Failed to import repository:", err);
      window.dispatchEvent(
        new CustomEvent("trackcodex-notification", {
          detail: {
            title: "Import Failed",
            message: "Failed to connect workspace. Please check the URL.",
            type: "error",
          },
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-repo-container import-repo-wide">
      <header className="create-repo-header">
        <h1>Import existing code</h1>
        <a href="/workspace/new" className="import-link">Create new workspace</a>
      </header>

      <form onSubmit={handleSubmit}>
        {/* Old Repository Section */}
        <section className="mb-10">
          <h2 className="text-[16px] font-semibold mb-6">Old workspace</h2>
          
          <div className="form-group-horizontal">
            <label className="form-label" htmlFor="source-url">URL<span className="required">*</span></label>
            <input 
              id="source-url" 
              type="text" 
              className="input-field" 
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group-horizontal mt-2">
            <div className="form-label" /> {/* Spacing */}
            <div className="checkbox-wrapper">
              <input 
                type="checkbox" 
                id="requires-auth" 
                checked={requiresAuth}
                onChange={(e) => setRequiresAuth(e.target.checked)}
              />
              <label htmlFor="requires-auth" className="text-[14px]">Requires authorization</label>
            </div>
          </div>
        </section>

        {/* New Repository Section */}
        <section className="mb-8 border-t border-gh-border pt-8">
          <h2 className="text-[16px] font-semibold mb-6">New workspace</h2>


          <div className="form-group-horizontal mt-2">
            <label className="form-label" htmlFor="project-name">Workspace name<span className="required">*</span></label>
            <input 
              id="project-name" 
              type="text" 
              className="input-field" 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </div>

          <div className="form-group-horizontal mt-2">
            <label className="form-label" htmlFor="repo-name">Existing workspace<span className="required">*</span></label>
            <div className="flex-1">
              <SearchableDropdown
                options={workspaces.map(ws => ({
                  id: ws.id,
                  name: ws.name,
                  subtitle: `${ws.status} • ${ws.runtime || 'Container'}`
                }))}
                placeholder="Search or select a workspace..."
                value={repoName}
                onChange={(val) => setRepoName(val)}
                isLoading={workspacesLoading}
              />
            </div>
          </div>

          <div className="form-group-horizontal mt-4">
            <label className="form-label">Access level</label>
            <div className="checkbox-wrapper">
              <input 
                type="checkbox" 
                id="private-repo" 
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              <label htmlFor="private-repo" className="checkbox-label text-[14px]">Private workspace</label>
            </div>
          </div>
          
          <div className="form-group-horizontal">
            <div className="form-label" />
            <p className="field-description description-wide">
              Uncheck to make this workspace public. Public workspaces typically contain open-source code and can be viewed by anyone.
            </p>
          </div>
        </section>

        {/* Advanced Settings */}
        <div className="advanced-settings-container mt-8 border-t border-gh-border pt-6">
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
            <div className="advanced-content content-no-pad pt-6">
              
              <div className="form-group-horizontal mt-4">
                <label className="form-label" htmlFor="description">Description</label>
                <textarea 
                  id="description" 
                  className="input-field description-area" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group-horizontal mt-4">
                <label className="form-label" htmlFor="forking-select">Forking</label>
                <select 
                  id="forking-select" 
                  className="select-field"
                  value={forking}
                  onChange={(e) => setForking(e.target.value)}
                >
                  <option>Allow only private forks</option>
                  <option>Allow public and private forks</option>
                  <option>Disable forking</option>
                </select>
              </div>

              <div className="form-group-horizontal mt-4">
                <label className="form-label" htmlFor="language-select">Language</label>
                <select 
                  id="language-select" 
                  className="select-field"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="">Select language...</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                </select>
              </div>

            </div>
          </div>
        </div>

        <div className="actions flex-end mt-10">
          <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>Cancel</button>
          <button 
            type="submit"
            className="btn-submit" 
            disabled={isSubmitting || !sourceUrl || !projectName || !repoName}
          >
            {isSubmitting ? "Connecting..." : "Connect workspace"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConnectWorkspaceView;
