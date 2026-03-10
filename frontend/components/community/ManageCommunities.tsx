import React, { useState, useEffect } from 'react';
import { socialService, Community } from '../../services/social/socialService';

const ManageCommunities = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
    const [communities, setCommunities] = useState<Community[]>([]);
    const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCommunities();
    }, []);

    const loadCommunities = async () => {
        setLoading(true);
        try {
            const fetchedCommunities = await socialService.getCommunities();
            setCommunities(fetchedCommunities);
        } catch (e) {
            console.error("Failed to load communities:", e);
        } finally {
            setLoading(false);
        }
    };

    const toggleStar = (id: string) => {
        setStarredIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleJoined = (id: string) => {
        setCommunities(prev => prev.map(c =>
            c.id === id ? { ...c, isMember: !c.isMember } : c
        ));
    };

    const filteredCommunities = communities.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' || (activeTab === 'favorites' && starredIds.has(c.id));
        return matchesSearch && matchesTab;
    });

    return (
        <div className="flex-1 bg-[#030303] flex flex-col md:flex-row h-full overflow-hidden">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="max-w-[800px]">
                    <h1 className="text-4xl font-black text-white mb-8 tracking-tight">Manage communities</h1>

                    {/* Search Bar */}
                    <div className="relative mb-10">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#575757] !text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder="Filter your communities"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-md py-3 pl-12 pr-4 text-white text-[14px] focus:outline-none focus:border-[#333] transition-colors"
                        />
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-10">
                            <span className="material-symbols-outlined animate-spin text-white !text-4xl">progress_activity</span>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {filteredCommunities.map(community => (
                                <div key={community.id} className="flex items-start justify-between group">
                                    <div className="flex items-center gap-4 flex-1">
                                        <img src={community.avatar} alt={community.name} className="size-10 rounded-full" />
                                        <div className="overflow-hidden">
                                            <h3 className="text-[15px] font-bold text-white mb-0.5">{community.name}</h3>
                                            <p className="text-[13px] text-[#A1A1AA] line-clamp-1">{community.description}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => toggleStar(community.id)}
                                            className={`material-symbols-outlined !text-[20px] transition-colors ${starredIds.has(community.id) ? 'text-yellow-500 filled' : 'text-[#575757] hover:text-[#A1A1AA]'
                                                }`}
                                        >
                                            star
                                        </button>
                                        <button
                                            onClick={() => toggleJoined(community.id)}
                                            className={`px-4 py-1.5 rounded-full border border-[#343536] text-[12px] font-black tracking-tight transition-all text-white bg-transparent hover:border-white`}
                                        >
                                            {community.isMember ? 'Joined' : 'Join'}
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {filteredCommunities.length === 0 && (
                                <div className="text-center py-20">
                                    <span className="material-symbols-outlined text-6xl text-[#1A1A1A] mb-4">group_off</span>
                                    <p className="text-[#A1A1AA]">No communities found.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-full md:w-[280px] border-l border-[#1A1A1A] p-6 hidden lg:block">
                <div className="space-y-2">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`w-full text-left px-4 py-3 rounded-lg text-[14px] font-bold transition-colors ${activeTab === 'all' ? 'bg-[#1A1A1B] text-white' : 'text-[#A1A1AA] hover:bg-[#0A0A0A]'
                            }`}
                    >
                        All Communities
                    </button>
                    <button
                        onClick={() => setActiveTab('favorites')}
                        className={`w-full text-left px-4 py-3 rounded-lg text-[14px] font-bold transition-colors ${activeTab === 'favorites' ? 'bg-[#1A1A1B] text-white' : 'text-[#A1A1AA] hover:bg-[#0A0A0A]'
                            }`}
                    >
                        Favorites
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageCommunities;
