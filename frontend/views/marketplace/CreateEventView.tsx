import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePickerCalendar from '../../components/ui/DatePickerCalendar';

const CreateEventView = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        mode: 'Online',
        websiteUrl: '',
        startDate: '',
        endDate: '',
        themeColor: '#1A73E8',
        organization: '',
        details: '',
        registrationLevel: 'competition'
    });

    interface Previews {
        logo: string | null;
        mobileBanner: string | null;
        desktopBanner: string | null;
        seoImage: string | null;
        gallery: string[];
    }

    const [previews, setPreviews] = useState<Previews>({
        logo: null,
        mobileBanner: null,
        desktopBanner: null,
        seoImage: null,
        gallery: []
    });

    const logoRef = useRef<HTMLInputElement>(null);
    const mobileBannerRef = useRef<HTMLInputElement>(null);
    const desktopBannerRef = useRef<HTMLInputElement>(null);
    const seoImageRef = useRef<HTMLInputElement>(null);
    const galleryRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileUpload = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'gallery') {
                    setPreviews(prev => ({
                        ...prev,
                        gallery: [...(prev.gallery as any), reader.result as string]
                    }));
                } else {
                    setPreviews(prev => ({ ...prev, [type]: reader.result as string }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const colors = [
        '#000000', '#FFFFFF', '#FF0000', '#FF4500', '#FF8C00', '#FFA500', 
        '#008000', '#00FF00', '#0000FF', '#4B0082', '#8B00FF', '#FF1493', '#808080'
    ];

    const [showErrors, setShowErrors] = useState(false);

    const handleSave = () => {
        const requiredFields = ['name', 'startDate', 'endDate', 'organization'];
        const hasErrors = requiredFields.some(key => !(formData as any)[key]?.trim());

        if (hasErrors) {
            setShowErrors(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // Persist the festival name to localStorage
        try {
            const existing = localStorage.getItem('customFestivals');
            const list: string[] = existing ? JSON.parse(existing) : [];
            if (!list.includes(formData.name.trim())) {
                list.push(formData.name.trim());
                localStorage.setItem('customFestivals', JSON.stringify(list));
            }
        } catch { /* ignore */ }

        // Navigate back to mission creation
        navigate('/marketplace/missions/new');
    };

    return (
        <div className="min-h-screen bg-gh-bg text-gh-text font-sans pb-32">
            {/* Header Section like CreateMissionView */}
            <header className="border-b border-gh-border bg-gh-bg-secondary p-8 mb-8 shadow-sm">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gh-text tracking-tight">Create Festival</h1>
                        <p className="text-sm text-gh-text-secondary mt-1">Design and launch your new campaign or event.</p>
                    </div>
                </div>
            </header>

            {/* Main Form Content */}
            <div className="max-w-[1400px] mx-auto px-8 space-y-10">
                
                {/* Basic Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-gh-bg-secondary border border-gh-border rounded-2xl p-8 shadow-sm">
                    <div className="lg:col-span-3">
                        <label htmlFor="festival-name" className="block text-[13px] font-bold text-gh-text mb-2 uppercase tracking-wider">
                            Festival Name <span className="text-rose-500">*</span>
                        </label>
                        <input 
                            id="festival-name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`w-full bg-gh-bg border rounded-xl px-4 py-3 text-sm text-gh-text focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner ${!formData.name.trim() && showErrors ? 'border-red-500' : 'border-gh-border'}`}
                            placeholder="Enter festival name"
                        />
                        {!formData.name.trim() && showErrors && <p className="text-[11px] text-red-500 font-bold mt-1">Festival name is required</p>}
                    </div>

                    <div>
                        <label htmlFor="event-mode" className="block text-[13px] font-bold text-gh-text mb-2 uppercase tracking-wider">
                            Mode of Event
                        </label>
                        <select 
                            id="event-mode"
                            name="mode"
                            title="Event Mode"
                            value={formData.mode}
                            onChange={handleInputChange}
                            className="w-full bg-gh-bg border border-gh-border rounded-xl px-4 py-3 text-sm text-gh-text focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner appearance-none"
                        >
                            <option>Online</option>
                            <option>Offline</option>
                            <option>Hybrid</option>
                        </select>
                    </div>

                    <div className="lg:col-span-2">
                        <label htmlFor="website-url" className="block text-[13px] font-bold text-gh-text mb-2 uppercase tracking-wider">
                            Website URL
                        </label>
                        <input 
                            id="website-url"
                            name="websiteUrl"
                            value={formData.websiteUrl}
                            onChange={handleInputChange}
                            className="w-full bg-gh-bg border border-gh-border rounded-xl px-4 py-3 text-sm text-gh-text focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner"
                            placeholder="https://example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="start-date" className="block text-[13px] font-bold text-gh-text mb-2 uppercase tracking-wider">
                            Festival Start Date <span className="text-rose-500">*</span>
                        </label>
                        <DatePickerCalendar
                            id="start-date"
                            value={formData.startDate}
                            onChange={(date) => setFormData({ ...formData, startDate: date })}
                            placeholder="Select start date"
                        />
                        {!formData.startDate.trim() && showErrors && <p className="text-[11px] text-red-500 font-bold mt-1">Start date is required</p>}
                    </div>

                    <div>
                        <label htmlFor="end-date" className="block text-[13px] font-bold text-gh-text mb-2 uppercase tracking-wider">
                            Festival End Date <span className="text-rose-500">*</span>
                        </label>
                        <DatePickerCalendar
                            id="end-date"
                            value={formData.endDate}
                            onChange={(date) => setFormData({ ...formData, endDate: date })}
                            placeholder="Select end date"
                        />
                        {!formData.endDate.trim() && showErrors && <p className="text-[11px] text-red-500 font-bold mt-1">End date is required</p>}
                    </div>

                    <div className="flex flex-col">
                         <label className="block text-[13px] font-bold text-gh-text mb-2 uppercase tracking-wider">
                            Theme Colour
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {colors.map(color => (
                                <button 
                                    key={color}
                                    type="button"
                                    onClick={() => setFormData({...formData, themeColor: color})}
                                    className={`w-6 h-6 rounded-md border border-gh-border transition-transform hover:scale-110 ${formData.themeColor === color ? 'ring-2 ring-primary ring-offset-2 ring-offset-gh-bg' : ''}`}
                                    style={{ backgroundColor: color }}
                                    title={`Select color ${color}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-3">
                        <label htmlFor="organization" className="block text-[13px] font-bold text-gh-text mb-2 uppercase tracking-wider">
                            Organisation <span className="text-rose-500">*</span>
                        </label>
                        <input 
                            id="organization"
                            name="organization"
                            value={formData.organization}
                            onChange={handleInputChange}
                            className={`w-full bg-gh-bg border rounded-xl px-4 py-3 text-sm text-gh-text focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner ${!formData.organization.trim() && showErrors ? 'border-red-500' : 'border-gh-border'}`}
                            placeholder="Enter organisation name"
                        />
                        {!formData.organization.trim() && showErrors && <p className="text-[11px] text-red-500 font-bold mt-1">Organisation is required</p>}
                    </div>
                </div>

                {/* Details Section */}
                <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl p-8 shadow-sm">
                     <label htmlFor="details" className="block text-[13px] font-bold text-gh-text mb-2 uppercase tracking-wider">
                        Details
                    </label>
                    <div className="border border-gh-border rounded-xl overflow-hidden bg-gh-bg shadow-inner">
                        <div className="bg-gh-bg-tertiary border-b border-gh-border p-2 flex items-center gap-1 overflow-x-auto">
                            {['format_bold', 'format_italic', 'format_underlined', 'strikethrough_s', 'format_align_left', 'format_align_center', 'format_align_right', 'format_list_bulleted', 'format_list_numbered', 'undo', 'redo', 'link', 'image'].map(icon => (
                                <button key={icon} type="button" className="p-1.5 hover:bg-gh-bg-secondary rounded transition-colors text-gh-text-secondary">
                                    <span className="material-symbols-outlined text-[18px]">{icon}</span>
                                </button>
                            ))}
                        </div>
                        <textarea 
                            id="details"
                            name="details"
                            value={formData.details}
                            onChange={handleInputChange}
                            placeholder="Write festival details here..."
                            className="w-full p-4 min-h-[150px] outline-none text-sm text-gh-text bg-transparent resize-y"
                        />
                    </div>
                </div>

                {/* Upload Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Logo */}
                    <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl p-8 shadow-sm">
                        <label className="block text-[13px] font-bold text-gh-text mb-3 uppercase tracking-widest">Upload Festival Logo</label>
                        <div className="border border-dashed border-gh-border rounded-xl p-8 flex flex-col items-center justify-center bg-gh-bg/30 hover:bg-gh-bg/50 transition-colors">
                            <div className="relative w-32 h-32 bg-gh-bg-secondary rounded-full border border-gh-border shadow-md flex items-center justify-center overflow-hidden mb-4">
                                {previews.logo ? (
                                    <img src={previews.logo} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-gh-border !text-[48px]">image</span>
                                )}
                            </div>
                            <button 
                                type="button"
                                onClick={() => logoRef.current?.click()}
                                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-primary/20"
                            >
                                Click here to upload a logo
                            </button>
                            <input type="file" ref={logoRef} hidden onChange={(e) => handleFileUpload('logo', e)} accept="image/*" title="Upload Logo" />
                        </div>
                    </div>

                    {/* Mobile Banner */}
                    <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl p-8 shadow-sm">
                        <label className="block text-[13px] font-bold text-gh-text mb-3 uppercase tracking-widest">Upload Festival Mobile Banner (700x400)</label>
                        <div className="border border-dashed border-gh-border rounded-xl p-8 flex flex-col items-center justify-center bg-gh-bg/30 hover:bg-gh-bg/50 transition-colors h-full min-h-[220px]">
                            {previews.mobileBanner ? (
                                <div className="w-full h-40 rounded-lg overflow-hidden mb-4 border border-gh-border">
                                    <img src={previews.mobileBanner} alt="Mobile Banner" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="p-10 mb-2">
                                     <span className="material-symbols-outlined text-gh-border !text-[48px]">cloud_upload</span>
                                </div>
                            )}
                            <button 
                                type="button"
                                onClick={() => mobileBannerRef.current?.click()}
                                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-primary/20"
                            >
                                Click here to upload a mobile banner
                            </button>
                            <p className="text-[10px] text-gh-text-secondary mt-2 opacity-60">Recommended image resolution is 700x400</p>
                            <input type="file" ref={mobileBannerRef} hidden onChange={(e) => handleFileUpload('mobileBanner', e)} accept="image/*" title="Upload Mobile Banner" />
                        </div>
                    </div>

                    {/* Desktop Banner */}
                    <div className="md:col-span-2 bg-gh-bg-secondary border border-gh-border rounded-2xl p-8 shadow-sm">
                        <label className="block text-[13px] font-bold text-gh-text mb-3 uppercase tracking-widest">Upload Festival Banner</label>
                        <div className="border border-dashed border-gh-border rounded-xl p-10 flex flex-col items-center justify-center bg-gh-bg/30 hover:bg-gh-bg/50 transition-colors min-h-[240px]">
                            {previews.desktopBanner ? (
                                <div className="w-full h-48 rounded-lg overflow-hidden mb-4 border border-gh-border">
                                    <img src={previews.desktopBanner} alt="Desktop Banner" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="mb-4">
                                     <span className="material-symbols-outlined text-gh-border !text-[48px]">cloud_upload</span>
                                </div>
                            )}
                            <button 
                                type="button"
                                onClick={() => desktopBannerRef.current?.click()}
                                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-primary/20"
                            >
                                Click here to upload a banner
                            </button>
                            <p className="text-[10px] text-gh-text-secondary mt-2 opacity-60">Recommended image resolution is 1920x450</p>
                            <input type="file" ref={desktopBannerRef} hidden onChange={(e) => handleFileUpload('desktopBanner', e)} accept="image/*" title="Upload Desktop Banner" />
                        </div>
                    </div>

                    {/* SEO Image */}
                    <div className="md:col-span-2 bg-gh-bg-secondary border border-gh-border rounded-2xl p-8 shadow-sm">
                        <label className="block text-[13px] font-bold text-gh-text mb-3 uppercase tracking-widest">Upload Seo Image</label>
                        <div className="border border-dashed border-gh-border rounded-xl p-10 flex flex-col items-center justify-center bg-gh-bg/30 hover:bg-gh-bg/50 transition-colors min-h-[240px]">
                            {previews.seoImage ? (
                                <div className="w-full h-48 rounded-lg overflow-hidden mb-4 border border-gh-border">
                                    <img src={previews.seoImage} alt="SEO" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="mb-4">
                                     <span className="material-symbols-outlined text-gh-border !text-[48px]">cloud_upload</span>
                                </div>
                            )}
                            <button 
                                type="button"
                                onClick={() => seoImageRef.current?.click()}
                                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-primary/20"
                            >
                                Click here to upload a Seo Banner
                            </button>
                            <p className="text-[10px] text-gh-text-secondary mt-2 opacity-60">Recommended image resolution is 1920x450</p>
                            <input type="file" ref={seoImageRef} hidden onChange={(e) => handleFileUpload('seoImage', e)} accept="image/*" title="Upload SEO Image" />
                        </div>
                    </div>

                    {/* Gallery */}
                    <div className="md:col-span-2 bg-gh-bg-secondary border border-gh-border rounded-2xl p-8 shadow-sm">
                        <label className="block text-[13px] font-bold text-gh-text mb-3 uppercase tracking-widest">Upload Festival Gallery</label>
                        <div className="space-y-4">
                            <button 
                                type="button"
                                onClick={() => galleryRef.current?.click()}
                                className="bg-primary hover:bg-primary/90 text-white px-8 py-2.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                Upload Gallery <span className="material-symbols-outlined text-sm">play_arrow</span>
                            </button>
                            <p className="text-[11px] italic text-gh-text-secondary">*You can add multiple images at a time.</p>
                            
                            {!previews.gallery || previews.gallery.length === 0 ? (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-amber-500 text-[20px]">warning</span>
                                    <span className="text-[12px] text-amber-500 font-medium tracking-wide">No image has been added yet.</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 pt-4">
                                    {previews.gallery.map((img, i) => (
                                        <div key={i} className="aspect-square rounded-xl border border-gh-border overflow-hidden bg-gh-bg shadow-md">
                                            <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                            <input type="file" ref={galleryRef} hidden multiple onChange={(e) => handleFileUpload('gallery', e)} accept="image/*" title="Upload gallery images" />
                        </div>
                    </div>
                </div>

                {/* Registration Level Section */}
                <div className="space-y-4 pt-4 border-t border-gh-border">
                    <label className="block text-[13px] font-bold text-gh-text mb-2 uppercase tracking-widest">Registration open in festival</label>
                    <div className="space-y-3">
                        <label className="flex items-center p-5 border border-gh-border rounded-xl text-xs text-gh-text-secondary cursor-pointer hover:bg-gh-bg-secondary transition-all">
                            <input 
                                type="radio" 
                                name="registrationLevel" 
                                value="festival"
                                checked={formData.registrationLevel === 'festival'}
                                onChange={handleInputChange}
                                className="mr-3 accent-primary"
                            />
                            No Registration will be open only at festival level.
                        </label>
                        <label className="flex items-center p-5 border border-gh-border rounded-xl text-xs text-gh-text-secondary cursor-pointer hover:bg-gh-bg-secondary transition-all">
                           <input 
                                type="radio" 
                                name="registrationLevel" 
                                value="both"
                                checked={formData.registrationLevel === 'both'}
                                onChange={handleInputChange}
                                className="mr-3 accent-primary"
                            />
                           Both Registration will be open on both festival and Competitions.
                        </label>
                        <label className={`flex items-center p-5 border rounded-xl text-xs transition-all cursor-pointer ${formData.registrationLevel === 'competition' ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-gh-border text-gh-text-secondary hover:bg-gh-bg-secondary'}`}>
                            <input 
                                type="radio" 
                                name="registrationLevel" 
                                value="competition"
                                checked={formData.registrationLevel === 'competition'}
                                onChange={handleInputChange}
                                className="mr-3 accent-primary"
                            />
                            No Registration will be open only at competition level.
                        </label>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-gh-bg-secondary border-t border-gh-border px-8 py-4 flex justify-between items-center z-50">
                <button 
                    type="button"
                    onClick={() => navigate(-1)}
                    className="border border-gh-border rounded-lg px-8 py-2 text-xs font-bold text-gh-text-secondary hover:bg-gh-bg-tertiary transition-all uppercase tracking-widest"
                >
                    Back
                </button>
                <button 
                    type="button"
                    onClick={handleSave}
                    className="bg-primary hover:bg-primary/90 text-white rounded-lg px-12 py-2 text-xs font-bold transition-all shadow-xl shadow-primary/20 uppercase tracking-widest"
                >
                    Save
                </button>
            </div>
        </div>
    );
};

export default CreateEventView;
