import React, { useState } from "react";

interface SecuritySettingsProps {
  repoId: string;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ repoId }) => {
  const [dependencyGraph, setDependencyGraph] = useState(true);
  const [dependabotAlerts, setDependabotAlerts] = useState(true);
  const [secretScanning, setSecretScanning] = useState(true);
  const [codeScanning, setCodeScanning] = useState(true);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <section>
        <h2 className="text-xl font-bold text-gh-text flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary">verified_user</span>
          Code security and analysis
        </h2>
        <p className="text-sm text-gh-text-secondary mb-6 max-w-2xl">
          Configure security features to help keep your code safe and secure.
        </p>

        <div className="space-y-4 bg-gh-bg-secondary/20 border border-gh-border rounded-[2.5rem] p-8 md:p-12 shadow-sm">
          <div className="space-y-8">
            <div className="flex items-start justify-between gap-8 group">
              <div className="flex-1">
                <h3 className="text-base font-bold text-gh-text mb-1 group-hover:text-primary transition-colors cursor-default">Dependency graph</h3>
                <p className="text-xs text-gh-text-secondary leading-relaxed max-w-xl">
                  See the packages your project depends on and the projects that depend on your repository.
                </p>
              </div>
              <div 
                onClick={() => setDependencyGraph(!dependencyGraph)}
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-all shrink-0 ${dependencyGraph ? "bg-emerald-500" : "bg-gh-border-active"}`}
              >
                <div className={`absolute top-1 size-4 bg-white rounded-full transition-all ${dependencyGraph ? "left-7" : "left-1"}`}></div>
              </div>
            </div>

            <div className="h-px bg-gh-border opacity-50"></div>

            <div className="flex items-start justify-between gap-8 group">
              <div className="flex-1">
                <h3 className="text-base font-bold text-gh-text mb-1 group-hover:text-amber-500 transition-colors cursor-default">Dependabot alerts</h3>
                <p className="text-xs text-gh-text-secondary leading-relaxed max-w-xl">
                  Receive notifications about vulnerable dependencies in your repository.
                </p>
                {dependencyGraph && (
                  <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center gap-3 animate-in zoom-in-95">
                    <span className="material-symbols-outlined text-amber-500 !text-[18px]">warning</span>
                    <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Active Monitoring Enabled</span>
                  </div>
                )}
              </div>
              <div 
                onClick={() => setDependabotAlerts(!dependabotAlerts)}
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-all shrink-0 ${dependabotAlerts ? "bg-amber-500" : "bg-gh-border-active"}`}
              >
                <div className={`absolute top-1 size-4 bg-white rounded-full transition-all ${dependabotAlerts ? "left-7" : "left-1"}`}></div>
              </div>
            </div>

            <div className="h-px bg-gh-border opacity-50"></div>

            <div className="flex items-start justify-between gap-8 group">
              <div className="flex-1">
                <h3 className="text-base font-bold text-gh-text mb-1 group-hover:text-red-500 transition-colors cursor-default">Secret scanning</h3>
                <p className="text-xs text-gh-text-secondary leading-relaxed max-w-xl">
                  Identify secrets, such as tokens and private keys, that have been pushed to your repository.
                </p>
              </div>
              <div 
                onClick={() => setSecretScanning(!secretScanning)}
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-all shrink-0 ${secretScanning ? "bg-red-500" : "bg-gh-border-active"}`}
              >
                <div className={`absolute top-1 size-4 bg-white rounded-full transition-all ${secretScanning ? "left-7" : "left-1"}`}></div>
              </div>
            </div>

            <div className="h-px bg-gh-border opacity-50"></div>

            <div className="flex items-start justify-between gap-8 group">
              <div className="flex-1">
                <h3 className="text-base font-bold text-gh-text mb-1 group-hover:text-primary transition-colors cursor-default">Code scanning</h3>
                <p className="text-xs text-gh-text-secondary leading-relaxed max-w-xl">
                  Automatically analyze your code for vulnerabilities and errors.
                </p>
              </div>
              <div 
                onClick={() => setCodeScanning(!codeScanning)}
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-all shrink-0 ${codeScanning ? "bg-primary" : "bg-gh-border-active"}`}
              >
                <div className={`absolute top-1 size-4 bg-white rounded-full transition-all ${codeScanning ? "left-7" : "left-1"}`}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 flex gap-6 text-sm text-gh-text leading-relaxed shadow-sm">
        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
          <span className="material-symbols-outlined text-primary !text-[28px]">policy</span>
        </div>
        <div>
          <h4 className="font-bold text-primary text-lg mb-1">Security Policy</h4>
          <p className="text-gh-text-secondary">
            Help your users report security vulnerabilities. 
            Create a <code>SECURITY.md</code> file in your repository to define how people can report vulnerabilities.
          </p>
          <button className="text-xs font-black uppercase text-primary hover:text-emerald-500 transition-colors flex items-center gap-1 mt-4">
            Set up policy
            <span className="material-symbols-outlined !text-[14px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
