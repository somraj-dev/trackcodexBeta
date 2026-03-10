import React, { useState } from 'react';
import { socialService, Community } from '../../services/social/socialService';

interface CreateCommunityModalProps {
    onClose: () => void;
    onCommunityCreated: (community: Community) => void;
}

const TOPICS = [
    { id: 'anime', label: 'Anime & Cosplay', icon: 'animation' },
    { id: 'art', label: 'Art', icon: 'palette' },
    { id: 'business', label: 'Business & Finance', icon: 'payments' },
    { id: 'collectibles', label: 'Collectibles', icon: 'stars' },
    { id: 'education', label: 'Education & Career', icon: 'school' },
    { id: 'fashion', label: 'Fashion & Beauty', icon: 'checkroom' },
    { id: 'food', label: 'Food & Drinks', icon: 'restaurant' },
    { id: 'games', label: 'Games', icon: 'sports_esports' },
    { id: 'health', label: 'Health', icon: 'favorite' },
    { id: 'home', label: 'Home & Garden', icon: 'home' },
    { id: 'law', label: 'Humanities & Law', icon: 'gavel' },
    { id: 'culture', label: 'Internet Culture', icon: 'language' },
    { id: 'movies', label: 'Movies & TV', icon: 'movie' },
    { id: 'music', label: 'Music', icon: 'music_note' },
    { id: 'nature', label: 'Nature & Outdoors', icon: 'forest' },
    { id: 'news', label: 'News & Politics', icon: 'newspaper' },
    { id: 'travel', label: 'Places & Travel', icon: 'explore' },
    { id: 'pop', label: 'Pop Culture', icon: 'celebration' },
    { id: 'qa', label: 'Q&As & Stories', icon: 'quiz' },
    { id: 'reading', label: 'Reading & Writing', icon: 'menu_book' },
    { id: 'sciences', label: 'Sciences', icon: 'science' },
    { id: 'spooky', label: 'Spooky', icon: 'skull' },
    { id: 'sports', label: 'Sports', icon: 'sports_soccer' },
    { id: 'tech', label: 'Technology', icon: 'terminal' },
    { id: 'vehicles', label: 'Vehicles', icon: 'directions_car' },
    { id: 'wellness', label: 'Wellness', icon: 'self_improvement' },
];

