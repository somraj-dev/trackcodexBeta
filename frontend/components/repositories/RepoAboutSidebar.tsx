import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/infra/api";
import { Repository } from "../../types";

interface RepoAboutSidebarProps {
  repo: Repository;
}

interface SidebarContributor {
  id: string;
  username: string;
}

interface Language {
  name: string;
  percentage: number;
  color: string;
}

interface SidebarRelease {
  tag_name: string;
  published_at: string;
}

const RepoAboutSidebar: React.FC<RepoAboutSidebarProps> = ({ repo }) => {
  const [contributors, setContributors] = useState<SidebarContributor[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [releases, setReleases] = useState<SidebarRelease[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Modal State
  // Inline Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState(repo.description || "");
  const [editWebsite, setEditWebsite] = useState(repo.website || "");
  const [editTopics, setEditTopics] = useState(repo.topics?.join(" ") || "");
  const [includeReleases, setIncludeReleases] = useState(repo.settings?.includeReleases ?? true);
  const [includeDeployments, setIncludeDeployments] = useState(repo.settings?.includeDeployments ?? true);
  const [includePackages, setIncludePackages] = useState(repo.settings?.includePackages ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditDescription(repo.description || "");
    setEditWebsite(repo.website || "");
    setEditTopics(repo.topics?.join(" ") || "");
    setIncludeReleases(repo.settings?.includeReleases ?? true);
    setIncludeDeployments(repo.settings?.includeDeployments ?? true);
    setIncludePackages(repo.settings?.includePackages ?? true);
  }, [repo]);

  useEffect(() => {
    const fetchSidebarData = async () => {
      setLoading(true);
      try {
        const [contribData, langData, releasesData] = await Promise.all([
          api.repositories.getContributors(repo.id).catch(() => []),
          api.repositories.getLanguages(repo.id).catch(() => []),
          api.repositories.getReleases(repo.id).catch(() => []),
        ]);
        setContributors(contribData || []);
        // Process language array if needed
        setLanguages(langData || []);
        setReleases(releasesData || []);
      } catch (err) {
        console.error("Failed to load sidebar data", err);
      } finally {
        setLoading(false);
      }
    };

    if (repo?.id) {
      fetchSidebarData();
    }
  }, [repo?.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedTopics = editTopics.split(/\s+/).filter(t => t.length > 0);
      await api.repositories.update(repo.id, {
        description: editDescription,
        website: editWebsite,
        topics: updatedTopics,
        settings: {
          ...repo.settings,
          includeReleases,
          includeDeployments,
          includePackages
        }
      });
      setIsEditing(false);
      window.location.reload(); // Refresh to show new data
    } catch (err) {
      console.error("Failed to update repository", err);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const defaultLanguages = [
    { name: "TypeScript", percentage: 85, color: "#3178c6" },
    { name: "CSS", percentage: 10, color: "#563d7c" },
    { name: "HTML", percentage: 5, color: "#e34c26" },
  ];

  const displayLanguages = languages.length > 0 ? languages : defaultLanguages;

  return (
    <div className="flex flex-col gap-6">
      {/* About Section */}
      <div className="pb-6 border-b border-gh-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-gh-text">About</h2>
          {repo.permissions?.admin && !isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="text-gh-text-secondary hover:text-primary transition-colors"
              title="Edit repository details"
            >
              <span className="material-symbols-outlined !text-[18px]">settings</span>
            </button>
          )}
        </div>
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gh-text-secondary block mb-1">Description</label>
              <textarea
                id="edit-description"
                title="Description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full bg-gh-bg border border-gh-border rounded-md p-2 text-sm text-gh-text focus:border-primary outline-none"
                rows={3}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gh-text-secondary block mb-1">Website</label>
              <input
                id="edit-website"
                title="Website"
                type="text"
                value={editWebsite}
                onChange={(e) => setEditWebsite(e.target.value)}
                className="w-full bg-gh-bg border border-gh-border rounded-md p-2 text-sm text-gh-text focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gh-text-secondary block mb-1">Topics (space separated)</label>
              <input
                id="edit-topics"
                title="Topics"
                type="text"
                value={editTopics}
                onChange={(e) => setEditTopics(e.target.value)}
                className="w-full bg-gh-bg border border-gh-border rounded-md p-2 text-sm text-gh-text focus:border-primary outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-1.5 bg-[#238636] text-white rounded-md text-sm font-bold hover:bg-[#2ea043] transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 bg-gh-bg-tertiary text-gh-text rounded-md text-sm font-bold hover:bg-gh-border transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gh-text-secondary text-sm mb-4">
              {repo.description || "No description, website, or topics provided."}
            </p>

            {repo.topics && repo.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {repo.topics.map((topic: string) => (
                  <a
                    key={topic}
                    href={`/topics/${topic}`}
                    className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full hover:bg-primary hover:text-white transition-colors"
                  >
                    {topic}
                  </a>
                ))}
              </div>
            )}
          </>
        )}

        <div className="flex flex-col gap-2 text-sm text-gh-text-secondary">
          <a href="#" className="flex items-center gap-2 hover:text-primary transition-colors">
            <span className="material-symbols-outlined !text-[18px]">menu_book</span>
            Readme
          </a>
          <a href="#" className="flex items-center gap-2 hover:text-primary transition-colors">
            <span className="material-symbols-outlined !text-[18px]">gavel</span>
            {repo.license || "MIT license"}
          </a>
          <a href="#" className="flex items-center gap-2 hover:text-primary transition-colors">
            <span className="material-symbols-outlined !text-[18px]">visibility</span>
            <span className="font-bold text-gh-text">{repo.watchers || 0}</span> watching
          </a>
          <a href="#" className="flex items-center gap-2 hover:text-primary transition-colors">
            <span className="material-symbols-outlined !text-[18px]">fork_right</span>
            <span className="font-bold text-gh-text">{repo.forks || 0}</span> forks
          </a>
          <a href="#" className="flex items-center gap-2 hover:text-primary transition-colors">
            <span className="material-symbols-outlined !text-[18px]">star</span>
            <span className="font-bold text-gh-text">{repo.stars || 0}</span> stars
          </a>
          {repo.website && (
            <a href={repo.website.startsWith('http') ? repo.website : `https://${repo.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline mt-1">
              <span className="material-symbols-outlined !text-[18px]">link</span>
              {repo.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
      </div>

      {/* Releases Section */}
      {(repo.settings?.includeReleases !== false) && (
        <div className="pb-6 border-b border-gh-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-gh-text hover:text-primary cursor-pointer transition-colors">
              Releases
              <span className="ml-2 bg-gh-bg-secondary px-2 py-0.5 rounded-full text-xs font-medium border border-gh-border text-gh-text-secondary">
                {releases.length}
              </span>
            </h2>
          </div>
          {releases.length > 0 ? (
            <div className="mt-3">
              <a href="#" className="flex items-center gap-2 text-primary font-bold hover:underline mb-1">
                <span className="material-symbols-outlined !text-[18px] text-green-500">label</span>
                {releases[0].tag_name || "v1.0.0"}
              </a>
              <p className="text-xs text-gh-text-secondary mb-2">
                Latest release • {new Date(releases[0].published_at || Date.now()).toLocaleDateString()}
              </p>
              <a href="#" className="text-xs text-gh-text-secondary hover:text-primary transition-colors">
                + {releases.length - 1} releases
              </a>
            </div>
          ) : (
            <p className="text-sm text-gh-text-secondary mt-2">
              No releases published
            </p>
          )}
        </div>
      )}

      {/* Packages Section */}
      {(repo.settings?.includePackages !== false) && (
        <div className="pb-6 border-b border-gh-border">
          <h2 className="text-base font-bold text-gh-text hover:text-primary cursor-pointer transition-colors mb-2">
            Packages
          </h2>
          <p className="text-sm text-gh-text-secondary">
            No packages published
          </p>
        </div>
      )}

      {/* Deployments Section */}
      {(repo.settings?.includeDeployments !== false) && (
        <div className="pb-6 border-b border-gh-border transition-all animate-in fade-in duration-500">
          <h2 className="text-base font-bold text-gh-text hover:text-primary cursor-pointer transition-colors mb-2">
            Deployments
          </h2>
          <div className="flex items-center gap-2 text-sm text-gh-text-secondary">
            <span className="material-symbols-outlined !text-[18px] text-green-500">check_circle</span>
            <span>No deployments yet</span>
          </div>
        </div>
      )}

      {/* Contributors Section */}
      <div className="pb-6 border-b border-gh-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gh-text hover:text-primary cursor-pointer transition-colors">
            Contributors
            <span className="ml-2 bg-gh-bg-secondary px-2 py-0.5 rounded-full text-xs font-medium border border-gh-border text-gh-text-secondary">
              {contributors.length || 1}
            </span>
          </h2>
        </div>
        
        <div className="flex items-center flex-wrap gap-2">
           {loading ? (
             <div className="size-8 rounded-full bg-gh-bg-tertiary animate-pulse"></div>
           ) : contributors.length > 0 ? (
             contributors.slice(0, 11).map((contributor) => (
              <Link 
                key={contributor.id} 
                to={`/profile/${contributor.username}`}
                title={contributor.username}
                className="size-8 rounded-full overflow-hidden border border-gh-border hover:border-primary transition-colors flex items-center justify-center bg-gh-bg-tertiary"
              >
                <div 
                  className="w-full h-full opacity-60 dynamic-gradient"
                  style={{ 
                    "--dynamic-gradient": `linear-gradient(135deg, hsl(${Math.abs(contributor.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 360}, 70%, 50%), hsl(${(Math.abs(contributor.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) + 40) % 360}, 70%, 50%))` 
                  } as React.CSSProperties}
                ></div>
                <span className="absolute text-[10px] font-black text-white uppercase">
                  {contributor.username[0]}
                </span>
              </Link>
             ))
           ) : (
             <Link 
                to={`/profile/${repo.owner?.username || 'user'}`}
                title={repo.owner?.username || 'Owner'}
                className="size-8 rounded-full overflow-hidden border border-gh-border hover:border-primary transition-colors bg-primary/20 flex items-center justify-center text-xs font-bold text-white uppercase"
              >
                {(repo.owner?.username || 'U')[0]}
              </Link>
           )}
           
           {contributors.length > 11 && (
             <Link 
                to={`/repo/${repo.id}/contributors`}
                className="text-xs text-primary hover:underline ml-1"
             >
               +{contributors.length - 11} contributors
             </Link>
           )}
        </div>
      </div>

      {/* Languages Section */}
      <div className="pb-2">
        <h2 className="text-base font-bold text-gh-text mb-3">Languages</h2>
        
        {/* Language Bar */}
        <div className="h-2 w-full rounded-full overflow-hidden flex mb-3 bg-gh-border/20">
          {displayLanguages.map((lang) => (
            <div 
              key={lang.name} 
              className="flex-shrink-0 h-full transition-all duration-700 dynamic-width dynamic-bg"
              style={{ 
                "--dynamic-width": `${lang.percentage}%`, 
                "--dynamic-bg": lang.color 
              } as React.CSSProperties}
              title={`${lang.name} ${lang.percentage}%`}
            ></div>
          ))}
        </div>
        
        {/* Language List */}
        <ul className="flex flex-wrap text-xs gap-x-4 gap-y-2">
          {displayLanguages.map((lang) => (
             <li key={lang.name} className="flex items-center gap-1.5">
               <span 
                 className="size-2 rounded-full dynamic-bg" 
                 style={{ "--dynamic-bg": lang.color } as React.CSSProperties}
               ></span>
               <span className="font-bold text-gh-text">{lang.name}</span>
               <span className="text-gh-text-secondary">{lang.percentage}%</span>
             </li>
          ))}
        </ul>
      </div>

    </div>
  );
};

export default RepoAboutSidebar;
