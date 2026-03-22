import React, { useState, useEffect } from "react";
import { socialService, Post, Community } from "../../services/social/socialService";
import { profileService, UserProfile } from "../../services/activity/profile";
import { realtimeService } from "../../services/infra/realtime-service";
import PostCard from "../../components/community/PostCard";
import { CreateCommunityModal } from "../../components/community/CreateCommunityModal";
import CommunityLeftSidebar from "../../components/community/CommunityLeftSidebar";
import ManageCommunities from "../../components/community/ManageCommunities";
import CreatePostView from "../../components/community/CreatePostView";
import CommunityPage from "../../components/community/CommunityPage";
import { useLocation, useNavigate, Routes, Route } from "react-router-dom";


const CommunityView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Check if we're on a specific community page
  const isCommunityPage = location.pathname.startsWith('/community/') && location.pathname !== '/community/manage' && location.pathname !== '/community/create-post';
  const [view, setView] = useState<'feed' | 'manage' | 'create-post'>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCommunityModal, setShowCreateCommunityModal] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);

  const loadCommunities = async () => {
    try {
      const fetchedCommunities = await socialService.getCommunities();
      setCommunities(fetchedCommunities);
    } catch (e) {
      console.error("Failed to load communities:", e);
    }
  };

  useEffect(() => {
    loadFeed();
    loadCommunities();
    setCurrentUser(profileService.getProfile());

    // Check URL for actions
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'create-post') {
      setView('create-post');
      // Clear the param to avoid re-opening on manual refresh after cancel
      navigate('/community', { replace: true });
    }

    // Subscribe to profile updates
    const unsubscribe = profileService.subscribe((updatedProfile) => {
      setCurrentUser(updatedProfile);
    });

    const unsubscribeRealtime = realtimeService.subscribe((event) => {
      if (event.type === "NEW_POST" && event.data) {
        setPosts((prev) => [event.data, ...prev]);
      } else if (event.type === "NEW_COMMENT" && event.data) {
        setPosts((prev) => prev.map(p => {
          if (p.id === event.data.postId) {
            return { ...p, comments: [...(p.comments || []), event.data] };
          }
          return p;
        }));
      } else if (event.type === "POST_LIKED" && event.data) {
        setPosts((prev) => prev.map(p => {
          if (p.id === event.data.postId) {
            return { ...p, likes: Math.max(0, (p.likes || 0) + (event.data.action === "LIKE" ? 1 : -1)) };
          }
          return p;
        }));
      }
    });

    return () => {
      unsubscribe();
      unsubscribeRealtime();
    };
  }, [location.search, navigate]); // Add location.search and navigate to dependencies

  const loadFeed = async () => {
    setLoading(true);
    try {
      const data = await socialService.getFeed();

      // Enhance with mock data to match user's screenshots for demonstration
      const mockPosts: Post[] = [
        {
          id: "m1",
          author: { id: "a1", name: "developersIndia", username: "developersIndia", avatar: "https://styles.redditmedia.com/t5_2sk9r/styles/communityIcon_v0b5j9z6z5z51.png" },
          title: "2025 F CSE grad still unplaced — would appreciate resume feedback",
          content: "I've been searching for roles for 6 months now...",
          mediaUrls: [
            "https://i.redd.it/2z9z9z9z9z9z.png", // Mock resume image
            "https://i.redd.it/abcd1234.png"
          ],
          likes: 57,
          comments: new Array(61),
          awards: 2,
          isPopular: true,
          createdAt: new Date().toISOString(),
          community: { id: "c1", name: "developersIndia", slug: "developersIndia" }
        },
        {
          id: "m2",
          author: { id: "a2", name: "u/HostingerCOM", username: "HostingerCOM", avatar: "https://www.hostinger.com/favicon.ico" },
          title: "Hostinger's self-hosted n8n is on sale - deploy in one click and unlock unlimited workflows",
          content: "Get your n8n instance today!",
          mediaUrl: "https://i.redd.it/promote_h.png",
          likes: 5,
          comments: [],
          isPromoted: true,
          ctaText: "Shop Now",
          createdAt: new Date().toISOString()
        }
      ];

      setPosts([...mockPosts, ...data]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-hidden flex bg-gh-bg transition-colors">
      {/* Left Sidebar */}
      <CommunityLeftSidebar
        user={currentUser}
        communities={communities}
        onStartCommunity={() => setShowCreateCommunityModal(true)}
        onNavigateHome={() => {
          setView('feed');
          loadFeed();
        }}
        onManageCommunities={() => setView('manage')}
      />

      {/* Main Content Area */}
      {isCommunityPage ? (
        <Routes>
          <Route path=":slug" element={<CommunityPage />} />
        </Routes>
      ) : view === 'feed' ? (
        <>
          {/* Main Feed */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-gh-bg">
            <div className="max-w-[740px] mx-auto py-8 px-4">
              {/* Header with Plus Dropdown */}
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gh-text">Community</h1>
                <div className="relative">
                  <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    aria-label="Create menu"
                    className="size-10 rounded-full bg-gh-bg-secondary border border-gh-border flex items-center justify-center text-gh-text hover:border-gh-text transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined !text-[24px]">{showAddMenu ? 'close' : 'add'}</span>
                  </button>

                  {showAddMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowAddMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 rounded-md bg-gh-bg-secondary border border-gh-border shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-200">
                        <button
                          onClick={() => {
                            setView('create-post');
                            setShowAddMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gh-text-secondary hover:bg-gh-bg-tertiary transition-colors"
                        >
                          <span className="material-symbols-outlined !text-[20px]">edit_note</span>
                          Create Post
                        </button>
                        <button
                          onClick={() => {
                            setShowCreateCommunityModal(true);
                            setShowAddMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gh-text-secondary hover:bg-gh-bg-tertiary transition-colors"
                        >
                          <span className="material-symbols-outlined !text-[20px]">groups</span>
                          Create Community
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>


              {/* Feed Posts */}
              <div className="space-y-0">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gh-text-tertiary">
                    <span className="material-symbols-outlined !text-4xl animate-spin mb-4 text-primary">
                      progress_activity
                    </span>
                    <p className="font-bold">Fetching feed...</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-[312px] p-6 hidden xl:block overflow-y-auto">
            {/* Empty or more content can go here later */}
          </div>
        </>
      ) : view === 'manage' ? (
        <ManageCommunities />
      ) : (
        <CreatePostView
          communities={communities}
          onCancel={() => setView('feed')}
          onPostCreated={() => {
            setView('feed');
            loadFeed();
          }}
        />
      )}

      {/* Modals */}

      {showCreateCommunityModal && (
        <CreateCommunityModal
          onClose={() => setShowCreateCommunityModal(false)}
          onCommunityCreated={() => {
            setShowCreateCommunityModal(false);
            loadCommunities();
            loadFeed();
          }}
        />
      )}
    </div>
  );
};

export default CommunityView;
