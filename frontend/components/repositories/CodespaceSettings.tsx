import React, { useState } from "react";

interface CodespaceSettingsProps {
  repoId: string;
}

const CodespaceSettings: React.FC<CodespaceSettingsProps> = ({ repoId }) => {
  const [retentionPeriod, setRetentionPeriod] = useState("30"); // 30, 60, 90
  const [machineType, setMachineType] = useState("standard"); // standard, premium, ultra
  const [prebuilds, setPrebuilds] = useState([
    { id: "1", branch: "main", region: "All", status: "Active" },
  ]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <section>
        <h2 className="text-xl font-bold text-gh-text flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary">terminal</span>
          Codespaces settings
        </h2>
        <p className="text-sm text-gh-text-secondary mb-6 max-w-2xl">
          Configure how Codespaces are managed and billed for this repository.
        </p>

        <div className="space-y-6">
          <div className="p-6 bg-gh-bg-secondary/30 border border-gh-border rounded-2xl">
            <h3 className="text-sm font-bold text-gh-text mb-4">Retention period</h3>
            <p className="text-xs text-gh-text-secondary mb-4">
              Codespaces that aren't used will be automatically deleted after the retention period.
            </p>
            <div className="flex gap-3">
              {[
                { val: "30", label: "30 days" },
                { val: "60", label: "60 days" },
                { val: "90", label: "90 days" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setRetentionPeriod(opt.val)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${retentionPeriod === opt.val ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-gh-bg border-gh-border text-gh-text-secondary hover:border-gh-border-active"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 bg-gh-bg-secondary/30 border border-gh-border rounded-2xl">
            <h3 className="text-sm font-bold text-gh-text mb-4">Default machine type</h3>
            <p className="text-xs text-gh-text-secondary mb-4">
              The machine type used when creating a new Codespace if not specified.
            </p>
            <div className="space-y-3">
              <select 
                value={machineType}
                onChange={(e) => setMachineType(e.target.value)}
                title="Default machine type"
                className="w-full max-w-sm bg-gh-bg border border-gh-border rounded-xl px-4 py-2.5 text-sm text-gh-text focus:ring-2 focus:ring-primary/40 outline-none transition-all cursor-pointer shadow-sm"
              >
                <option value="standard">Standard (2-core, 4GB RAM)</option>
                <option value="premium">Premium (4-core, 8GB RAM)</option>
                <option value="ultra">Ultra (8-core, 16GB RAM)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gh-border opacity-50"></div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gh-text">Prebuild configurations</h3>
          <button className="px-4 py-2 bg-gh-bg-secondary border border-gh-border text-gh-text text-sm font-bold rounded-md hover:bg-gh-bg-tertiary transition-all shadow-sm">
            Set up prebuild
          </button>
        </div>
        <p className="text-sm text-gh-text-secondary mb-6">
          Prebuilds improve Codespace startup time by pre-installing dependencies and pre-building code.
        </p>

        <div className="overflow-hidden border border-gh-border rounded-2xl bg-gh-bg shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gh-bg-secondary">
              <tr>
                <th className="px-6 py-3 text-[10px] font-medium uppercase text-gh-text-tertiary tracking-widest border-b border-gh-border">Branch</th>
                <th className="px-6 py-3 text-[10px] font-medium uppercase text-gh-text-tertiary tracking-widest border-b border-gh-border">Region</th>
                <th className="px-6 py-3 text-[10px] font-medium uppercase text-gh-text-tertiary tracking-widest border-b border-gh-border">Status</th>
                <th className="px-6 py-3 border-b border-gh-border"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gh-border">
              {prebuilds.map((pb) => (
                <tr key={pb.id} className="hover:bg-gh-bg-secondary/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gh-bg-tertiary border border-gh-border rounded font-mono text-xs text-primary font-bold">{pb.branch}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gh-text">{pb.region}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] font-medium uppercase">{pb.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-gh-text-secondary hover:text-gh-text rounded-md opacity-0 group-hover:opacity-100 transition-all">
                      <span className="material-symbols-outlined !text-[18px]">more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex gap-4 text-xs text-gh-text-secondary leading-relaxed">
        <span className="material-symbols-outlined text-primary !text-[24px] shrink-0">speed</span>
        <div>
          <h4 className="font-bold text-gh-text text-sm mb-1 uppercase tracking-tighter">Performance Tip</h4>
          <p>
            Using prebuilds can reduce startup time for this repository by up to 80%. 
            Consider setting up prebuilds for frequently used branches.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CodespaceSettings;
