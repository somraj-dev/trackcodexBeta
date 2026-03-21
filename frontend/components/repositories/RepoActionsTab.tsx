import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import yamlLang from "react-syntax-highlighter/dist/esm/languages/hljs/yaml";
import { githubGist } from "react-syntax-highlighter/dist/esm/styles/hljs";
import PipelineVisualizer from "./PipelineVisualizer";
import { api } from "../../services/infra/api";

SyntaxHighlighter.registerLanguage("yaml", yamlLang);

// Types matching API response
interface WorkflowRun {
  id: string;
  workflowName: string;
  commitSha: string;
  event: string;
  status: string;
  conclusion: string | null;
  createdAt: string;
  updatedAt: string;
  jobs: any[]; // Summary
  duration?: string; // Calculated
}

interface Workflow {
  id: string;
  name: string;
  path: string;
  state: string;
}

const RepoActionsTab = () => {
  const { id: repoId } = useParams();
  const [currentView, setCurrentView] = useState<
    "overview" | "workflows" | "detail" | "workflow_detail"
  >("overview");
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<any | null>(null);
  const [loadingRun, setLoadingRun] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [workflowYaml, setWorkflowYaml] = useState<string | null>(null);
  const [loadingYaml, setLoadingYaml] = useState(false);

  useEffect(() => {
    if (repoId) {
      fetchData();
    }
  }, [repoId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [runsRes, workflowsRes] = await Promise.all([
        fetch(`/api/ci/repos/${repoId}/runs`),
        fetch(`/api/ci/repos/${repoId}/workflows`),
      ]);

      if (runsRes.ok) {
        const runsData = await runsRes.json();
        setRuns(runsData);
      }
      if (workflowsRes.ok) {
        const wfsData = await workflowsRes.json();
        setWorkflows(wfsData);
      }
    } catch (error) {
      console.error("Failed to fetch CI data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkflowClick = async (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setCurrentView("workflow_detail");
    setLoadingYaml(true);
    try {
      // Use existing getContents or a specific workflow endpoint
      // For GitHub parity, we usually fetch the file path
      const content = await api.repositories.getContent(
        repoId!,
        workflow.path,
        "main" // Should use default branch or current branch context
      );
      if (typeof content === "string") {
        setWorkflowYaml(content);
      } else if (content && (content as any).content) {
        // Handle base64 encoded content if necessary
        setWorkflowYaml(atob((content as any).content));
      }
    } catch (e) {
      console.error("Failed to load workflow YAML", e);
      setWorkflowYaml("# Failed to load workflow content.");
    } finally {
      setLoadingYaml(false);
    }
  };

  const handleRunClick = async (run: WorkflowRun) => {
    setLoadingRun(true);
    try {
      const res = await fetch(`/api/ci/runs/${run.id}`);
      if (res.ok) {
        const fullRun = await res.json();
        setSelectedRun(fullRun);
        setCurrentView("detail");
      }
    } catch (e) {
      console.error("Failed to load run details", e);
    } finally {
      setLoadingRun(false);
    }
  };

  const handleBack = () => {
    setSelectedRun(null);
    setCurrentView("overview");
    // Refresh list on back??
    fetchData();
  };

  if (currentView === "detail" && selectedRun) {
    return <PipelineVisualizer run={selectedRun} onBack={handleBack} />;
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-[#8b949e]">Loading actions...</div>
    );
  }

  return (
    <div className="flex h-full min-h-[500px]">
      {/* Sidebar Navigation for Actions */}
      <div className="w-64 pr-6 border-r border-[#1E232E] hidden lg:block">
        <h3 className="text-xs font-bold text-[#8b949e] uppercase tracking-widest mb-4 px-2">
          Actions
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => setCurrentView("overview")}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === "overview" ? "bg-[#1f6feb] text-white" : "text-[#c9d1d9] hover:bg-gh-bg-tertiary"}`}
          >
            Overview
          </button>
          <button
            onClick={() => setCurrentView("workflows")}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === "workflows" ? "bg-[#1f6feb] text-white" : "text-[#c9d1d9] hover:bg-gh-bg-tertiary"}`}
          >
            Workflow runs
          </button>
        </div>

        <h3 className="text-xs font-bold text-[#8b949e] uppercase tracking-widest mt-8 mb-4 px-2">
          Workflows
        </h3>
        <div className="space-y-1">
          {workflows.map((w: Workflow) => (
            <button
              key={w.id}
              onClick={() => handleWorkflowClick(w)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors truncate flex items-center gap-2 ${selectedWorkflow?.id === w.id && currentView === "workflow_detail" ? "bg-[#1f6feb] text-white" : "text-[#c9d1d9] hover:bg-gh-bg-tertiary"}`}
            >
              <span
                className={`size-2 rounded-full ${w.state === "ACTIVE" ? "bg-green-500" : "bg-gray-500"}`}
              ></span>
              {w.name}
            </button>
          ))}
          {workflows.length === 0 && (
            <div className="px-3 text-xs text-[#8b949e] italic">
              No workflows found
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 pl-6">
        {currentView === "overview" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                All Workflow Runs
              </h2>
              <div className="flex items-center gap-2">
                {loadingRun && (
                  <span className="text-xs text-[#58a6ff] animate-pulse">
                    Loading details...
                  </span>
                )}
                <button
                  onClick={async () => {
                    setLoadingRun(true);
                    try {
                      await fetch(`/api/ci/repos/${repoId}/dispatch`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ref: "HEAD" }),
                      });
                      // Refresh runs
                      setTimeout(fetchData, 1000);
                    } catch (e) {
                      console.error("Failed to dispatch");
                    } finally {
                      setLoadingRun(false);
                    }
                  }}
                  className="px-3 py-1.5 bg-[#238636] text-white text-xs font-bold rounded-md hover:bg-[#2ea043] transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined !text-[16px]">
                    play_arrow
                  </span>
                  Run workflow
                </button>
              </div>
            </div>

            {/* Stats (Mocked or calculated) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Keep stats as is or calculate from runs */}
              <div className="bg-[#11141A] border border-[#1E232E] p-4 rounded-lg">
                <span className="text-[#8b949e] text-xs font-bold uppercase">
                  Total Runs
                </span>
                <div className="text-xl font-semibold text-white mt-1">
                  {runs.length}
                </div>
              </div>
              <div className="bg-[#11141A] border border-[#1E232E] p-4 rounded-lg">
                <span className="text-[#8b949e] text-xs font-bold uppercase">
                  Success Rate
                </span>
                <div className="text-xl font-semibold text-[#3fb950] mt-1">
                  {runs.length > 0
                    ? Math.round(
                        (runs.filter((r: WorkflowRun) => r.conclusion === "SUCCESS").length /
                          runs.length) *
                          100,
                      )
                    : 0}
                  %
                </div>
              </div>
            </div>

            <div className="bg-[#0A0D14] border border-[#1E232E] rounded-lg overflow-hidden">
              <div className="bg-[#11141A] px-4 py-3 border-b border-[#1E232E] flex justify-between items-center">
                <h3 className="font-bold text-[#c9d1d9] text-sm">Activity</h3>
              </div>
              <div className="divide-y divide-[#30363d]">
                {runs.length === 0 ? (
                  <div className="p-8 text-center text-[#8b949e]">
                    No workflow runs yet. Push code to start CI.
                  </div>
                ) : (
                  runs.map((run: WorkflowRun) => (
                    <div
                      key={run.id}
                      onClick={() => handleRunClick(run)}
                      className="p-4 hover:bg-gh-bg-tertiary transition-colors cursor-pointer group flex items-start gap-4"
                    >
                      <div
                        className={`mt-1 size-5 flex items-center justify-center rounded-full ${run.conclusion === "SUCCESS" ? "text-[#3fb950]" : run.conclusion === "FAILURE" ? "text-[#f85149]" : "text-[#d29922] animate-pulse"}`}
                      >
                        <span className="material-symbols-outlined !text-[20px]">
                          {run.conclusion === "SUCCESS"
                            ? "check_circle"
                            : run.conclusion === "FAILURE"
                              ? "cancel"
                              : run.status === "QUEUED"
                                ? "radio_button_checked"
                                : "sync"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#c9d1d9] text-sm group-hover:text-[#58a6ff] truncate">
                            {run.event} for {run.commitSha.substring(0, 7)}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#11141A] border border-[#1E232E] text-[#8b949e]">
                            {run.workflowName}
                          </span>
                        </div>
                        <div className="text-xs text-[#8b949e] mt-1 flex items-center gap-2">
                          <span>{run.id}</span>
                          <span>•</span>
                          <span>
                            {new Date(run.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {/* Status Badge */}
                      <div className="text-xs font-mono self-center px-2 py-1 rounded bg-[#11141A] text-[#c9d1d9]">
                        {run.status}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {currentView === "workflow_detail" && selectedWorkflow && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <nav className="flex items-center gap-2 text-sm text-[#8b949e] mb-1">
                  <button 
                    onClick={() => setCurrentView("overview")}
                    className="hover:text-[#58a6ff]"
                  >
                    Actions
                  </button>
                  <span>/</span>
                  <span className="text-white font-bold">{selectedWorkflow.name}</span>
                </nav>
                <h2 className="text-xl font-bold text-white">
                  {selectedWorkflow.path.split('/').pop()}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleWorkflowClick(selectedWorkflow)}
                  className="px-3 py-1.5 bg-[#11141A] border border-[#1E232E] text-[#c9d1d9] text-xs font-bold rounded-md hover:border-[#8b949e] transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined !text-[16px]">refresh</span>
                  Refresh
                </button>
                <button
                  onClick={async () => {
                    setLoadingRun(true);
                    try {
                      await api.workflows.dispatch(repoId!, selectedWorkflow.id, "main");
                      setTimeout(fetchData, 1000);
                      setCurrentView("overview");
                    } catch (e) {
                      console.error("Failed to dispatch");
                    } finally {
                      setLoadingRun(false);
                    }
                  }}
                  className="px-3 py-1.5 bg-[#238636] text-white text-xs font-bold rounded-md hover:bg-[#2ea043] transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined !text-[16px]">play_arrow</span>
                  Run workflow
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg overflow-hidden flex flex-col min-h-0">
              <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d] flex justify-between items-center">
                <span className="text-xs text-[#8b949e] font-mono">{selectedWorkflow.path}</span>
                <span className="text-[10px] text-[#8b949e] uppercase font-bold tracking-wider">YAML</span>
              </div>
              <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                {loadingYaml ? (
                  <div className="flex items-center justify-center h-full text-[#8b949e] gap-3">
                    <div className="size-4 border-2 border-[#58a6ff] border-t-transparent rounded-full animate-spin"></div>
                    Loading YAML...
                  </div>
                ) : (
                  <SyntaxHighlighter
                    language="yaml"
                    style={githubGist}
                    customStyle={{
                      backgroundColor: "transparent",
                      padding: 0,
                      margin: 0,
                      fontSize: "12px",
                      lineHeight: "1.5",
                    }}
                    showLineNumbers={true}
                    lineNumberStyle={{ minWidth: "3em", paddingRight: "1em", color: "#484f58", textAlign: "right" }}
                  >
                    {workflowYaml || "# No content found."}
                  </SyntaxHighlighter>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepoActionsTab;