export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({ onClose, onCommunityCreated }) => {
    const [step, setStep] = useState(1);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [visibility, setVisibility] = useState('public'); // public, restricted, private
    const [isMature, setIsMature] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [avatar, setAvatar] = useState<File | null>(null);
    const [banner, setBanner] = useState<File | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [bannerUrl, setBannerUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const avatarInputRef = React.useRef<HTMLInputElement>(null);
    const bannerInputRef = React.useRef<HTMLInputElement>(null);

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            if (type === 'avatar') {
                setAvatar(file);
                setAvatarUrl(url);
            } else {
                setBanner(file);
                setBannerUrl(url);
            }
        }
    };

    const handleCreate = async () => {
        if (!name.trim()) return;
        setLoading(true);
        try {
            const community = await socialService.createCommunity({
                name,
                description,
                avatar: avatarUrl || undefined,
            });
            // We could also upload 'avatar' and 'banner' files here if the backend supports multipart
            if (avatar || banner) {
                // Mock upload or additional processing
            }
            // In a real app, we'd also save the topic and visibility
            onCommunityCreated(community);
            setStep(6); // Move to configuration/success step
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-2xl font-bold text-white mb-2">What will your community be about?</h2>
                        <p className="text-sm text-[#A1A1AA] mb-6">Choose a topic to help members discover your community.</p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                            {TOPICS.map((topic) => (
                                <button
                                    key={topic.id}
                                    onClick={() => setSelectedTopic(topic.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md border text-[13px] font-medium transition-all ${selectedTopic === topic.id
                                        ? 'bg-white text-black border-white'
                                        : 'bg-[#111111] text-[#D7DADC] border-[#1A1A1A] hover:border-[#333333]'
                                        }`}
                                >
                                    <span className="material-symbols-outlined !text-[18px]">{topic.icon}</span>
                                    {topic.label}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-2xl font-bold text-white mb-2">What kind of community is this?</h2>
                        <p className="text-sm text-[#A1A1AA] mb-6">Decide who can view and contribute to your community.</p>

                        <div className="space-y-4">
                            {[
                                { id: 'public', label: 'Public', desc: 'Anyone can view, post, and comment', icon: 'public' },
                                { id: 'restricted', label: 'Restricted', desc: 'Anyone can view, but only approved users can contribute', icon: 'visibility' },
                                { id: 'private', label: 'Private', desc: 'Only approved users can view and contribute', icon: 'lock' },
                            ].map((v) => (
                                <button
                                    key={v.id}
                                    onClick={() => setVisibility(v.id)}
                                    className={`w-full flex items-center justify-between p-4 rounded-md border transition-all ${visibility === v.id
                                        ? 'bg-[#111111] border-white'
                                        : 'bg-transparent border-[#1A1A1A] hover:border-[#333333]'
                                        }`}
                                >
                                    <div className="flex items-center gap-4 text-left">
                                        <span className={`material-symbols-outlined ${visibility === v.id ? 'text-white' : 'text-[#818384]'}`}>{v.icon}</span>
                                        <div>
                                            <div className="text-[14px] font-bold text-white">{v.label}</div>
                                            <div className="text-[12px] text-[#A1A1AA]">{v.desc}</div>
                                        </div>
                                    </div>
                                    <div className={`size-5 rounded-full border-2 flex items-center justify-center ${visibility === v.id ? 'border-white' : 'border-[#333333]'}`}>
                                        {visibility === v.id && <div className="size-2.5 rounded-full bg-white"></div>}
                                    </div>
                                </button>
                            ))}

                            <div className="pt-4 border-t border-[#1A1A1A] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[#818384] text-[20px]">warning</span>
                                    <div>
                                        <div className="text-[14px] font-bold text-white">Mature (18+)</div>
                                        <div className="text-[12px] text-[#A1A1AA]">Users must be over 18 to view</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsMature(!isMature)}
                                    aria-label="Toggle mature content"
                                    className={`w-10 h-6 rounded-full transition-colors relative ${isMature ? 'bg-primary' : 'bg-[#333333]'}`}
                                >
                                    <div className={`absolute top-1 left-1 size-4 rounded-full bg-white transition-transform ${isMature ? 'translate-x-4' : ''}`}></div>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-2xl font-bold text-white mb-2">Tell us about your community</h2>
                        <p className="text-sm text-[#A1A1AA] mb-6">A name and description help people understand what your community is all about.</p>

                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-[#A1A1AA] uppercase block mb-2">Community Name *</label>
                                    <input
                                        maxLength={21}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="community_name"
                                        className="w-full bg-[#111111] border border-[#1A1A1A] rounded-md px-4 py-3 text-[14px] text-white focus:outline-none focus:border-white transition-colors"
                                    />
                                    <div className="text-[10px] text-[#717273] mt-1 text-right">{name.length}/21</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#A1A1AA] uppercase block mb-2">Description *</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Tell us what this community is for..."
                                        className="w-full bg-[#111111] border border-[#1A1A1A] rounded-md px-4 py-3 text-[14px] text-white min-h-[120px] focus:outline-none focus:border-white transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="w-full md:w-[280px] shrink-0">
                                <label className="text-xs font-bold text-[#A1A1AA] uppercase block mb-2">Preview</label>
                                <div className="bg-[#1A1A1B] border border-[#343536] rounded-md overflow-hidden">
                                    <div className="h-10 bg-[#333333]"></div>
                                    <div className="p-4 pt-0 -mt-5">
                                        <div className="flex items-end gap-2 mb-3">
                                            <div className="size-12 rounded-full bg-[#272729] border-2 border-[#1A1A1B] flex items-center justify-center text-white font-bold overflow-hidden">
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    name ? name[0].toUpperCase() : 'C'
                                                )}
                                            </div>
                                            <div className="pb-1">
                                                <div className="text-[14px] font-bold text-white">c/{name || 'communityname'}</div>
                                                <div className="text-[10px] text-[#A1A1AA]">0 members • 1 online</div>
                                            </div>
                                        </div>
                                        <p className="text-[12px] text-[#D7DADC] line-clamp-3 min-h-[45px]">
                                            {description || 'Your community description will appear here...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-2xl font-bold text-white mb-2">Customize your community's look</h2>
                        <p className="text-sm text-[#A1A1AA] mb-6">Upload an avatar that represents your community.</p>

                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#1A1A1A] rounded-xl hover:border-[#333333] transition-colors group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                            <input
                                type="file"
                                ref={avatarInputRef}
                                className="hidden"
                                accept="image/*"
                                aria-label="Upload Avatar"
                                onChange={(e) => handleFileChange(e, 'avatar')}
                            />
                            {avatarUrl ? (
                                <div className="relative size-32 rounded-full overflow-hidden mb-4 border-4 border-[#1A1A1B]">
                                    <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white !text-3xl">add_a_photo</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="size-32 rounded-full bg-[#111111] border-4 border-[#1A1A1A] flex items-center justify-center mb-4 text-[#818384] group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined !text-4xl">add_a_photo</span>
                                </div>
                            )}
                            <h3 className="text-white font-bold mb-1">{avatarUrl ? 'Change Avatar' : 'Upload Avatar'}</h3>
                            <p className="text-[#A1A1AA] text-xs">Recommended size: 256x256px</p>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-2xl font-bold text-white mb-2">Give it a banner</h2>
                        <p className="text-sm text-[#A1A1AA] mb-6">A banner helps set the theme and mood of your community.</p>

                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#1A1A1A] rounded-xl hover:border-[#333333] transition-colors group cursor-pointer" onClick={() => bannerInputRef.current?.click()}>
                            <input
                                type="file"
                                ref={bannerInputRef}
                                className="hidden"
                                accept="image/*"
                                aria-label="Upload Banner"
                                onChange={(e) => handleFileChange(e, 'banner')}
                            />
                            {bannerUrl ? (
                                <div className="relative w-full h-32 rounded-lg overflow-hidden mb-4 border border-[#1A1A1B]">
                                    <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white !text-3xl">add_a_photo</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-32 rounded-lg bg-[#111111] border border-[#1A1A1A] flex items-center justify-center mb-4 text-[#818384] group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined !text-4xl">add_a_photo</span>
                                </div>
                            )}
                            <h3 className="text-white font-bold mb-1">{bannerUrl ? 'Change Banner' : 'Upload Banner'}</h3>
                            <p className="text-[#A1A1AA] text-xs">Recommended size: 1920x384px</p>
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex flex-col md:flex-row h-full min-h-[400px]">
                            <div className="flex-1 p-6 flex flex-col justify-center">
                                <h2 className="text-3xl font-bold text-white mb-6">You launched a new community!</h2>
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-[16px] font-bold text-white mb-2">Here's what you should know</h3>
                                        <p className="text-[#A1A1AA] text-sm">We've applied some default settings. You can edit them anytime in your tools.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1 p-3 rounded-md border border-[#1A1A1A] bg-[#0A0A0A] flex items-center gap-3">
                                            <span className="material-symbols-outlined text-green-500">check_circle</span>
                                            <span className="text-white text-sm font-medium">Rules</span>
                                        </div>
                                        <div className="flex-1 p-3 rounded-md border border-[#1A1A1A] bg-[#0A0A0A] flex items-center gap-3">
                                            <span className="material-symbols-outlined text-green-500">check_circle</span>
                                            <span className="text-white text-sm font-medium">Welcome Guide</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full md:w-[350px] bg-gradient-to-br from-[#1e1e1e] to-black p-8 flex flex-col items-center justify-center relative">
                                <div className="w-full max-w-[280px] bg-[#1A1A1B] border border-[#343536] rounded-xl overflow-hidden shadow-2xl relative">
                                    {/* Banner */}
                                    <div
                                        className="h-24 bg-gray-800 relative group cursor-pointer"
                                        aria-label="Edit banner"
                                        onClick={() => bannerInputRef.current?.click()}
                                    >
                                        {bannerUrl ? (
                                            <>
                                                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setBanner(null);
                                                        setBannerUrl(null);
                                                    }}
                                                    className="absolute top-2 right-2 size-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black transition-colors z-10"
                                                    title="Remove banner"
                                                >
                                                    <span className="material-symbols-outlined !text-[16px]">close</span>
                                                </button>
                                            </>
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-r from-gray-700 to-gray-800" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                            <span className="material-symbols-outlined !text-[18px]">add_a_photo</span>
                                            Edit
                                        </div>
                                    </div>
                                    <div className="p-4 pt-0 -mt-10 flex flex-col items-center">
                                        <div
                                            className="size-20 rounded-full bg-[#1A1A1B] border-4 border-[#1A1A1B] overflow-hidden mb-3 relative group cursor-pointer"
                                            aria-label="Edit avatar"
                                            onClick={() => avatarInputRef.current?.click()}
                                        >
                                            {avatarUrl ? (
                                                <>
                                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setAvatar(null);
                                                            setAvatarUrl(null);
                                                        }}
                                                        className="absolute top-1 right-1 size-5 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black transition-colors z-10"
                                                        title="Remove avatar"
                                                    >
                                                        <span className="material-symbols-outlined !text-[14px]">close</span>
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="size-full bg-blue-500 flex items-center justify-center text-3xl font-bold text-white">
                                                    {name ? name[0].toUpperCase() : 'C'}
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                <span className="material-symbols-outlined !text-[20px]">add_a_photo</span>
                                            </div>
                                        </div>
                                        <h4 className="text-lg font-bold text-white mb-1">c/{name || 'communityname'}</h4>
                                        <div className="text-[12px] text-[#A1A1AA] mb-4">1 member • 1 online</div>
                                        <p className="text-[12px] text-center text-[#D7DADC] line-clamp-2 px-2 mb-6">{description}</p>

                                        <button className="w-full py-2 rounded-full border border-blue-500 text-blue-500 text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-500/10 transition-colors">
                                            <span className="material-symbols-outlined !text-[18px]">palette</span>
                                            Base Color
                                            <div className="size-3 rounded-full bg-blue-500 ml-1"></div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`bg-[#0A0A0A] border border-[#1A1A1A] w-full ${step === 6 ? 'max-w-[900px]' : 'max-w-[650px]'} rounded-xl shadow-2xl flex flex-col transition-all duration-300`}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[#1A1A1A]">
                    {step < 6 ? (
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <div
                                    key={s}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-white' : s < step ? 'w-3 bg-white/40' : 'w-3 bg-[#1A1A1A]'
                                        }`}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-white font-bold">Community Created</div>
                    )}
                    <button onClick={onClose} aria-label="Close modal" className="text-[#818384] hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className={`${step === 6 ? 'p-0' : 'p-8'} flex-1`}>
                    {renderStep()}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-[#1A1A1A] flex justify-between bg-[#050505] rounded-b-xl">
                    {step === 6 ? (
                        <div className="w-full flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-full text-white text-[14px] font-bold hover:bg-[#111111] transition-colors"
                            >
                                Go To Community Page
                            </button>
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-full bg-white text-black text-[14px] font-bold hover:bg-[#E5E5E5] transition-colors"
                            >
                                View Next Steps
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={step === 1 ? onClose : prevStep}
                                className="px-6 py-2.5 rounded-full border border-[#1A1A1A] text-white text-[14px] font-bold hover:bg-[#111111] transition-colors"
                            >
                                {step === 1 ? 'Cancel' : 'Back'}
                            </button>
                            <div className="flex gap-3">
                                {step < 5 ? (
                                    <button
                                        onClick={nextStep}
                                        disabled={step === 1 && !selectedTopic || step === 3 && (!name.trim() || !description.trim())}
                                        className="px-8 py-2.5 rounded-full bg-white text-black text-[14px] font-bold hover:bg-[#E5E5E5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleCreate}
                                        disabled={loading}
                                        className="px-8 py-2.5 rounded-full bg-white text-black text-[14px] font-bold hover:bg-[#E5E5E5] transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                    >
                                        {loading ? 'Creating...' : 'Create Community'}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
