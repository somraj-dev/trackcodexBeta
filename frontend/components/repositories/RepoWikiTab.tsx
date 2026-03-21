import React, { useState, useEffect } from "react";
import { Repository } from "../../types";

interface RepoWikiTabProps {
  repo: Repository;
}

const RepoWikiTab: React.FC<RepoWikiTabProps> = ({ repo }) => {
  const [pages, setPages] = useState<{ slug: string; title: string }[]>([]);
  const [activeSlug, setActiveSlug] = useState<string>("Home");
  const [content, setContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageSearch, setPageSearch] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchPages();
  }, [repo.id]);

  useEffect(() => {
    if (activeSlug) fetchPageContent(activeSlug);
  }, [activeSlug, repo.id]);

  const fetchPages = async () => {
    try {
      const res = await fetch(`/api/v1/repositories/${repo.id}/wiki/pages`);
      if (res.ok) {
        const data = await res.json();
        setPages(data);
        if (data.length > 0 && !data.find((p: any) => p.slug === "Home")) {
          setActiveSlug(data[0].slug);
        }
      }
    } catch (e) {
      console.error("Failed to fetch pages", e);
    }
  };

  const fetchPageContent = async (slug: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/repositories/${repo.id}/wiki/pages/${slug}`,
      );
      if (res.ok) {
        const data = await res.json();
        setContent(data.content);
        setEditVal(data.content);
      } else {
        setContent("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await fetch(`/api/v1/repositories/${repo.id}/wiki/pages/${activeSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editVal }),
      });
      setIsEditing(false);
      fetchPageContent(activeSlug);
    } catch (e) {
      alert("Failed to save page");
    }
  };

  return (
    <div className="flex gap-8 p-6">
      {/* Wiki Sidebar */}
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? "w-[40px]" : "w-[280px]"} text-sm hidden md:block`}>
        {!isSidebarCollapsed ? (
          <div className="bg-gh-bg border border-gh-border rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gh-bg-secondary px-4 py-2 border-b border-gh-border flex items-center justify-between">
              <span className="font-bold text-gh-text text-xs uppercase tracking-wider">Pages</span>
              <button onClick={() => setIsSidebarCollapsed(true)} className="text-gh-text-secondary hover:text-gh-text">
                <span className="material-symbols-outlined !text-[18px]">chevron_left</span>
              </button>
            </div>
            
            <div className="p-3 border-b border-gh-border">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 !text-[16px] text-gh-text-tertiary">search</span>
                <input
                  type="text"
                  placeholder="Filter pages"
                  value={pageSearch}
                  onChange={(e) => setPageSearch(e.target.value)}
                  className="w-full bg-gh-bg-tertiary border border-gh-border rounded-md pl-8 pr-2 py-1.5 text-xs text-gh-text focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <ul className="py-2 max-h-[600px] overflow-y-auto custom-scrollbar">
              {(() => {
                const filtered = pages.filter(p => p.title.toLowerCase().includes(pageSearch.toLowerCase()));
                
                // Build a nested structure
                const tree: any = {};
                filtered.forEach(page => {
                  const parts = page.slug.split('/');
                  let curr = tree;
                  parts.forEach((part, i) => {
                    if (i === parts.length - 1) {
                      curr[part] = { type: 'page', page };
                    } else {
                      if (!curr[part]) curr[part] = { type: 'folder', children: {} };
                      curr = curr[part].children;
                    }
                  });
                });

                const renderTree = (node: any, depth = 0) => {
                  return Object.entries(node).map(([key, value]: [string, any]) => {
                    if (value.type === 'page') {
                      return (
                        <li
                          key={value.page.slug}
                          onClick={() => setActiveSlug(value.page.slug)}
                          className={`px-4 py-2 cursor-pointer text-xs flex items-center gap-2 transition-colors ${
                            activeSlug === value.page.slug
                              ? "bg-primary/10 text-primary font-bold border-l-2 border-primary"
                              : "text-gh-text-secondary hover:bg-gh-bg-tertiary hover:text-gh-text"
                          }`}
                          style={{ paddingLeft: `${16 + depth * 12}px` }}
                        >
                          <span className="material-symbols-outlined !text-[14px] opacity-60">description</span>
                          <span className="truncate">{value.page.title}</span>
                        </li>
                      );
                    } else {
                      return (
                        <React.Fragment key={key}>
                          <li 
                            className="px-4 py-1.5 text-[10px] uppercase font-bold text-gh-text-tertiary flex items-center gap-1 opacity-70 sticky top-0 bg-gh-bg z-10"
                            style={{ paddingLeft: `${16 + depth * 12}px` }}
                          >
                            <span className="material-symbols-outlined !text-[12px]">folder</span>
                            {key}
                          </li>
                          {renderTree(value.children, depth + 1)}
                        </React.Fragment>
                      );
                    }
                  });
                };

                return renderTree(tree);
              })()}
              {pages.length === 0 && <li className="px-4 py-3 text-center text-gh-text-tertiary italic">No pages found</li>}
            </ul>

            <div className="p-3 border-t border-gh-border">
              <button
                className="w-full flex items-center gap-2 text-xs font-bold text-gh-text-secondary hover:text-primary transition-colors py-1 px-1"
                onClick={() => {
                  const newTitle = prompt("Enter page title:");
                  if (newTitle) {
                    const slug = newTitle.replace(/\s+/g, "-");
                    setPages([...pages, { slug, title: newTitle }]);
                    setActiveSlug(slug);
                    setIsEditing(true);
                    setEditVal(`# ${newTitle}\n\nNew page content.`);
                  }
                }}
              >
                <span className="material-symbols-outlined !text-[16px]">add</span>
                Add a custom page
              </button>
            </div>

            <div className="bg-gh-bg-secondary p-4 border-t border-gh-border">
              <div className="text-gh-text-secondary font-bold text-[10px] uppercase mb-2 tracking-widest text-center">
                Clone Wiki
              </div>
              <div className="flex items-center bg-gh-bg border border-gh-border rounded-md overflow-hidden p-1">
                <input
                  type="text"
                  aria-label="Wiki Clone URL"
                  value={`https://trackcodex.dev/${repo.name}.wiki.git`}
                  readOnly
                  className="w-full bg-transparent text-[10px] text-gh-text-tertiary px-2 py-1 focus:outline-none"
                />
                <button 
                  onClick={() => navigator.clipboard.writeText(`https://trackcodex.dev/${repo.name}.wiki.git`)}
                  className="p-1 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined !text-[14px]">content_copy</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsSidebarCollapsed(false)}
            className="flex flex-col items-center gap-4 py-4 bg-gh-bg border border-gh-border rounded-lg text-gh-text-secondary hover:text-primary transition-all shadow-sm"
          >
            <span className="material-symbols-outlined">menu_open</span>
            <span className="[writing-mode:vertical-lr] text-[10px] uppercase font-bold tracking-widest">Pages</span>
          </button>
        )}
      </div>

      {/* Wiki Content */}
      <div className="flex-1 min-h-[400px]">
        <div className="flex items-center justify-between border-b border-[#1E232E] pb-4 mb-6">
          <h1 className="text-3xl font-normal text-[#c9d1d9]">
            {activeSlug.replace(/-/g, " ")}
          </h1>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 bg-[#1f6feb] border border-[#1f6feb] text-white rounded-md text-sm font-bold hover:bg-[#388bfd] transition-colors"
            >
              Edit Page
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 bg-[#11141A] border border-[#1E232E] text-[#c9d1d9] rounded-md text-sm font-bold hover:bg-[#30363d] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 bg-[#238636] border border-[#238636] text-white rounded-md text-sm font-bold hover:bg-[#2ea043] transition-colors"
              >
                Save Page
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-10 text-[#888888]">
            Loading content...
          </div>
        ) : isEditing ? (
          <>
            <label htmlFor="wiki-content" className="sr-only">
              Wiki page content
            </label>
            <textarea
              id="wiki-content"
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              className="w-full h-[500px] bg-[#0A0D14] border border-[#1E232E] rounded-md p-4 text-[#c9d1d9] font-mono focus:border-[#58a6ff] focus:outline-none resize-none"
              aria-label="Edit wiki page content"
            />
          </>
        ) : (
          <div className="prose prose-invert max-w-none text-[#c9d1d9] space-y-4 whitespace-pre-wrap">
            {content}
          </div>
        )}
      </div>
    </div>
  );
};

export default RepoWikiTab;



