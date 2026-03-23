import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const EventDetailView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const isFortune26 = !id || id === 'ev-1' || id === 'fortune26';
    const isIscmctr = id === 'ev-2';

    const eventTitle = isIscmctr ? "ISCMCTR-2026" : "Fortune'26";
    const eventOrg = isIscmctr ? "MITS Gwalior" : "Delhi Technological University (DTU)";
    const eventLoc = isIscmctr ? "MITS – Deemed University, Gwalior" : "Delhi Technological University (DTU), New Delhi";
    const iconStr = isIscmctr ? "school" : "stacked_line_chart";

    return (
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-gh-bg font-sans pb-20">
            {/* Banner */}
            {isFortune26 ? (
                <div className="w-full h-[320px] bg-[#f8efcd] relative overflow-hidden flex flex-col items-center justify-center border-b border-gray-200 dark:border-gh-border">
                    <img src="/event_fortune26_banner.png" alt="Fortune'26 The Finance Fiesta" className="w-full h-[320px] object-cover" />
                </div>
            ) : isIscmctr ? (
                <div className="w-full h-[400px] relative overflow-hidden flex flex-col items-center justify-center border-b border-gray-200 dark:border-gh-border">
                    {/* Blurred Background effect for narrow/vertical posters */}
                    <div 
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-[40px] scale-125 opacity-70 dark:opacity-50" 
                        style={{ backgroundImage: `url('/event_iscmctr_banner.png')` }}
                    />
                    <div className="absolute inset-0 bg-black/10 dark:bg-black/30 backdrop-blur-sm" />
                    
                    {/* Centered Sharp Image */}
                    <img 
                        src="/event_iscmctr_banner.png" 
                        alt="ISCMCTR-2026 Banner" 
                        className="relative z-10 h-full w-auto max-w-[90%] object-contain py-4 drop-shadow-2xl" 
                    />
                </div>
            ) : (
                <div className="w-full h-[320px] bg-gradient-to-br from-amber-500 via-[#d97706] to-red-600 dark:from-slate-900 dark:via-gh-bg dark:to-black relative overflow-hidden flex flex-col items-center justify-center border-b border-gray-200 dark:border-gh-border">
                    <div className="absolute inset-0 bg-white/5 dark:bg-white/0 opacity-30 mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23ffffff\\' fill-opacity=\\'0.1\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}} />
                    <div className="flex flex-col items-center justify-center relative z-10 text-white drop-shadow-md">
                        <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-black/20 backdrop-blur-md mb-6 border border-white/20">
                            <span className="material-symbols-outlined !text-[16px] text-amber-200 mr-2">stars</span>
                            <span className="text-[12px] font-bold tracking-[0.2em] text-amber-50 uppercase shadow-sm">The Finance Fiesta</span>
                        </div>
                        <h1 className="text-[64px] md:text-[80px] font-black tracking-tight leading-none mb-4 text-center px-4 -mt-2">
                            FORTUNE<span className="text-amber-300 drop-shadow-lg">26</span>
                        </h1>
                        <div className="flex items-center gap-2.5 text-white/90 font-medium tracking-widest text-[16px] px-6 py-2 bg-black/30 rounded-lg backdrop-blur-sm border border-white/10">
                            <span className="material-symbols-outlined !text-[20px]">calendar_month</span>
                            6TH & 7TH APRIL
                        </div>
                    </div>
                </div>
            )}

            {/* Content Container */}
            <div className="max-w-[1100px] mx-auto px-6 mt-8 flex flex-col lg:flex-row gap-6 items-start">
                
                {/* Left Column */}
                <div className="flex-1 w-full space-y-6">
                    {/* Header Card */}
                    <div className="bg-white dark:bg-gh-bg-secondary p-6 rounded-xl border border-gray-200 dark:border-gh-border shadow-sm flex items-start gap-5">
                        <div className="w-20 h-20 bg-black rounded flex items-center justify-center shrink-0 border border-gray-800">
                            <span className="material-symbols-outlined !text-[40px] text-amber-400">{iconStr}</span>
                        </div>
                        <div>
                            <h2 className="text-[22px] font-bold text-gray-900 dark:text-gh-text mb-3">{eventTitle}</h2>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-[14px] text-gray-500 dark:text-gh-text-secondary">
                                    <span className="material-symbols-outlined !text-[18px]">corporate_fare</span>
                                    <span>{eventOrg}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[14px] text-gray-500 dark:text-gh-text-secondary">
                                    <span className="material-symbols-outlined !text-[18px]">location_on</span>
                                    <span>{eventLoc}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* About Card */}
                    <div className="bg-white dark:bg-gh-bg-secondary p-8 rounded-xl border border-gray-200 dark:border-gh-border shadow-sm relative">
                        {/* Blue indicator line */}
                        <div className="absolute left-0 top-8 w-1 h-6 bg-blue-500 rounded-r" />
                        
                        <h3 className="text-[18px] font-bold text-gray-800 dark:text-gh-text mb-6 pl-4">Everything you need to know about {eventTitle}</h3>
                        
                        <div className="prose dark:prose-invert max-w-none text-[14px] text-gray-600 dark:text-gray-400 space-y-4">
                            {isIscmctr ? (
                                <>
                                    <p className="font-bold text-gray-800 dark:text-gray-200">About ISCMCTR-2026</p>
                                    <p className="leading-relaxed border-l-2 border-dashed border-gray-200 dark:border-gh-border pl-4">
                                        MITS – Deemed University, Gwalior is organizing the 4th International Student Conference on Multidisciplinary and Current Technical Research (ISCMCTR-2026) on 26–27 March 2026.
                                        <br/><br/>
                                        Students, researchers, and academicians are invited to attend the conference as participants.
                                        <br/><br/>
                                        🎓 E-Certificates will be provided to all participants.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="font-bold text-gray-800 dark:text-gray-200">About Fortune'26</p>
                                    <p className="leading-relaxed border-l-2 border-dashed border-gray-200 dark:border-gh-border pl-4">
                                        Fortune is the flagship event of <strong>Assets: The Finance & Investment Society of Delhi Technological University (DTU)</strong>, blending financial acumen, investment strategy, and market insights. As a national-level event, it attracts participants from across India for diverse contests, engaging panel discussions, and networking sessions with industry leaders and finance professionals. Fortune'26 offers an inspiring, innovative, and competitive environment for all attendees.
                                    </p>
                                    
                                    <p className="font-bold text-gray-800 dark:text-gray-200 mt-6 pt-6">About Assets DTU</p>
                                    <p className="leading-relaxed border-l-2 border-dashed border-gray-200 dark:border-gh-border pl-4">
                                        Assets is the Finance and Investment Society of Delhi Technological University, renowned for fostering financial literacy, investment thinking, and problem-solving expertise among students. By bridging the gap between academic knowledge and industry practices, Assets provides a platform for experiential learning through events, workshops, and live projects.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Opportunities Card */}
                    <div className="bg-white dark:bg-gh-bg-secondary p-8 rounded-xl border border-gray-200 dark:border-gh-border shadow-sm relative">
                        <div className="absolute left-0 top-8 w-1 h-6 bg-blue-500 rounded-r" />
                        
                        <div className="flex items-center justify-between mb-6 pl-4">
                            <h3 className="text-[18px] font-bold text-gray-800 dark:text-gh-text">Opportunities under Fortune'26</h3>
                            <button className="px-4 py-1.5 border border-gray-200 dark:border-gray-700 rounded-full text-[13px] font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <span className="material-symbols-outlined !text-[16px]">filter_list</span>
                                Eligible Only
                            </button>
                        </div>

                        {/* Child Opportunity Cards */}
                        <div className="w-[300px] border border-gray-200 dark:border-gh-border rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gh-bg-secondary">
                            <div className="w-full h-36 bg-[#fcf9f2] p-4 flex flex-col items-center justify-center relative border-b border-gray-100 dark:border-gh-border">
                                <span className="absolute top-2 right-2 bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                    <span className="material-symbols-outlined !text-[12px]">check_circle</span> You're eligible
                                </span>
                                <h4 className="text-[20px] font-serif uppercase tracking-widest text-[#7c6328]">MarkSense</h4>
                                <p className="text-[10px] uppercase text-[#7c6328]/70 mt-1 tracking-widest">The Marketing Competition</p>
                                <p className="text-[10px] font-bold tracking-widest mt-4 text-[#7c6328]">By CashKaro</p>
                            </div>
                            <div className="p-4">
                                <h5 className="font-bold text-[14px] text-gray-800 dark:text-gh-text mb-1 leading-tight line-clamp-2">MarkSense: The Marketing Competition by Cashkaro</h5>
                                <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-3 truncate">Delhi Technological University (DTU), ...</p>
                                <div className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400 font-medium pb-1">
                                    <span className="material-symbols-outlined !text-[16px]">schedule</span>
                                    5 days left
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column (Sidebar) */}
                <div className="w-full lg:w-[320px] flex flex-col gap-5 lg:sticky lg:top-6">
                    {/* Register Card */}
                    <div className="bg-white dark:bg-gh-bg-secondary rounded-xl border border-gray-200 dark:border-gh-border shadow-sm overflow-hidden flex flex-col items-center">
                        <div className="w-full p-6 pb-4">
                            <button 
                                onClick={() => navigate(`/marketplace/events/${id || 'ev-1'}/register`)}
                                className="w-full py-3 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-lg text-[15px] font-bold transition-all shadow-sm"
                            >
                                Register
                            </button>
                        </div>

                        <div className="w-full border-t border-gray-100 dark:border-gh-border p-6 flex flex-col gap-6">
                            
                            {/* Stat Row */}
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined">group</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">Registrations</span>
                                    <span className="text-[14px] font-bold text-gray-900 dark:text-gh-text">88</span>
                                </div>
                            </div>

                            {/* Stat Row */}
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined">schedule</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">Registration Deadline</span>
                                    <span className="text-[14px] font-bold text-gray-900 dark:text-gh-text text-[#b91c1c] dark:text-red-400">7 days left</span>
                                </div>
                            </div>

                            {/* Stat Row */}
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined">groups</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">Team Size</span>
                                    <span className="text-[14px] font-bold text-gray-900 dark:text-gh-text">{isIscmctr ? "1 Member (Individual)" : "1 - 4 Members"}</span>
                                </div>
                            </div>

                            {/* Stat Row */}
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined">visibility</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">Impressions</span>
                                    <span className="text-[14px] font-bold text-gray-900 dark:text-gh-text">14,939</span>
                                </div>
                            </div>

                            {/* Stat Row */}
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined">event</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">Registration Deadline</span>
                                    <span className="text-[14px] font-bold text-gray-900 dark:text-gh-text">31 Mar 26, 11:59 PM IST</span>
                                </div>
                            </div>

                        </div>
                        
                        <div className="w-full flex items-center justify-center pb-6">
                            <button className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-[13px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <span className="material-symbols-outlined !text-[18px]">favorite</span>
                                + Watchlist
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default EventDetailView;
