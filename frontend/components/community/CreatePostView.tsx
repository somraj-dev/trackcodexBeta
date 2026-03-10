import React, { useState } from 'react';
import { socialService, Community } from '../../services/social/socialService';

interface CreatePostViewProps {
    onCancel: () => void;
    onPostCreated: () => void;
    communities: Community[];
    initialTab?: 'text' | 'image' | 'link' | 'poll';
}

const CreatePostView: React.FC<CreatePostViewProps> = ({ onCancel, onPostCreated, communities, initialTab = 'text' }) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
    const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const tabs = [
        { id: 'text', icon: 'notes', label: 'Text' },
        { id: 'image', icon: 'image', label: 'Images & Video' },
        { id: 'link', icon: 'link', label: 'Link' },
        { id: 'poll', icon: 'poll', label: 'Poll' },
    ];

    const handleSubmit = async () => {
        if (!title.trim() || !selectedCommunity) return;
        setLoading(true);
        try {
            let finalContent = content;
            if (activeTab === 'link') finalContent = linkUrl;

            await socialService.createPost({
                title: title.trim(),
                content: finalContent,
                type: activeTab,
                communityId: selectedCommunity.id
            });
            onPostCreated();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#030303] animate-in fade-in duration-300">
            <div className="max-w-[740px] mx-auto py-8 px-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#1A1A1B] mb-6">
                    <h1 className="text-xl font-bold text-white">Create post</h1>
                    <button className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">Drafts</button>
                </div>

                {/* Community Selector */}
                <div className="relative mb-6">
                    <button
                        onClick={() => setShowCommunityDropdown(!showCommunityDropdown)}
                        className="flex items-center gap-2 bg-[#1A1A1B] hover:bg-[#272729] border border-[#343536] rounded-full px-4 py-2 transition-colors min-w-[200px]"
                    >
                        {selectedCommunity ? (
                            <>
                                <img src={selectedCommunity.avatar || `https://ui-avatars.com/api/?name=${selectedCommunity.name}`} className="size-5 rounded-full" alt="" />
                                <span className="text-[14px] font-bold text-white">{selectedCommunity.name}</span>
                            </>
                        ) : (
                            <>
                                <div className="size-5 rounded-full bg-[#343536] flex items-center justify-center">
                                    <span className="material-symbols-outlined !text-[14px] text-white">groups</span>
                                </div>
                                <span className="text-[14px] font-bold text-[#D7DADC]">Select a community</span>
                            </>
                        )}
                        <span className="material-symbols-outlined !text-[20px] ml-auto text-[#D7DADC]">expand_more</span>
                    </button>

                    {showCommunityDropdown && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowCommunityDropdown(false)} />
                            <div className="absolute top-full left-0 mt-2 w-[300px] bg-[#1A1A1B] border border-[#343536] rounded-md shadow-2xl z-50 py-2">
                                <p className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#575757]">Your Communities</p>
                                {communities.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => {
                                            setSelectedCommunity(c);
                                            setShowCommunityDropdown(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#272729] transition-colors"
                                    >
                                        <img src={c.avatar || `https://ui-avatars.com/api/?name=${c.name}`} className="size-6 rounded-full" alt="" />
                                        <span className="text-sm text-[#D7DADC] font-medium">{c.name}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Tabbed Editor Box */}
                <div className="bg-[#1A1A1B] border border-[#343536] rounded-md overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-[#343536]">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold transition-colors border-b-2 hover:bg-[#272729] ${activeTab === tab.id
                                    ? 'text-white border-white'
                                    : 'text-[#818384] border-transparent'
                                    }`}
                            >
                                <span className="material-symbols-outlined !text-[20px]">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-4 space-y-4">
                        {/* Title Input */}
                        <div className="relative">
                            <textarea
                                value={title}
                                onChange={(e) => setTitle(e.target.value.substring(0, 300))}
                                placeholder="Title*"
                                className="w-full bg-transparent border border-[#343536] rounded-md px-4 py-2 text-[14px] text-white placeholder-[#818384] focus:outline-none focus:border-white transition-all min-h-[40px] resize-none"
                            />
                            <span className="absolute bottom-2 right-2 text-[10px] text-[#818384]">{title.length}/300</span>
                        </div>

                        {/* Tag button */}
                        <button className="flex items-center gap-2 px-3 py-1 bg-[#272729] hover:bg-[#343536] border border-[#343536] rounded-full text-xs font-bold text-[#D7DADC] transition-colors">
                            <span className="material-symbols-outlined !text-[16px]">add</span>
                            Add tags
                        </button>

                        {/* Tab-specific Content */}
                        <div className="min-h-[200px]">
                            {activeTab === 'text' && (
                                <div className="border border-[#343536] rounded-md overflow-hidden bg-[#030303]">
                                    <div className="flex items-center gap-4 px-3 py-2 border-b border-[#343536] bg-[#1A1A1B]">
                                        <span className="material-symbols-outlined !text-[18px] text-[#818384] cursor-pointer hover:text-white">format_bold</span>
                                        <span className="material-symbols-outlined !text-[18px] text-[#818384] cursor-pointer hover:text-white">format_italic</span>
                                        <span className="material-symbols-outlined !text-[18px] text-[#818384] cursor-pointer hover:text-white">link</span>
                                        <span className="material-symbols-outlined !text-[18px] text-[#818384] cursor-pointer hover:text-white">image</span>
                                        <div className="w-px h-4 bg-[#343536]" />
                                        <span className="material-symbols-outlined !text-[18px] text-[#818384] cursor-pointer hover:text-white">format_list_bulleted</span>
                                        <span className="material-symbols-outlined !text-[18px] text-[#818384] cursor-pointer hover:text-white">format_list_numbered</span>
                                    </div>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Body text (optional)"
                                        className="w-full bg-transparent p-4 text-sm text-white placeholder-[#818384] focus:outline-none min-h-[160px] resize-y"
                                    />
                                </div>
                            )}

                            {activeTab === 'image' && (
                                <div className="border-2 border-dashed border-[#343536] rounded-md p-10 flex flex-col items-center justify-center gap-4 hover:border-white transition-colors group cursor-pointer">
                                    <div className="p-4 rounded-full bg-[#272729] group-hover:bg-[#343536] transition-colors">
                                        <span className="material-symbols-outlined !text-[32px] text-white">cloud_upload</span>
                                    </div>
                                    <p className="text-sm font-bold text-white">Drag and Drop or upload media</p>
                                    <p className="text-xs text-[#818384]">Images and videos supported</p>
                                </div>
                            )}

                            {activeTab === 'link' && (
                                <textarea
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="Link URL *"
                                    className="w-full bg-transparent border border-[#343536] rounded-md px-4 py-2 text-[14px] text-white placeholder-[#818384] focus:outline-none focus:border-white transition-all min-h-[80px] resize-none"
                                />
                            )}

                            {activeTab === 'poll' && (
                                <div className="text-center py-10">
                                    <span className="material-symbols-outlined !text-4xl text-[#343536] mb-2">poll</span>
                                    <p className="text-sm text-[#818384]">Polls coming soon to TrackCodex</p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-[#343536]">
                            <button
                                onClick={onCancel}
                                className="px-6 py-2 rounded-full border border-[#D7DADC] text-[#D7DADC] text-sm font-bold hover:bg-[#272729] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !title.trim() || !selectedCommunity}
                                className="px-6 py-2 rounded-full bg-[#D7DADC] hover:bg-[#ebedef] text-[#1A1A1B] text-sm font-bold transition-all disabled:opacity-50 active:scale-95"
                            >
                                {loading ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Labels - Removing Reddit specific ones, keep TrackCodex feel */}
                <div className="mt-8 flex flex-wrap gap-4 text-[12px] text-[#575757]">
                    <span>TrackCodex Rules</span>
                    <span>Privacy Policy</span>
                    <span>User Agreement</span>
                    <span className="ml-auto">© 2026 TrackCodex, Inc. All rights reserved.</span>
                </div>
            </div>
        </div>
    );
};

export default CreatePostView;
