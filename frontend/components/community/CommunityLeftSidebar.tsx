import React, { useState } from 'react';
import { UserProfile } from '../../services/activity/profile';

interface Community {
    id: string;
    name: string;
    slug: string;
    avatar?: string;
    isStarred?: boolean;
}

interface CommunityLeftSidebarProps {
    user: UserProfile | null;
    onStartCommunity: () => void;
    onNavigateHome: () => void;
    onManageCommunities: () => void;
}

const CommunityLeftSidebar: React.FC<CommunityLeftSidebarProps> = ({
    user,
    onStartCommunity,
    onNavigateHome,
    onManageCommunities
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [recentCommunities] = useState<Community[]>([
        { id: '1', name: 'r/somraj', slug: 'somraj', avatar: 'https://picsum.photos/seed/som/32' }
    ]);
    const [myCommunities, setMyCommunities] = useState<Community[]>([
        { id: '2', name: 'r/ProgrammerH...', slug: 'ProgrammerHumor', avatar: 'https://picsum.photos/seed/ph/32', isStarred: true },
        { id: '3', name: 'r/programming', slug: 'programming', avatar: 'https://picsum.photos/seed/pg/32', isStarred: false },
        { id: '4', name: 'r/somraj', slug: 'somraj', avatar: 'https://picsum.photos/seed/som/32', isStarred: true }
    ]);

    const toggleStar = (id: string, section: 'recent' | 'my') => {
        if (section === 'my') {
            setMyCommunities(prev => prev.map(c => c.id === id ? { ...c, isStarred: !c.isStarred } : c));
        }
    };

    const navItems = [
        { label: 'Home', icon: 'home', onClick: onNavigateHome },
        { label: 'Popular', icon: 'trending_up', onClick: () => { } },
        { label: 'News', icon: 'newspaper', onClick: () => { } },
        { label: 'Explore', icon: 'explore', onClick: () => { } },
    ];

    return (
        <div
            className={`h-full bg-[#030303] border-r border-[#1A1A1A] transition-all duration-300 flex flex-col ${isCollapsed ? 'w-[70px]' : 'w-[260px]'
                }`}
        >
            {/* Header & Toggle */}
            <div className={`p-4 flex items-center justify-between ${isCollapsed ? 'justify-center' : ''}`}>
                {!isCollapsed && (
                    <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-white font-black text-xl">T</div>
                        <span className="font-bold text-white tracking-tight">TrackCodex</span>
                    </div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="size-8 rounded-md hover:bg-[#1A1A1A] flex items-center justify-center text-[#A1A1AA] transition-colors"
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <span className="material-symbols-outlined !text-[20px]">menu</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-6 py-4">
                {/* Main Nav */}
                <div className="space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={item.onClick}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1A1A1B] text-[#D7DADC] transition-colors group ${isCollapsed ? 'justify-center' : ''
                                }`}
                        >
                            <span className="material-symbols-outlined !text-[22px] group-hover:text-white transition-colors">{item.icon}</span>
                            {!isCollapsed && <span className="text-sm font-medium group-hover:text-white">{item.label}</span>}
                        </button>
                    ))}

                    <button
                        onClick={onStartCommunity}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1A1A1B] text-[#D7DADC] transition-colors group ${isCollapsed ? 'justify-center' : ''
                            }`}
                    >
                        <span className="material-symbols-outlined !text-[22px] group-hover:text-white">add</span>
                        {!isCollapsed && <span className="text-sm font-medium group-hover:text-white">Start a community</span>}
                    </button>
                </div>

                {/* Recent Section */}
                {!isCollapsed && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#575757]">Recent</span>
                            <span className="material-symbols-outlined text-[16px] text-[#575757]">expand_more</span>
                        </div>
                        <div className="space-y-1">
                            {recentCommunities.map(community => (
                                <div key={community.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1A1A1B] cursor-pointer group">
                                    <img src={community.avatar} className="size-6 rounded-full" alt="" />
                                    <span className="text-sm text-[#D7DADC] truncate">{community.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Communities Section */}
                {!isCollapsed && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#575757]">Communities</span>
                            <span className="material-symbols-outlined text-[16px] text-[#575757]">expand_more</span>
                        </div>
                        <div className="space-y-1">
                            <div
                                onClick={onManageCommunities}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1A1A1B] cursor-pointer group"
                            >
                                <span className="material-symbols-outlined text-[20px] text-[#D7DADC]">settings</span>
                                <span className="text-sm text-[#D7DADC]">Manage Communities</span>
                            </div>
                            {myCommunities.map(community => (
                                <div key={community.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#1A1A1B] cursor-pointer group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <img src={community.avatar} className="size-6 rounded-full" alt="" />
                                        <span className="text-sm text-[#D7DADC] truncate">{community.name}</span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleStar(community.id, 'my');
                                        }}
                                        className={`material-symbols-outlined !text-[18px] transition-colors ${community.isStarred ? 'text-yellow-500 filled' : 'text-[#575757] group-hover:text-[#A1A1AA]'
                                            }`}
                                    >
                                        star
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Collapsed view icons for sections */}
                {isCollapsed && (
                    <div className="space-y-4 pt-4 border-t border-[#1A1A1A] flex flex-col items-center">
                        <span className="material-symbols-outlined text-[#575757]">history</span>
                        <span className="material-symbols-outlined text-[#575757]">group</span>
                    </div>
                )}
            </div>

            {/* User Profile Section */}
            <div className={`p-4 border-t border-[#1A1A1A] transition-all duration-300 ${isCollapsed ? 'flex justify-center' : ''}`}>
                {user ? (
                    <div className={`flex items-center gap-3 ${isCollapsed ? '' : 'px-2 py-1.5 rounded-lg hover:bg-[#1A1A1B] cursor-pointer'}`}>
                        <img
                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}`}
                            className="size-8 rounded-full border border-[#343536] object-cover"
                            alt=""
                        />
                        {!isCollapsed && (
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-bold text-white truncate">{user.name}</p>
                                <p className="text-[11px] text-[#A1A1AA] truncate">{user.username}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="size-8 rounded-full bg-[#1A1A1A] animate-pulse" />
                )}
            </div>
        </div>
    );
};

export default CommunityLeftSidebar;
