import React, { useState } from "react";

interface SecretSettingsProps {
  repoId: string;
}

const SecretSettings: React.FC<SecretSettingsProps> = ({ repoId }) => {
  const [secrets, setSecrets] = useState([
    { id: "1", name: "DATABASE_URL", updatedAt: "2 days ago" },
    { id: "2", name: "FIREBASE_API_KEY", updatedAt: "1 week ago" },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newSecret, setNewSecret] = useState({ name: "", value: "" });

  const handleAddSecret = () => {
    if (!newSecret.name || !newSecret.value) return;
    setSecrets([
      ...secrets,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: newSecret.name.toUpperCase().replace(/\s+/g, "_"),
        updatedAt: "just now",
      },
    ]);
    setNewSecret({ name: "", value: "" });
    setIsAdding(false);
  };

  const deleteSecret = (id: string) => {
    setSecrets(secrets.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gh-text flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">key</span>
            Actions secrets and variables
          </h2>
          <button 
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-md hover:bg-opacity-90 transition-all shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined !text-[18px]">add</span>
            New repository secret
          </button>
        </div>
        <p className="text-sm text-gh-text-secondary mb-8 max-w-2xl">
          Secrets are variables that you create in an organization, repository, or environment. 
          The secrets that you create are available to use in TrackCodex Actions workflows.
        </p>

        {isAdding && (
          <div className="mb-8 p-8 bg-gh-bg border border-primary/30 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-gh-text mb-6 uppercase tracking-widest">Add new repository secret</h3>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-black uppercase text-gh-text-secondary mb-2 block">Name</label>
                <input 
                  value={newSecret.name}
                  onChange={(e) => setNewSecret({...newSecret, name: e.target.value})}
                  placeholder="MY_SECRET_NAME"
                  className="w-full bg-gh-bg-secondary border border-gh-border rounded-xl px-4 py-2.5 text-sm text-gh-text focus:ring-2 focus:ring-primary/50 outline-none transition-all font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase text-gh-text-secondary mb-2 block">Value</label>
                <textarea 
                  value={newSecret.value}
                  onChange={(e) => setNewSecret({...newSecret, value: e.target.value})}
                  placeholder="Secret value..."
                  className="w-full bg-gh-bg-secondary border border-gh-border rounded-xl px-4 py-3 text-sm text-gh-text focus:ring-2 focus:ring-primary/50 outline-none transition-all min-h-[120px] font-mono"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-sm font-bold text-gh-text-secondary hover:text-gh-text transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddSecret}
                  disabled={!newSecret.name || !newSecret.value}
                  className="px-8 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                >
                  Add secret
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gh-bg-secondary/20 border border-gh-border rounded-[2rem] overflow-hidden shadow-sm">
          <div className="px-8 py-4 bg-gh-bg-secondary border-b border-gh-border flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-gh-text-secondary tracking-widest">Repository secrets</h3>
            <span className="px-2 py-0.5 bg-gh-bg-tertiary rounded-full text-[10px] font-bold text-gh-text-secondary">{secrets.length}</span>
          </div>
          <div className="divide-y divide-gh-border">
            {secrets.length === 0 ? (
              <div className="p-12 text-center text-gh-text-secondary italic text-sm">
                No secrets added to this repository.
              </div>
            ) : (
              secrets.map((secret) => (
                <div key={secret.id} className="px-8 py-5 flex items-center justify-between hover:bg-gh-bg-secondary/50 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-gh-bg border border-gh-border flex items-center justify-center text-primary shadow-sm">
                      <span className="material-symbols-outlined !text-[20px]">lock</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gh-text font-mono">{secret.name}</div>
                      <div className="text-[10px] text-gh-text-secondary mt-1">Updated {secret.updatedAt}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gh-text-secondary hover:text-gh-text hover:bg-gh-bg-tertiary rounded-lg transition-all">
                      <span className="material-symbols-outlined !text-[18px]">edit</span>
                    </button>
                    <button 
                      onClick={() => deleteSecret(secret.id)}
                      className="p-2 text-gh-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <span className="material-symbols-outlined !text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-8 flex gap-6 text-sm text-gh-text leading-relaxed shadow-sm">
        <div className="size-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
          <span className="material-symbols-outlined text-amber-500 !text-[28px]">shield_person</span>
        </div>
        <div>
          <h4 className="font-bold text-amber-500 text-lg mb-1">Secrets Security</h4>
          <p className="text-gh-text-secondary italic">
            Secrets are encrypted. They will only be available to Actions runners and will never be displayed in the UI after being saved.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <button className="text-xs font-black uppercase text-amber-500 hover:underline transition-all">
              Learn about secret security
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecretSettings;
