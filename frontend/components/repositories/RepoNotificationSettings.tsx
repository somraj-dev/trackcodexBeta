import React, { useState, useEffect } from "react";
import { api } from "../../services/infra/api";

interface RepoNotificationSettingsProps {
  repoId: string;
}

const RepoNotificationSettings: React.FC<RepoNotificationSettingsProps> = ({ repoId }) => {
  const [watchLevel, setWatchLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchWatchStatus = async () => {
      setLoading(true);
      try {
        const repo = await api.repositories.get(repoId);
        setWatchLevel(repo.watchLevel || "IGNORE");
      } catch (err) {
        console.error("Failed to fetch watch status", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWatchStatus();
  }, [repoId]);

  const handleUpdateWatch = async (level: string) => {
    setSaving(true);
    try {
      if (level === "IGNORE") {
        await api.repositories.unwatch(repoId);
      } else {
        await api.repositories.watch(repoId, level);
      }
      setWatchLevel(level);
    } catch (err) {
      console.error("Failed to update watch status", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 bg-gh-bg-secondary border border-gh-border rounded-lg w-1/4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gh-bg-secondary border border-gh-border rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const options = [
    {
      id: "PARTICIPATING",
      label: "Participating and @mentions",
      description: "Only receive notifications from this repository when participating or @mentioned.",
      icon: "chat_bubble"
    },
    {
      id: "ALL",
      label: "All Activity",
      description: "Receive notifications for all commits, issues, and pull requests in this repository.",
      icon: "visibility"
    },
    {
      id: "IGNORE",
      label: "Ignore",
      description: "Never be notified about this repository.",
      icon: "visibility_off"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div>
        <h3 className="text-lg font-semibold text-gh-text mb-1">Notifications</h3>
        <p className="text-sm text-gh-text-secondary">
          Configure how you receive notifications for this repository.
        </p>
      </div>

      <div className="space-y-4">
        {options.map((option) => (
          <div
            key={option.id}
            onClick={() => !saving && handleUpdateWatch(option.id)}
            className={`flex items-start gap-4 p-5 rounded-2xl border transition-all cursor-pointer group ${
              watchLevel === option.id
                ? "bg-primary/10 border-primary shadow-lg shadow-primary/5"
                : "bg-gh-bg-secondary/40 border-gh-border hover:border-gh-text-secondary hover:bg-gh-bg-secondary"
            } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className={`mt-1 size-10 rounded-xl flex items-center justify-center transition-all ${
              watchLevel === option.id ? "bg-primary text-white" : "bg-gh-bg border border-gh-border text-gh-text-secondary group-hover:text-gh-text"
            }`}>
              <span className="material-symbols-outlined !text-[20px]">{option.icon}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-gh-text">{option.label}</span>
                {watchLevel === option.id && (
                  <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-gh-text-secondary leading-relaxed opacity-80">
                {option.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-3xl space-y-3">
        <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined !text-[16px]">info</span>
          Notification Delivery
        </h4>
        <p className="text-xs text-gh-text-secondary leading-relaxed">
          Notifications will be delivered to your primary email address and will also appear in your central inbox.
        </p>
      </div>
    </div>
  );
};

export default RepoNotificationSettings;
