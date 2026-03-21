import React, { useState, useEffect } from "react";
import RepoDependencyGraph from "./RepoDependencyGraph";
import { api } from "../../services/infra/api";
import { Repository } from "../../types";

interface RepoInsightsTabProps {
  repo: Repository;
}

interface PulseData {
  activePullRequests?: {
    merged: number;
    open: number;
  };
  commits?: {
    total: number;
    authors: number;
  };
}

interface Contributor {
  name: string;
  avatar: string;
  commits: number;
}

interface CommitDay {
  date: string;
  commits: number;
}

interface CodeFreqDay {
  date: string;
  additions: number;
  deletions: number;
}

const RepoInsightsTab: React.FC<RepoInsightsTabProps> = ({ repo }) => {
  const [activeSection, setActiveSection] = useState("Pulse");
  const [pulseData, setPulseData] = useState<PulseData | null>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [commits, setCommits] = useState<CommitDay[]>([]);
  const [codeFreq, setCodeFreq] = useState<CodeFreqDay[]>([]);
  const [forks, setForks] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPulse = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.repositories.insights.pulse(repo.id);
      setPulseData(data);
    } catch (e) {
      console.error("Failed to fetch pulse", e);
    } finally {
      setLoading(false);
    }
  }, [repo.id]);

  const fetchContributors = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.repositories.insights.contributors(repo.id);
      setContributors(data);
    } catch (e) {
      console.error("Failed to fetch contributors", e);
    } finally {
      setLoading(false);
    }
  }, [repo.id]);

  const fetchCommits = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.repositories.insights.commits(repo.id);
      setCommits(data);
    } catch (e) {
      console.error("Failed to fetch commits", e);
    } finally {
      setLoading(false);
    }
  }, [repo.id]);

  const fetchCodeFreq = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.repositories.insights.codeFrequency(repo.id);
      setCodeFreq(data);
    } catch (e) {
      console.error("Failed to fetch code freq", e);
    } finally {
      setLoading(false);
    }
  }, [repo.id]);

  const fetchForks = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.repositories.insights.forks(repo.id);
      setForks(data);
    } catch (e) {
      console.error("Failed to fetch forks", e);
    } finally {
      setLoading(false);
    }
  }, [repo.id]);

  useEffect(() => {
    if (activeSection === "Pulse") fetchPulse();
    if (activeSection === "Contributors") fetchContributors();
    if (activeSection === "Commits") fetchCommits();
    if (activeSection === "Code Frequency") fetchCodeFreq();
    if (activeSection === "Forks") fetchForks();
  }, [activeSection, fetchPulse, fetchContributors, fetchCommits, fetchCodeFreq, fetchForks]);

  const sections = [
    "Pulse",
    "Contributors",
    "Community",
    "Traffic",
    "Commits",
    "Code Frequency",
    "Dependencies",
    "Network",
    "Forks"
  ];

  return (
    <div className="p-6 grid grid-cols-[280px_1fr] gap-8">
      {/* Sidebar */}
      <div className="flex flex-col gap-1 border-r border-gh-border pr-6">
        {sections.map(section => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`px-3 py-2 text-left text-sm font-medium transition-all ${
              activeSection === section
                ? "text-gh-text bg-gh-bg-secondary rounded-md border-l-2 border-primary"
                : "text-gh-text-secondary hover:text-gh-text hover:bg-gh-bg-tertiary"
            }`}
          >
            {section}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="min-w-0">
        {/* Loading Overlay */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!loading && activeSection === "Pulse" && (
          <>
            <h2 className="text-xl font-bold text-gh-text mb-6">Pulse</h2>
            {!pulseData ? (
              <div className="text-gh-text-secondary py-8 text-center border border-gh-border border-dashed rounded-lg">
                No activity data available for the last 7 days.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-6">
                   <h3 className="text-sm font-bold text-gh-text mb-4">Pull Requests</h3>
                    <div className="h-4 bg-gh-bg rounded-full overflow-hidden flex mb-4">
                      {pulseData.activePullRequests && (
                        <>
                          <div 
                            className="dynamic-bg dynamic-width h-full transition-all duration-700 !bg-purple-500" 
                            style={{ "--dynamic-width": `${(pulseData.activePullRequests.merged / (pulseData.activePullRequests.merged + pulseData.activePullRequests.open + 1)) * 100}%` } as React.CSSProperties}
                          ></div>
                          <div 
                            className="dynamic-bg dynamic-width h-full transition-all duration-700 !bg-green-500" 
                            style={{ "--dynamic-width": `${(pulseData.activePullRequests.open / (pulseData.activePullRequests.merged + pulseData.activePullRequests.open + 1)) * 100}%` } as React.CSSProperties}
                          ></div>
                        </>
                      )}
                    </div>
                   <div className="flex gap-4 text-xs">
                     <div className="flex items-center gap-1.5">
                       <div className="size-3 bg-purple-500 rounded-sm"></div>
                       <span className="text-gh-text">{pulseData.activePullRequests?.merged || 0} Merged</span>
                     </div>
                     <div className="flex items-center gap-1.5">
                       <div className="size-3 bg-green-500 rounded-sm"></div>
                       <span className="text-gh-text">{pulseData.activePullRequests?.open || 0} Open</span>
                     </div>
                   </div>
                </div>

                <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-6 flex flex-col items-center justify-center">
                   <div className="text-4xl font-bold text-gh-text mb-1">
                     {pulseData.commits?.total || 0}
                   </div>
                   <div className="text-sm text-gh-text-secondary">
                     Commits by <span className="text-gh-text font-bold">{pulseData.commits?.authors || 0}</span> authors
                   </div>
                </div>
              </div>
            )}
          </>
        )}

        {!loading && activeSection === "Contributors" && (
          <>
            <h2 className="text-xl font-bold text-gh-text mb-6">Contributors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {contributors.map((c, idx) => (
                 <div key={idx} className="bg-gh-bg-secondary border border-gh-border rounded-lg p-4 flex items-center gap-4">
                    <img src={c.avatar} alt={c.name} className="size-12 rounded-full border border-gh-border" />
                    <div className="min-w-0">
                      <div className="font-bold text-gh-text truncate">{c.name}</div>
                      <div className="text-xs text-gh-text-secondary">{c.commits} commits</div>
                    </div>
                 </div>
               ))}
               {contributors.length === 0 && (
                 <div className="col-span-full py-12 text-center text-gh-text-secondary border border-gh-border border-dashed rounded-lg">
                   No contributor data found.
                 </div>
               )}
            </div>
          </>
        )}

        {!loading && activeSection === "Commits" && (
          <>
            <h2 className="text-xl font-bold text-gh-text mb-6">Commit Activity</h2>
            <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-6">
               <div className="h-64 flex items-end gap-1 px-2 border-b border-gh-border">
                  {commits.map((day, idx) => (
                    <div 
                      key={idx} 
                      className="bg-primary hover:bg-opacity-80 transition-all cursor-pointer rounded-t-sm flex-1 min-w-[2px] dynamic-height" 
                      style={{ "--dynamic-height": `${Math.min((day.commits || 0) * 10, 100)}%` } as React.CSSProperties}
                      title={`${day.date}: ${day.commits} commits`}
                    ></div>
                  ))}
                  {commits.length === 0 && (
                    <div className="w-full h-full flex items-center justify-center text-gh-text-secondary italic">
                      No commit history found
                    </div>
                  )}
               </div>
               <div className="flex justify-between mt-4 text-[10px] text-gh-text-secondary uppercase font-bold">
                  <span>{commits[0]?.date || ''}</span>
                  <span>{commits[commits.length-1]?.date || ''}</span>
               </div>
            </div>
          </>
        )}

        {!loading && activeSection === "Code Frequency" && (
          <>
            <h2 className="text-xl font-bold text-gh-text mb-6">Code Frequency</h2>
            <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-6">
               <div className="h-64 flex items-center gap-1 border-y border-gh-border relative">
                  <div className="absolute inset-0 flex flex-col pointer-events-none">
                     <div className="flex-1 border-b border-gh-border/50 border-dashed"></div>
                     <div className="flex-1"></div>
                  </div>
                  {codeFreq.map((day, idx) => (
                    <div key={idx} className="flex-1 flex flex-col gap-[1px] min-w-[3px] group relative h-full">
                       <div className="flex-1 flex flex-col justify-end">
                        <div 
                          className="dynamic-bg dynamic-height group-hover:bg-green-500 transition-colors rounded-t-sm w-full !bg-green-500/60" 
                          style={{ "--dynamic-height": `${Math.min((day.additions || 0) / 10, 50)}%` } as React.CSSProperties}
                          title={`${day.date}: +${day.additions}`}
                    ></div>
                      </div>
                      <div className="flex-1">
                        <div 
                          className="dynamic-bg dynamic-height group-hover:bg-red-500 transition-colors rounded-b-sm w-full !bg-red-500/60" 
                          style={{ "--dynamic-height": `${Math.min((day.deletions || 0) / 10, 50)}%` } as React.CSSProperties}
                          title={`${day.date}: -${day.deletions}`}
                        ></div>
                      </div>
                    </div>
                  ))}
               </div>
               <div className="flex justify-between mt-4 text-[10px] uppercase font-bold">
                  <span className="text-green-500">Additions</span>
                  <span className="text-red-500">Deletions</span>
               </div>
            </div>
          </>
        )}

        {!loading && activeSection === "Forks" && (
          <>
            <h2 className="text-xl font-bold text-gh-text mb-6">Forks</h2>
            <div className="space-y-4">
                {forks.map((f, idx) => (
                 <div key={idx} className="bg-gh-bg-secondary border border-gh-border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={f.owner?.avatar || `https://ui-avatars.com/api/?name=${f.owner?.username}&background=random`} alt="" className="size-8 rounded-full" />
                      <div>
                        <a href={`/repo/${f.owner?.username}/${f.name}`} className="font-bold text-primary hover:underline">
                          {f.owner?.username}/{f.name}
                        </a>
                        <div className="text-xs text-gh-text-secondary">Forked on {new Date(f.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gh-text-secondary text-sm">
                       <span className="material-symbols-outlined !text-[18px]">star</span>
                       {f.stars || 0}
                    </div>
                 </div>
               ))}
               {forks.length === 0 && (
                 <div className="py-20 text-center text-gh-text-secondary border border-gh-border border-dashed rounded-lg">
                    <span className="material-symbols-outlined !text-[48px] opacity-20 mb-4">fork_right</span>
                    <p>No forks yet</p>
                 </div>
               )}
            </div>
          </>
        )}

        {!loading && activeSection === "Dependencies" && (
          <RepoDependencyGraph repoId={repo.id} />
        )}

        {!loading && activeSection === "Community" && (
          <>
            <h2 className="text-xl font-bold text-gh-text mb-6">Community Standards</h2>
            <div className="bg-gh-bg-secondary border border-gh-border rounded-lg overflow-hidden">
               <table className="w-full text-sm">
                  <tbody className="divide-y divide-gh-border">
                     {[
                       { name: "Description", desc: "Add a description to your repository", status: !!repo.description },
                       { name: "README", desc: "Add a README file", status: true },
                       { name: "Code of Conduct", desc: "Add a CODE_OF_CONDUCT.md file", status: false },
                       { name: "Contributing", desc: "Add a CONTRIBUTING.md file", status: false },
                       { name: "License", desc: "Add a LICENSE file", status: !!repo.license },
                       { name: "Issue Templates", desc: "Add issue templates", status: false },
                       { name: "Pull Request Template", desc: "Add a pull request template", status: false },
                     ].map((item, idx) => (
                       <tr key={idx} className="hover:bg-gh-bg-tertiary transition-colors">
                          <td className="px-6 py-4">
                             <div className="font-bold text-gh-text">{item.name}</div>
                             <div className="text-xs text-gh-text-secondary">{item.desc}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             {item.status ? (
                               <span className="text-green-500 flex items-center justify-end gap-1 font-bold">
                                 <span className="material-symbols-outlined !text-[18px]">check_circle</span>
                                 Completed
                               </span>
                             ) : (
                               <button className="text-primary hover:underline font-bold">Add</button>
                             )}
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </>
        )}

        {!loading && activeSection === "Traffic" && (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-xl font-bold text-gh-text mb-6">Traffic</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gh-bg-secondary border border-gh-border rounded-xl p-8 text-center shadow-sm">
                <div className="text-[10px] font-medium uppercase text-gh-text-tertiary mb-2 tracking-widest">Unique visitors</div>
                <div className="text-2xl font-semibold text-gh-text">1.2k</div>
                <div className="text-xs text-emerald-500 mt-2 font-bold flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined !text-[14px]">trending_up</span>
                  +12.5% vs last week
                </div>
              </div>
              <div className="bg-gh-bg-secondary border border-gh-border rounded-xl p-8 text-center shadow-sm">
                <div className="text-[10px] font-medium uppercase text-gh-text-tertiary mb-2 tracking-widest">Total clones</div>
                <div className="text-2xl font-semibold text-gh-text">438</div>
                <div className="text-xs text-gh-text-secondary mt-2 font-bold">Updated just now</div>
              </div>
            </div>
            <div className="bg-gh-bg border border-gh-border rounded-2xl p-8 shadow-inner">
              <h3 className="text-sm font-bold text-gh-text mb-6">Popular content</h3>
              <div className="space-y-4">
                {[
                  { path: "/README.md", views: 850, unique: 420 },
                  { path: "/src/App.tsx", views: 320, unique: 150 },
                  { path: "/docs/intro.md", views: 210, unique: 98 },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gh-bg-secondary/40 border border-gh-border rounded-xl">
                    <code className="text-xs text-primary font-bold">{item.path}</code>
                    <div className="flex gap-8">
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-semibold text-gh-text-tertiary">Views</div>
                        <div className="text-sm font-bold text-gh-text">{item.views}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-semibold text-gh-text-tertiary">Unique</div>
                        <div className="text-sm font-bold text-gh-text">{item.unique}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && activeSection === "Network" && (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-xl font-bold text-gh-text mb-6">Network Graph</h2>
            <div className="bg-gh-bg-secondary/30 border border-gh-border rounded-[2.5rem] p-12 text-center aspect-video flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined !text-[48px] text-primary">hub</span>
              </div>
              <h3 className="text-lg font-semibold text-gh-text mb-4">Interactive Network Mapping</h3>
              <p className="text-sm text-gh-text-secondary max-w-md leading-relaxed">
                We're finalizing the WebGL engine to render your repository's fork tree and cross-repo connections.
              </p>
              <div className="mt-10 flex gap-4">
                <div className="px-6 py-2 bg-gh-bg border border-gh-border rounded-xl text-xs font-medium uppercase text-gh-text-secondary tracking-widest shadow-sm">
                  34 Nodes active
                </div>
                <div className="px-6 py-2 bg-gh-bg border border-gh-border rounded-xl text-xs font-medium uppercase text-gh-text-secondary tracking-widest shadow-sm">
                  12 Edge connections
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !["Pulse", "Contributors", "Community", "Traffic", "Commits", "Code Frequency", "Dependencies", "Network", "Forks"].includes(activeSection) && (
          <div className="py-20 text-center text-gh-text-secondary">
             <span className="material-symbols-outlined !text-[64px] opacity-20 mb-4">construction</span>
             <h3 className="text-lg font-bold text-gh-text">{activeSection} is coming soon</h3>
             <p className="max-w-md mx-auto mt-2">We're working on building beautiful visualizations for this section.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepoInsightsTab;
