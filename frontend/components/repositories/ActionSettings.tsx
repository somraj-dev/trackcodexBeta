import React, { useState } from "react";

interface ActionSettingsProps {
  repoId: string;
}

const ActionSettings: React.FC<ActionSettingsProps> = ({ repoId }) => {
  const [permissions, setPermissions] = useState("all"); // all, select, disabled
  const [workflowPerms, setWorkflowPerms] = useState("write"); // read, write
  const [allowPublicRepos, setAllowPublicRepos] = useState(true);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <section>
        <h2 className="text-xl font-bold text-gh-text flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary">play_circle</span>
          Actions permissions
        </h2>
        <p className="text-sm text-gh-text-secondary mb-6 max-w-2xl">
          Choose which actions can run in this repository. 
          By default, all actions are allowed.
        </p>

        <div className="space-y-3">
          {[
            { id: "all", label: "Allow all actions and reusable workflows", desc: "Any action or reusable workflow can be used." },
            { id: "select", label: "Allow select actions and reusable workflows", desc: "Only actions and reusable workflows added to the allow list can be used." },
            { id: "disabled", label: "Disable actions", desc: "Actions and reusable workflows are entirely disabled for this repository." },
          ].map((opt) => (
            <div 
              key={opt.id}
              onClick={() => setPermissions(opt.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-4 ${permissions === opt.id ? "bg-primary/5 border-primary shadow-sm" : "bg-gh-bg-secondary/30 border-gh-border hover:border-gh-border-active"}`}
            >
              <div className={`mt-1 size-5 rounded-full border-2 flex items-center justify-center shrink-0 ${permissions === opt.id ? "border-primary" : "border-gh-border"}`}>
                {permissions === opt.id && <div className="size-2.5 bg-primary rounded-full"></div>}
              </div>
              <div>
                <div className="text-sm font-bold text-gh-text">{opt.label}</div>
                <div className="text-xs text-gh-text-secondary mt-0.5">{opt.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="h-px bg-gh-border opacity-50"></div>

      <section>
        <h3 className="text-lg font-bold text-gh-text mb-2">Workflow permissions</h3>
        <p className="text-sm text-gh-text-secondary mb-6">
          Set the default permissions for the <code>GITHUB_TOKEN</code> when running workflows.
        </p>

        <div className="space-y-4 bg-gh-bg-secondary/30 border border-gh-border rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div 
              onClick={() => setWorkflowPerms("write")}
              className={`mt-1 size-5 rounded-full border-2 flex items-center justify-center cursor-pointer shrink-0 ${workflowPerms === "write" ? "border-primary" : "border-gh-border"}`}
            >
              {workflowPerms === "write" && <div className="size-2.5 bg-primary rounded-full"></div>}
            </div>
            <div>
              <div className="text-sm font-bold text-gh-text">Read and write permissions</div>
              <div className="text-xs text-gh-text-secondary mt-0.5">Workflows can read and write to all repository scopes.</div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div 
              onClick={() => setWorkflowPerms("read")}
              className={`mt-1 size-5 rounded-full border-2 flex items-center justify-center cursor-pointer shrink-0 ${workflowPerms === "read" ? "border-primary" : "border-gh-border"}`}
            >
              {workflowPerms === "read" && <div className="size-2.5 bg-primary rounded-full"></div>}
            </div>
            <div>
              <div className="text-sm font-bold text-gh-text">Read repository contents and packages permissions</div>
              <div className="text-xs text-gh-text-secondary mt-0.5">Workflows can only read the contents of the repository and its packages.</div>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gh-border opacity-50"></div>

      <section>
        <div className="flex items-center justify-between p-6 bg-gh-bg-secondary/20 border border-gh-border rounded-2xl">
          <div className="max-w-xl">
            <h4 className="text-sm font-bold text-gh-text">Fork pull request workflows</h4>
            <p className="text-xs text-gh-text-secondary mt-1">
              Run workflows from fork pull requests. This is a security risk if the fork pull request contains malicious code.
            </p>
          </div>
          <div 
            onClick={() => setAllowPublicRepos(!allowPublicRepos)}
            className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${allowPublicRepos ? "bg-primary" : "bg-gh-border-active"}`}
          >
            <div className={`absolute top-1 size-4 bg-white rounded-full transition-all ${allowPublicRepos ? "left-7" : "left-1"}`}></div>
          </div>
        </div>
      </section>

      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6 flex gap-4 text-xs text-gh-text-secondary leading-relaxed">
        <span className="material-symbols-outlined text-emerald-500 !text-[24px] shrink-0">task_alt</span>
        <div>
          <h4 className="font-bold text-gh-text text-sm mb-1 text-emerald-500">Actions are active</h4>
          <p>
            Your repository is correctly configured to run TrackCodex Actions. 
            Standard runners are available and ready to process your workflow files.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActionSettings;
