import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MOCK_EVENTS = [
    {
        id: "ev-1",
        title: "AI Summer Residency",
        organizer: "IIMA Ventures",
        isOnline: true,
        isFree: true,
        bannerBg: "bg-gradient-to-br from-slate-800 to-indigo-900",
        bannerText: "AI Summer Residency",
        bannerSub: "Residence Program at IIM Ahmedabad"
    },
    {
        id: "ev-2",
        title: "ISCMCTR-2026",
        organizer: "MITS Gwalior",
        isOnline: false,
        isFree: false,
        bannerBg: "bg-slate-100",
        bannerText: "",
        bannerSub: "",
        imageOverride: "/event_iscmctr_banner.png"
    },
    {
        id: "ev-3",
        title: "Fortune'26 The Finance Fiesta",
        organizer: "Delhi Technological University",
        isOnline: false,
        isFree: true,
        bannerBg: "bg-gradient-to-r from-amber-200 to-amber-500",
        bannerText: "FORTUNE'26",
        bannerSub: "The Finance Fiesta"
    },
    {
        id: "ev-4",
        title: "Register Now: Prosperity by IMC Trading",
        organizer: "IMC Trading",
        isOnline: true,
        isFree: true,
        bannerBg: "bg-gradient-to-t from-slate-900 via-stone-800 to-orange-900",
        bannerText: "PROSPERITY 04",
        bannerSub: "GET READY FOR A TRADING CHALLENGE"
    }
];

const EventsView = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [savedEvents, setSavedEvents] = useState<Record<string, boolean>>({});

    const toggleSave = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setSavedEvents(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const filteredEvents = MOCK_EVENTS.filter(ev => 
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.organizer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-[1400px] mx-auto p-8 font-sans">
            {/* Header & Search */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gh-text tracking-tight mb-2">Events & Programs</h2>
                    <p className="text-sm text-gh-text-secondary">Discover webinars, on-campus events, and massive showcases.</p>
                </div>
                <div className="relative group w-96">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gh-text-secondary text-lg group-focus-within:text-primary transition-colors">search</span>
                    <input
                        className="bg-gh-bg-secondary border border-gh-border rounded-full pl-12 pr-6 py-3 text-sm text-gh-text focus:ring-1 focus:ring-primary w-full outline-none transition-all duration-300 shadow-sm"
                        placeholder="Search events by name or organizer..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            {filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredEvents.map(ev => (
                        <div 
                            key={ev.id}
                            onClick={() => navigate(`/marketplace/events/${ev.id}`)}
                            className="group flex flex-col bg-white dark:bg-gh-bg-secondary border border-gray-200 dark:border-gh-border rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                            {/* Banner Image Placeholder */}
                            <div className={`w-full h-64 ${ev.bannerBg} flex flex-col items-center justify-center text-center relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500`}>
                                {ev.imageOverride ? (
                                    <img src={ev.imageOverride} alt={ev.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full p-6 flex flex-col items-center justify-center relative">
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                        <h3 className="text-2xl md:text-3xl font-black text-white drop-shadow-md mb-2 relative z-10 uppercase tracking-tight">{ev.bannerText}</h3>
                                        <p className="text-sm font-semibold text-white/90 drop-shadow relative z-10">{ev.bannerSub}</p>
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="p-5 flex flex-col flex-1">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex gap-2">
                                        {ev.isOnline && (
                                            <span className="px-3 py-1 flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                Online
                                            </span>
                                        )}
                                        {ev.isFree && (
                                            <span className="px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
                                                Free
                                            </span>
                                        )}
                                    </div>
                                    <button 
                                        onClick={(e) => toggleSave(e, ev.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                    >
                                        <span className={`material-symbols-outlined !text-[20px] ${savedEvents[ev.id] ? 'fill-current text-red-500 font-variation-fill' : ''}`}>
                                            favorite
                                        </span>
                                    </button>
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-white text-[15px] leading-snug line-clamp-2 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {ev.title}
                                </h4>
                                <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium truncate mt-auto">
                                    {ev.organizer}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="w-full py-20 flex flex-col items-center justify-center text-gh-text-secondary bg-gh-bg-secondary rounded-2xl border border-dashed border-gh-border mt-8">
                    <span className="material-symbols-outlined !text-5xl opacity-40 mb-4">search_off</span>
                    <h3 className="text-xl font-bold mb-2">No events found</h3>
                    <p className="text-sm text-center max-w-md">Try adjusting your search criteria or explore other categories.</p>
                </div>
            )}
        </div>
    );
};

export default EventsView;
