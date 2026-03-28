import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../../services/infra/api";
import { Workspace, Repository } from "../../types";
import { MOCK_WORKSPACES, MOCK_REPO_FILES } from "../../constants";
import Spinner from "../../components/ui/Spinner";
import "../../styles/WorkspaceOverview.css";

const WorkspaceOverview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [repo, setRepo] = useState<Repository | null>(null);
  const [contents, setContents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readme, setReadme] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const wsData = await api.workspaces.get(id);
        setWorkspace(wsData);

        // If workspace has a repository, fetch its details and contents
        if (wsData.repositoryId) {
          try {
            const repoData = await api.repositories.get(wsData.repositoryId);
            setRepo(repoData);

            const contentData = await api.repositories.getContents(wsData.repositoryId);
            setContents(contentData || []);
          } catch (repoErr) {
            console.warn("Repo API failed, using mock files:", repoErr);
            setContents(MOCK_REPO_FILES);
          }

          // Try to fetch README.md
          try {
            const readmeData = await api.repositories.getContent(wsData.repositoryId, "README.md");
            if (readmeData && readmeData.content) {
              setReadme(atob(readmeData.content));
            }
          } catch (e) {
            console.log("No README.md found via API");
          }
        }
      } catch (err) {
        console.error("Workspace API failed, checking mocks:", err);
        const mockWs = MOCK_WORKSPACES.find(ws => ws.id === id);
        if (mockWs) {
          setWorkspace(mockWs);
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

  if (!workspace) {
    return (
      <div className="workspace-overview-error">
        <h2>Workspace not found</h2>
        <button onClick={() => navigate("/workspaces")}>Back to Workspaces</button>
      </div>
    );
  }

  return (
    <div className="workspace-overview-container">
      {/* Header Section */}
      <header className="overview-header">
        <div className="header-breadcrumbs">
          <span className="breadcrumb-owner">trackcodex</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-repo">{workspace.name}</span>
          <span className="badge-public">Public</span>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">Invite</button>
          <button 
            className="btn-primary"
            onClick={() => navigate(`/workspace/${id}/ide`)}
          >
            Clone
          </button>
          <button className="btn-more">...</button>
        </div>
      </header>

      {/* Description Section */}
      <div className="overview-description">
        <p>
          Here's where you'll find this repository's source files. To give your users an idea of what they'll find, 
          <button className="btn-inline">add a description to your repository.</button>
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
                  <td className="td-commit">10 minutes ago</td>
                  <td className="td-message">Initial commit</td>
                </tr>
              ))
            ) : (
              // Empty State Mock
              <>
                <tr>
                  <td className="td-name"><span className="material-symbols-outlined file-icon">description</span>.gitignore</td>
                  <td className="td-size">624 B</td>
                  <td className="td-commit">10 minutes ago</td>
                  <td className="td-message">Initial commit</td>
                </tr>
                <tr>
                  <td className="td-name"><span className="material-symbols-outlined file-icon">description</span>README.md</td>
                  <td className="td-size">2.56 KB</td>
                  <td className="td-commit">10 minutes ago</td>
                  <td className="td-message">Initial commit</td>
                </tr>
              </>
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
            <div dangerouslySetInnerHTML={{ __html: readme }} />
          ) : (
            <div className="readme-mock">
              <h3>Edit a file, create a new file, and clone from Bitbucket in under 2 minutes</h3>
              <p>When you're done, you can delete the content in this README and update the file with details for others getting started with your repository.</p>
              <p>We recommend that you open this README in another tab as you perform the tasks below. You can <button className="btn-inline">watch our video</button> for a full demo of all the steps in this tutorial. Open the video in a new tab to avoid leaving Bitbucket.</p>
              
              <h4>Edit a file</h4>
              <p>You'll start by editing this README file to learn how to edit a file in Bitbucket.</p>
              <ol>
                <li>Click <strong>Source</strong> on the left side.</li>
                <li>Click the <strong>README.md</strong> link from the list of files.</li>
                <li>Click the <strong>Edit</strong> button.</li>
                <li>Delete the following text: <em>Delete this line to make a change to the README from Bitbucket.</em></li>
                <li>After making your change, click <strong>Commit</strong> and then <strong>Commit</strong> again in the dialog. The commit page will open and you'll see the change you just made.</li>
                <li>Go back to the <strong>Source</strong> page.</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceOverview;
