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
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [bannerUrl, setBannerUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [createdCommunity, setCreatedCommunity] = useState<Community | null>(null);

    const avatarInputRef = React.useRef<HTMLInputElement>(null);
    const bannerInputRef = React.useRef<HTMLInputElement>(null);

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            if (type === 'avatar') {
                setAvatarUrl(url);
                if (createdCommunity) {
                    await socialService.updateCommunity(createdCommunity.slug, { avatar: url });
                }
            } else {
                setBannerUrl(url);
                if (createdCommunity) {
                    await socialService.updateCommunity(createdCommunity.slug, { coverImage: url });
                }
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
            });
            setCreatedCommunity(community);
            onCommunityCreated(community);
            setStep(4); // Move to configuration/success step
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
                        <h2 className="text-2xl font-bold text-gh-text mb-2">What will your community be about?</h2>
                        <p className="text-sm text-gh-text-tertiary mb-6">Choose a topic to help members discover your community.</p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                            {TOPICS.map((topic) => (
                                <button
                                    key={topic.id}
                                    onClick={() => setSelectedTopic(topic.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md border text-[13px] font-medium transition-all ${selectedTopic === topic.id
                                        ? 'bg-gh-text text-gh-bg border-gh-text'
                                        : 'bg-gh-bg-secondary text-gh-text-secondary border-gh-border hover:border-gh-text-tertiary'
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
                        <h2 className="text-2xl font-bold text-gh-text mb-2">What kind of community is this?</h2>
                        <p className="text-sm text-gh-text-tertiary mb-6">Decide who can view and contribute to your community.</p>

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
                                        ? 'bg-gh-bg-secondary border-gh-text'
                                        : 'bg-transparent border-gh-border hover:border-gh-text-tertiary'
                                        }`}
                                >
                                    <div className="flex items-center gap-4 text-left">
                                        <span className={`material-symbols-outlined ${visibility === v.id ? 'text-gh-text' : 'text-gh-text-tertiary'}`}>{v.icon}</span>
                                        <div>
                                            <div className="text-[14px] font-bold text-gh-text">{v.label}</div>
                                            <div className="text-[12px] text-gh-text-tertiary">{v.desc}</div>
                                        </div>
                                    </div>
                                    <div className={`size-5 rounded-full border-2 flex items-center justify-center ${visibility === v.id ? 'border-gh-text' : 'border-gh-bg-tertiary'}`}>
                                        {visibility === v.id && <div className="size-2.5 rounded-full bg-gh-text"></div>}
                                    </div>
                                </button>
                            ))}

                            <div className="pt-4 border-t border-gh-border flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-gh-text-tertiary text-[20px]">warning</span>
                                    <div>
                                        <div className="text-[14px] font-bold text-gh-text">Mature (18+)</div>
                                        <div className="text-[12px] text-gh-text-tertiary">Users must be over 18 to view</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsMature(!isMature)}
                                    aria-label="Toggle mature content"
                                    className={`w-10 h-6 rounded-full transition-colors relative ${isMature ? 'bg-primary' : 'bg-gh-bg-tertiary'}`}
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
                        <h2 className="text-2xl font-bold text-gh-text mb-2">Tell us about your community</h2>
                        <p className="text-sm text-gh-text-tertiary mb-6">A name and description help people understand what your community is all about.</p>

                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gh-text-tertiary uppercase block mb-2">Community Name *</label>
                                    <input
                                        maxLength={21}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="community_name"
                                        className="w-full bg-gh-bg border border-gh-border rounded-md px-4 py-3 text-[14px] text-gh-text focus:outline-none focus:border-primary transition-colors"
                                    />
                                    <div className="text-[10px] text-gh-text-tertiary mt-1 text-right">{name.length}/21</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gh-text-tertiary uppercase block mb-2">Description *</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Tell us what this community is for..."
                                        className="w-full bg-gh-bg border border-gh-border rounded-md px-4 py-3 text-[14px] text-gh-text min-h-[120px] focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="w-full md:w-[280px] shrink-0">
                                <label className="text-xs font-bold text-gh-text-tertiary uppercase block mb-2">Preview</label>
                                <div className="bg-gh-bg-secondary border border-gh-border rounded-md overflow-hidden">
                                    <div className="h-10 bg-gh-bg-tertiary"></div>
                                    <div className="p-4 pt-0 -mt-5">
                                        <div className="flex items-end gap-2 mb-3">
                                            <div className="size-12 rounded-full bg-gh-bg border-2 border-gh-bg-secondary flex items-center justify-center text-gh-text font-bold overflow-hidden">
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    name ? name[0].toUpperCase() : 'C'
                                                )}
                                            </div>
                                            <div className="pb-1">
                                                <div className="text-[14px] font-bold text-gh-text">c/{name || 'communityname'}</div>
                                                <div className="text-[10px] text-gh-text-tertiary">0 members • 1 online</div>
                                            </div>
                                        </div>
                                        <p className="text-[12px] text-gh-text-secondary line-clamp-3 min-h-[45px]">
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
                    <div className="animate-in fade-in h-full flex flex-col pt-0">
                        <div className="flex flex-col md:flex-row h-full min-h-[500px] w-full bg-gh-bg rounded-[18px] overflow-hidden">
                            {/* Left Pane */}
                            <div className="flex-1 p-8 md:p-12 flex flex-col justify-center relative">
                                <h2 className="text-[32px] font-semibold text-gh-text leading-tight mb-8 font-sans">
                                    You launched a new<br />community!
                                </h2>
                                <div className="space-y-4 max-w-[340px]">
                                    <h3 className="text-[16px] font-bold text-gh-text tracking-wide">Here's what you should know</h3>
                                    <p className="text-gh-text-secondary text-[15px] leading-snug">
                                        We've applied some settings to help you get started.
                                        You can view and edit them anytime in your mod tools.
                                    </p>
                                    <div className="flex gap-4 pt-4">
                                        <div className="flex-1 px-4 py-3 rounded-xl border border-gh-border bg-gh-bg-secondary flex items-center gap-3">
                                            <span className="material-symbols-outlined text-green-500 font-bold !text-[20px]">check</span>
                                            <span className="text-gh-text text-[14px] font-medium">Rules</span>
                                        </div>
                                        <div className="flex-1 px-4 py-3 rounded-xl border border-gh-border bg-gh-bg-secondary flex items-center gap-3">
                                            <span className="material-symbols-outlined text-green-500 font-bold !text-[20px]">check</span>
                                            <span className="text-gh-text text-[14px] font-medium">Welcome guide</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Pane */}
                            <div className="w-full md:w-[460px] bg-primary/20 p-8 md:p-10 flex flex-col items-center justify-center relative shadow-inner">
                                <button onClick={onClose} aria-label="Close modal" className="absolute top-4 right-4 text-gh-text hover:bg-black/20 bg-black/10 z-50 size-9 rounded-full flex items-center justify-center transition-colors">
                                    <span className="material-symbols-outlined !text-[20px]">close</span>
                                </button>

                                <div className="w-full max-w-[360px] bg-gh-bg rounded-2xl overflow-hidden shadow-2xl relative border border-gh-border">
                                    {/* Banner Area */}
                                    <div className="h-32 relative bg-gh-bg-tertiary w-full overflow-hidden">
                                        {/* Default repeating bubble pattern if no banner */}
                                        {!bannerUrl && (
                                            <div className="absolute inset-0 pointer-events-none flex flex-wrap gap-2 p-3 opacity-60">
                                                {[...Array(12)].map((_, i) => (
                                                    <div key={i} className={`h-8 rounded-xl rounded-bl-sm bg-gh-bg-secondary ${i % 3 === 0 ? 'w-16' : i % 2 === 0 ? 'w-24' : 'w-12'}`}></div>
                                                ))}
                                            </div>
                                        )}
                                        {bannerUrl && (
                                            <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                                        )}
                                        {/* Edit Banner Button overlaying the banner image bottom right */}
                                        <button
                                            className="absolute bottom-3 right-3 size-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors cursor-pointer z-10 backdrop-blur-sm"
                                            onClick={() => bannerInputRef.current?.click()}
                                            title="Edit banner"
                                        >
                                            <span className="material-symbols-outlined !text-[18px]">edit</span>
                                        </button>
                                        <input
                                            type="file"
                                            ref={bannerInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            title="Upload banner"
                                            aria-label="Upload banner"
                                            onChange={(e) => handleFileChange(e, 'banner')}
                                        />
                                    </div>

                                    {/* Card Content underneath banner */}
                                    <div className="px-6 pb-6 relative">
                                        <div className="flex items-end gap-3 -mt-8 mb-4 relative z-20">
                                            {/* Avatar Area */}
                                            <div className="relative group shrink-0">
                                                <div className="size-20 rounded-full bg-gh-bg border-[4px] border-gh-bg overflow-hidden flex items-center justify-center text-3xl font-bold text-gh-text shadow-sm relative z-10">
                                                    {avatarUrl ? (
                                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="size-full bg-primary/40 flex items-center justify-center">
                                                            {name ? name[0].toUpperCase() : 'C'}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    className="absolute bottom-0 right-0 size-8 rounded-full bg-gh-bg-tertiary hover:bg-gh-bg-secondary flex items-center justify-center text-gh-text border-[3px] border-gh-bg transition-colors cursor-pointer z-20"
                                                    onClick={() => avatarInputRef.current?.click()}
                                                    title="Edit avatar"
                                                >
                                                    <span className="material-symbols-outlined !text-[14px]">edit</span>
                                                </button>
                                                <input
                                                    type="file"
                                                    ref={avatarInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    title="Upload avatar"
                                                    aria-label="Upload avatar"
                                                    onChange={(e) => handleFileChange(e, 'avatar')}
                                                />
                                            </div>

                                            {/* Title and stats */}
                                            <div className="mb-2">
                                                <h4 className="text-[20px] font-bold text-gh-text leading-tight font-sans">r/{name || 'community'}</h4>
                                                <div className="text-[13px] text-gh-text-tertiary font-normal truncate mt-0.5">
                                                    1 weekly visitor • 1 weekly contributor
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-[14px] text-gh-text-secondary line-clamp-3 mb-6 font-normal">
                                            {name || 'community'}
                                        </p>

                                        {/* Base Color Button */}
                                        <button className="w-full py-3 rounded-full border border-gh-border bg-transparent hover:bg-gh-bg-tertiary text-gh-text text-[14px] font-bold flex items-center justify-center gap-2 transition-colors">
                                            <span className="material-symbols-outlined !text-[20px]">edit</span>
                                            Base Color
                                            <div className="size-4 rounded-full bg-primary ml-1 border border-gh-bg"></div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`bg-gh-bg overflow-hidden w-full ${step === 4 ? 'max-w-[850px]' : 'max-w-[650px] border border-gh-border'} rounded-[18px] shadow-2xl flex flex-col transition-all duration-300`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-5 ${step === 4 ? 'hidden' : 'border-b border-gh-border'}`}>
                    {step < 4 ? (
                        <div className="flex gap-2">
                            {[1, 2, 3].map((s) => (
                                <div
                                    key={s}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-gh-text' : s < step ? 'w-3 bg-gh-text/40' : 'w-3 bg-gh-bg-tertiary'
                                        }`}
                                />
                            ))}
                        </div>
                    ) : null}
                    <button onClick={onClose} aria-label="Close modal" className="text-gh-text-tertiary hover:text-gh-text transition-colors bg-gh-bg-secondary size-8 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined !text-[18px]">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className={`${step === 4 ? 'p-0 relative bg-gh-bg rounded-t-[18px]' : 'p-8'} flex-1`}>
                    {renderStep()}
                </div>

                {/* Footer */}
                <div className={`p-5 px-6 flex items-center ${step === 4 ? 'bg-gh-bg rounded-b-[18px] border-t border-gh-border justify-end' : 'border-t border-gh-border bg-gh-bg-secondary justify-between'}`}>
                    {step === 4 ? (
                        <div className="w-full flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-full text-gh-text text-[14px] font-bold hover:bg-gh-bg-secondary transition-colors"
                            >
                                Go To Community Page
                            </button>
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-full bg-gh-bg-tertiary hover:bg-gh-bg-secondary text-gh-text text-[14px] font-bold transition-colors"
                            >
                                View Next Steps
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={step === 1 ? onClose : prevStep}
                                className="px-6 py-2.5 rounded-full border border-gh-border text-gh-text text-[14px] font-bold hover:bg-gh-bg-tertiary transition-colors"
                            >
                                {step === 1 ? 'Cancel' : 'Back'}
                            </button>
                            <div className="flex gap-3">
                                {step < 3 ? (
                                    <button
                                        onClick={nextStep}
                                        disabled={step === 1 && !selectedTopic}
                                        className="px-8 py-2.5 rounded-full bg-gh-text text-gh-bg text-[14px] font-bold hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleCreate}
                                        disabled={loading || !name.trim() || !description.trim()}
                                        className="px-8 py-2.5 rounded-full bg-gh-text text-gh-bg text-[14px] font-bold hover:opacity-90 transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
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
