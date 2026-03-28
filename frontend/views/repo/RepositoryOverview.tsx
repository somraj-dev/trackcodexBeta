import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/infra/api";
import { Repository } from "../../types";
import { MOCK_REPOS, MOCK_REPO_FILES } from "../../constants";
import Spinner from "../../components/ui/Spinner";
import "../../styles/WorkspaceOverview.css"; // Reuse the same premium styles

const RepositoryOverview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [repo, setRepo] = useState<Repository | null>(null);
  const [contents, setContents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readme, setReadme] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        // Fetch Repository Metadata
        const repoData = await api.repositories.get(id);
        setRepo(repoData);

        // Fetch Contents
        try {
          const contentData = await api.repositories.getContents(id);
          setContents(contentData || []);
        } catch (repoErr) {
          console.warn("Repo contents fetch failed, using mocks:", repoErr);
          setContents(MOCK_REPO_FILES);
        }

        // Fetch README.md
        try {
          const readmeData = await api.repositories.getContent(id, "README.md");
          if (readmeData && readmeData.content) {
            setReadme(atob(readmeData.content));
          }
        } catch (e) {
          console.log("No README.md found via API");
        }
      } catch (err) {
        console.error("Repository API failed, checking mocks:", err);
        const mockRepo = MOCK_REPOS.find(r => r.id === id);
        if (mockRepo) {
          setRepo(mockRepo);
          setContents(MOCK_REPO_FILES);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="workspace-overview-loading">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!repo) {
    return (
      <div className="workspace-overview-error">
        <h2>Repository not found</h2>
        <button onClick={() => navigate("/repositories")}>Back to Repositories</button>
      </div>
    );
  }

  return (
    <div className="workspace-overview-container">
      {/* Header Section - Exactly same as Workspace */}
      <header className="overview-header">
        <div className="header-breadcrumbs">
          <span className="breadcrumb-owner">{typeof repo.owner === 'object' ? (repo.owner as any).username : (repo.owner || "trackcodex")}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-repo">{repo.name}</span>
          <span className="badge-public">{repo.visibility || "Public"}</span>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">Star</button>
          <button 
            className="btn-primary"
            onClick={() => navigate(`/repo/${id}/code`)}
          >
            Go to Source
          </button>
          <button className="btn-more">...</button>
        </div>
      </header>

      {/* Description Section */}
      <div className="overview-description">
        <p>
          {repo.description ? (
            <span dangerouslySetInnerHTML={{ __html: repo.description }} />
          ) : (
            <>
              Here's where you'll find this repository's source files. To give your users an idea of what they'll find, 
              <button className="btn-inline">add a description to your repository.</button>
            </>
          )}
        </p>
      </div>

      {/* Toolbar Section */}
      <div className="overview-toolbar">
        <div className="branch-selector">
          <span className="material-symbols-outlined">account_tree</span>
          <span className="current-branch">main</span>
          <span className="material-symbols-outlined">expand_more</span>
        </div>
        <div className="file-search">
          <input type="text" placeholder="Filter files" />
          <span className="material-symbols-outlined search-icon">search</span>
        </div>
      </div>

      {/* File List Table */}
      <div className="file-list-container">
        <div className="file-list-header">
          <span className="material-symbols-outlined">folder</span>
          <span className="current-path">/</span>
        </div>
        <table className="file-table">
          <thead>
            <tr>
              <th className="th-name">Name</th>
              <th className="th-size">Size</th>
              <th className="th-commit">Last commit</th>
              <th className="th-message">Message</th>
            </tr>
          </thead>
          <tbody>
            {contents.length > 0 ? (
              contents.map((item) => (
                <tr key={item.path}>
                  <td className="td-name">
                    <span className="material-symbols-outlined file-icon">
                      {item.type === "dir" ? "folder" : "description"}
                    </span>
                    {item.name}
                  </td>
                  <td className="td-size">{item.size ? `${(item.size / 1024).toFixed(1)} KB` : "-"}</td>
                  <td className="td-commit">{item.time || "10 minutes ago"}</td>
                  <td className="td-message">{item.commitVal || "Initial commit"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-10 text-center text-gh-text-secondary">
                  Repository is empty. <button className="text-primary hover:underline">Add some files!</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* README Section */}
      <div className="readme-container">
        <div className="readme-header">
          <span className="readme-title">README.md</span>
        </div>
        <div className="readme-body">
          {readme ? (
            <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: readme }} />
          ) : (
            <div className="readme-mock">
              <h3>Getting Started with {repo.name}</h3>
              <p>Welcome to your new repository! Here are some recommended next steps:</p>
              
              <h4>1. Clone the repository</h4>
              <div className="bg-gh-bg-tertiary p-3 rounded-md font-mono text-sm mb-4">
                git clone {repo.cloneUrl || `https://trackcodex.dev/repo/${id}.git`}
              </div>

              <h4>2. Add your first commit</h4>
              <p>Create a file and push it to start your project history.</p>
              
              <h4>3. Set up CI/CD</h4>
              <p>Automate your testing and deployment using TrackCodex Actions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepositoryOverview;
