import React, { useState, useEffect } from "react";
import { socialService, Post } from "../../services/social/socialService";
import { profileService, UserProfile } from "../../services/activity/profile";
import PostCard from "../../components/community/PostCard";
import { CreatePostModal } from "../../components/community/CreatePostModal";


const CommunityView = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadFeed();
    setCurrentUser(profileService.getProfile());
  }, []);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const data = await socialService.getFeed();

      // Enhance with mock data to match user's screenshots for demonstration
      const mockPosts: Post[] = [
        {
          id: "m1",
          author: { id: "a1", name: "r/developersIndia", username: "developersIndia", avatar: "https://styles.redditmedia.com/t5_2sk9r/styles/communityIcon_v0b5j9z6z5z51.png" },
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
          community: { id: "c1", name: "r/developersIndia", slug: "developersIndia" }
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
    <div className="h-full overflow-hidden flex bg-[#030303]">
      {/* Left Sidebar: Navigation & Communities */}
      <div className="w-64 border-r border-[#1A1A1B] p-4 hidden lg:block overflow-y-auto">
        <div className="space-y-1 mb-8">
          <button className="w-full text-left px-3 py-2 rounded-md bg-[#1A1A1B] text-[#D7DADC] text-sm font-bold border-l-2 border-[#0079D3]">
            Home
          </button>
          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-[#1A1A1B] text-[#818384] text-sm font-medium transition-colors">
            Popular
          </button>
          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-[#1A1A1B] text-[#818384] text-sm font-medium transition-colors">
            Global News
          </button>
        </div>

        <h3 className="px-3 text-xs font-bold text-[#717273] uppercase tracking-wider mb-2">
          Communities
        </h3>
        <div className="space-y-1">
          {["r/rust", "r/reactjs", "r/trackcodex", "r/osint"].map(
            (c) => (
              <button
                key={c}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#1A1A1B] text-[#D7DADC] text-sm transition-colors group"
              >
                <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">r/</div>
                {c}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Main Feed */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#030303]">
        <div className="max-w-[740px] mx-auto py-8 px-4">
          {/* Create Post Widget (Reddit Style) */}
          <div className="bg-[#1A1A1B] border border-[#343536] rounded-md p-3 mb-4 flex items-center gap-2">
            <div className="size-9 rounded-full bg-[#343536] overflow-hidden shrink-0">
              <img src={currentUser?.avatar || "https://ui-avatars.com/api/?name=U"} alt="Avatar" className="size-full object-cover" />
            </div>
            <input
              readOnly
              onClick={() => setShowCreateModal(true)}
              placeholder="Create Post"
              className="flex-1 bg-[#272729] border border-[#343536] rounded-md px-4 py-2 text-sm text-[#D7DADC] hover:bg-[#1A1A1B] hover:border-[#D7DADC] transition-all cursor-pointer"
            />
            <button className="p-2 text-[#818384] hover:bg-[#272729] rounded-md">
              <span className="material-symbols-outlined !text-[24px]">image</span>
            </button>
            <button className="p-2 text-[#818384] hover:bg-[#272729] rounded-md">
              <span className="material-symbols-outlined !text-[24px]">link</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="bg-[#1A1A1B] border border-[#343536] rounded-md p-2 mb-4 flex gap-2">
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#272729] text-[#D7DADC] text-[14px] font-bold">
              <span className="material-symbols-outlined !text-[20px]">rocket</span>
              Best
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-[#272729] text-[#818384] text-[14px] font-bold transition-colors">
              <span className="material-symbols-outlined !text-[20px]">local_fire_department</span>
              Hot
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-[#272729] text-[#818384] text-[14px] font-bold transition-colors">
              <span className="material-symbols-outlined !text-[20px]">new_releases</span>
              New
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-[#272729] text-[#818384] text-[14px] font-bold transition-colors">
              <span className="material-symbols-outlined !text-[20px]">trending_up</span>
              Top
            </button>
          </div>

          {/* Feed */}
          <div className="space-y-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#818384]">
                <span className="material-symbols-outlined !text-4xl animate-spin mb-4 text-[#0079D3]">
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

      {/* Right Sidebar: Trending & Guidelines */}
      <div className="w-[312px] p-6 hidden xl:block overflow-y-auto">
        <div className="bg-[#1A1A1B] border border-[#343536] rounded-md overflow-hidden mb-4">
          <div className="h-8 bg-[#0079D3]"></div>
          <div className="p-4 pt-0 -mt-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white font-bold border-2 border-[#1A1A1B]">TC</div>
              <h4 className="text-[16px] font-bold text-[#D7DADC] mt-4">r/trackcodex</h4>
            </div>
            <p className="text-[12px] text-[#D7DADC] mb-4">
              The official community for TrackCodex developers. Share your projects, get help, and stay updated.
            </p>
            <div className="flex justify-between border-t border-[#343536] py-3 text-[14px]">
              <div>
                <div className="font-bold text-[#D7DADC]">1.2k</div>
                <div className="text-[12px] text-[#717273]">Members</div>
              </div>
              <div>
                <div className="font-bold text-[#D7DADC]">42</div>
                <div className="text-[12px] text-[#717273]">Online</div>
              </div>
            </div>
            <button className="w-full bg-[#D7DADC] hover:bg-[#ebedef] text-[#1A1A1B] font-bold py-1.5 rounded-full text-[14px] transition-colors">
              Create Post
            </button>
          </div>
        </div>

        <div className="bg-[#1A1A1B] border border-[#343536] rounded-md p-4">
          <h3 className="text-xs font-bold text-[#717273] uppercase tracking-widest mb-4">
            Recent Communities
          </h3>
          <div className="space-y-4">
            {[
              { name: "r/reactjs", members: "1.2M", icon: "https://ui-avatars.com/api/?name=R&background=61DAFB" },
              { name: "r/programming", members: "5.4M", icon: "https://ui-avatars.com/api/?name=P&background=FF4500" },
              { name: "r/developer", members: "234k", icon: "https://ui-avatars.com/api/?name=D&background=3fb950" },
            ].map((r) => (
              <div
                key={r.name}
                className="flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <img src={r.icon} className="size-8 rounded-full" alt={r.name} />
                  <div>
                    <div className="text-[12px] font-bold text-[#D7DADC] group-hover:underline">
                      {r.name}
                    </div>
                    <div className="text-[10px] text-[#717273]">
                      {r.members} members
                    </div>
                  </div>
                </div>
                <button className="bg-[#D7DADC] hover:bg-[#ebedef] text-[#1A1A1B] text-[12px] font-bold px-3 py-1 rounded-full transition-colors">
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onPostCreated={() => {
            loadFeed();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

export default CommunityView;
