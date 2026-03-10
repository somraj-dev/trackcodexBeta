import React, { useState } from 'react';

interface ManagedCommunity {
    id: string;
    name: string;
    slug: string;
    description: string;
    avatar: string;
    isStarred: boolean;
    isJoined: boolean;
}

const MOCK_COMMUNITIES: ManagedCommunity[] = [
    {
        id: '1',
        name: 'r/ProgrammerHumor',
        slug: 'ProgrammerHumor',
        description: 'For anything funny related to programming and software development.',
        avatar: 'https://styles.redditmedia.com/t5_2tex6/styles/communityIcon_vbd689m1ktq21.png',
        isStarred: true,
        isJoined: true
    },
    {
        id: '2',
        name: 'r/programming',
        slug: 'programming',
        description: 'Computer Programming',
        avatar: 'https://styles.redditmedia.com/t5_2fwo/styles/communityIcon_188z7y8si7811.png',
        isStarred: false,
        isJoined: true
    },
    {
        id: '3',
        name: 'r/somraj',
        slug: 'somraj',
        description: 'somraj',
        avatar: 'https://picsum.photos/seed/som/32',
        isStarred: false,
        isJoined: true
    }
];

const ManageCommunities = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
    const [communities, setCommunities] = useState<ManagedCommunity[]>(MOCK_COMMUNITIES);

    const toggleStar = (id: string) => {
        setCommunities(prev => prev.map(c =>
            c.id === id ? { ...c, isStarred: !c.isStarred } : c
        ));
    };

    const toggleJoined = (id: string) => {
        setCommunities(prev => prev.map(c =>
            c.id === id ? { ...c, isJoined: !c.isJoined } : c
        ));
    };

    const filteredCommunities = communities.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' || (activeTab === 'favorites' && c.isStarred);
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

                    {/* Communities List */}
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
                                        className={`material-symbols-outlined !text-[20px] transition-colors ${community.isStarred ? 'text-yellow-500 filled' : 'text-[#575757] hover:text-[#A1A1AA]'
                                            }`}
                                    >
                                        star
                                    </button>
                                    <button
                                        onClick={() => toggleJoined(community.id)}
                                        className={`px-4 py-1.5 rounded-full border border-[#343536] text-[12px] font-black tracking-tight transition-all ${community.isJoined
                                                ? 'text-white bg-transparent hover:border-white'
                                                : 'bg-white text-black hover:bg-[#D7DADC]'
                                            }`}
                                    >
                                        {community.isJoined ? 'Joined' : 'Join'}
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
