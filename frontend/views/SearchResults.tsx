import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Star, Heart, Bookmark, MoreHorizontal, ChevronDown, Code, Book, MessageSquare, Users, Globe, Info } from "lucide-react";
import { api } from "../services/infra/api";
import UserProfileCard from "../components/search/UserProfileCard";
import "../styles/SearchResults.css";

interface RepoResult {
  id: string;
  name: string;
  owner: string;
  ownerAvatar?: string;
  description: string;
  stargazers_count: number;
  language?: string;
  updated_at?: string;
  topics?: string[];
  html_url: string;
}

interface UserResult {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  followersCount?: number;
  rank?: number;
  isVerified?: boolean;
  url?: string;
}

type SearchResultItem = RepoResult | UserResult;

interface SearchApiResponse {
  results: {
    id: string;
    type?: string;
    label: string;
    subLabel?: string;
    url?: string;
    metadata?: {
      owner?: string;
      username?: string;
      avatar?: string;
      stars?: number;
      language?: string;
      updatedAt?: string;
      topics?: string[];
      bio?: string;
      followersCount?: number;
      rank?: number;
    };
  }[];
}

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || "repositories";

  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  
  const searchRequestId = useRef(0);
  const lastSearchRef = useRef("");

  const performSearch = useCallback(async (q: string, t: string) => {
    // Prevent redundant searches if the query and type haven't changed
    const searchKey = `${q}:${t}`;
    if (lastSearchRef.current === searchKey) return;
    lastSearchRef.current = searchKey;

    const currentId = ++searchRequestId.current;
    
    // Defer setLoading to avoid cascading render warning in useEffect
    setTimeout(() => {
      if (currentId === searchRequestId.current) {
        setLoading(true);
      }
    }, 0);

    const startTime = performance.now();
    
    try {
      const backendType = t === "repositories" ? "repo" : t;
      const response = await api.get<SearchApiResponse>(
        `/search?q=${encodeURIComponent(q)}&type=${backendType}`
      );

      if (currentId === searchRequestId.current) {
        const mappedResults: SearchResultItem[] = (response.results || []).map((r) => {
          if (t === "users" || r.type === "user") {
            return {
              id: r.id,
              name: r.label,
              username: r.metadata?.username || r.label.toLowerCase().replace(/\s+/g, ""),
              avatar: r.metadata?.avatar,
              bio: r.metadata?.bio || r.subLabel,
              followersCount: r.metadata?.followersCount || 0,
              rank: r.metadata?.rank || 48,
              isVerified: true, // Show verified badge as requested
              url: r.url
            } as UserResult;
          }

          return {
            id: r.id,
            name: r.label,
            owner: r.metadata?.owner || "unknown",
            ownerAvatar: r.metadata?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${r.metadata?.owner || 'owner'}`,
            description: r.subLabel || "",
            stargazers_count: r.metadata?.stars || 0,
            language: r.metadata?.language || "",
            updated_at: r.metadata?.updatedAt || new Date().toISOString(),
            topics: r.metadata?.topics || [],
            html_url: r.url || `/repo/${r.id}`
          } as RepoResult;
        });

        setResults(mappedResults);
        setTotalCount(mappedResults.length);
        setSearchTime(Math.round(performance.now() - startTime));
        setLoading(false);
      }
    } catch (error) {
      console.error("Search error:", error);
      if (currentId === searchRequestId.current) {
        setLoading(false);
        setResults([]);
      }
    }
  }, []);

  useEffect(() => {
    if (query && query.trim().length >= 2) {
      performSearch(query, type);
    } else {
      setResults([]);
      setTotalCount(0);
      setLoading(false);
      lastSearchRef.current = "";
    }
  }, [query, type, performSearch]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "recently";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleTypeChange = (newType: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("type", newType);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="search-page-container bg-gh-bg min-h-screen text-gh-text">
      <div className="w-full px-6 py-8 flex gap-8">
        
        {/* Left Sidebar: Filters */}
        <aside className="w-[240px] flex-shrink-0">
          <div className="mb-0">
            <h3 className="text-[12px] font-semibold text-gh-text-secondary uppercase mb-3 px-2 tracking-wider">Filter by</h3>
            <nav className="space-y-0.5">
              {[
                { name: "Code", type: "code", icon: <Code size={18} /> },
                { name: "Repositories", type: "repositories", icon: <Book size={18} /> },
                { name: "Issues", type: "issues", icon: <Info size={18} /> },
                { name: "Pull requests", type: "pulls", icon: <Globe size={18} /> },
                { name: "Discussions", type: "discussions", icon: <MessageSquare size={18} /> },
                { name: "Users", type: "users", icon: <Users size={18} /> },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleTypeChange(item.type)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[14px] transition-all duration-200 ${
                    type === item.type 
                      ? "bg-gh-bg-secondary font-semibold border-l-2 border-primary text-gh-text" 
                      : "text-gh-text-secondary hover:bg-gh-bg-tertiary hover:text-gh-text"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-gh-text-secondary">{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                  <span className="text-[11px] font-medium text-gh-text-secondary bg-gh-bg-tertiary px-2 py-0.5 rounded-full">
                    {item.type === "repositories" ? "7.4k" : "2k"}
                  </span>
                </button>
              ))}
              <button className="w-full flex items-center gap-2 px-3 py-2 text-[14px] text-gh-text-secondary hover:text-gh-text transition-colors">
                <ChevronDown size={16} />
                <span>More</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content: Results */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gh-border">
            <div className="flex items-center gap-3">
              <h2 className="text-[20px] font-semibold tracking-tight">
                {loading ? "Searching..." : `${totalCount.toLocaleString()} results`} 
                {!loading && <span className="text-[13px] font-normal text-gh-text-secondary ml-2 tracking-normal opacity-80">({searchTime} ms)</span>}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gh-bg-secondary border border-gh-border rounded-md px-3 py-1.5 text-[13px] cursor-pointer hover:bg-gh-bg-tertiary transition-all">
                <span className="text-gh-text-secondary mr-1">Sort by:</span>
                <span className="font-semibold">Best match</span>
                <ChevronDown size={14} className="ml-1.5" />
              </div>
              <button title="Save Search" className="flex items-center gap-2 px-3 py-1.5 bg-gh-bg-secondary border border-gh-border rounded-md text-[13px] font-semibold hover:bg-gh-bg-tertiary transition-all shadow-sm">
                <Bookmark size={14} />
                Save
              </button>
              <button title="More Options" className="p-1 px-2 bg-gh-bg-secondary border border-gh-border rounded-md hover:bg-gh-bg-tertiary transition-all shadow-sm">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-gh-text-secondary">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-6 shadow-blue-500/20 shadow-lg"></div>
                <p className="text-[14px] animate-pulse">Searching through TrackCodex...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="mb-8 max-w-[480px] animate-fade-in">
                  <img 
                    src="/assets/no-results.jpg" 
                    alt="No results illustration" 
                    className="w-full h-auto rounded-2xl opacity-90 shadow-sm"
                  />
                </div>
                <h3 className="text-2xl font-bold mb-3 tracking-tight">No results found for "{query}"</h3>
                <p className="text-gh-text-secondary max-w-[460px] mx-auto text-[15px] leading-relaxed">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <Link 
                  to="/search?q=trackcodex&type=repositories" 
                  className="mt-8 px-6 py-2 bg-gh-bg-secondary border border-gh-border rounded-lg text-[14px] font-semibold hover:bg-gh-bg-tertiary transition-all"
                >
                  Clear filters or search again
                </Link>
              </div>
            ) : (
              <div className={type === "users" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-6"}>
                {results.map((item) => {
                  if (type === "users") {
                    return <UserProfileCard key={item.id} user={item as UserResult} />;
                  }

                  const repo = item as RepoResult;
                  return (
                    <div key={repo.id} className="p-5 border border-gh-border rounded-xl bg-gh-bg hover:border-gh-border-active hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-all relative group">
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-3">
                          <img 
                            src={repo.ownerAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${repo.owner}`} 
                            className="w-6 h-6 rounded-md shadow-sm border border-gh-border" 
                            alt="" 
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${repo.owner}`;
                              (e.currentTarget as HTMLImageElement).onerror = null; // Prevent infinite loop
                            }}
                          />
                          <Link to={repo.html_url} className="text-[16px] text-primary hover:underline font-semibold flex items-center transition-colors">
                            <span className="font-normal mr-0.5 opacity-70">{repo.owner}/</span>
                            {repo.name}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <button className="flex items-center gap-1.5 px-3 py-1 bg-gh-bg-secondary border border-gh-border rounded-md text-[12px] font-bold hover:bg-gh-bg-tertiary transition-all active:scale-95 shadow-sm">
                            <Star size={14} />
                            Star
                          </button>
                          <button className="flex items-center gap-1.5 px-3 py-1 bg-gh-bg-secondary border border-gh-border rounded-md text-[12px] font-bold hover:bg-gh-bg-tertiary transition-all active:scale-95 shadow-sm">
                            <Heart size={14} className="text-pink-500 fill-pink-500/10" />
                            Sponsor
                          </button>
                        </div>
                      </div>

                      <p className="text-[14px] text-gh-text mb-3 leading-relaxed opacity-90">{repo.description}</p>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {(repo.topics || []).map(topic => (
                          <Link key={topic} to={`/search?q=topic:${topic}`} className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-[11px] font-bold hover:bg-primary/20 transition-all border border-primary/20">
                            {topic}
                          </Link>
                        ))}
                      </div>

                      <div className="flex items-center gap-5 text-[12px] text-gh-text-secondary font-medium">
                        {repo.language && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm"></span>
                            {repo.language}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 hover:text-gh-text transition-colors cursor-pointer">
                          <Star size={14} />
                          {repo.stargazers_count}
                        </div>
                        <div className="opacity-70">Updated on {formatDate(repo.updated_at)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>



      </div>
    </div>
  );
};

export default SearchResultsPage;
