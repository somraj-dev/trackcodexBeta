import React, { useState } from "react";
import MarketplaceJobCard from "../../components/jobs/MarketplaceJobCard";

const MOCK_MARKETPLACE_JOBS = [
    {
        id: "1",
        title: "Senior Product Designer",
        description: "A product designer makes a practical and functional product as artistic and attractive to a consumer as possible.",
        positions: 2,
        type: "Full Time",
        location: "WFO",
        icon: "polymer", // Closest to Figma's swirl
        iconBg: "#fee2e2", // light-pink/red
    },
    {
        id: "2",
        title: "Vuejs Developer",
        description: "A product designer makes a practical and functional product as artistic and attractive to a consumer as possible.",
        positions: 2,
        type: "Full Time",
        location: "WFO",
        icon: "eco", // Closest to Vue's V-leaf
        iconBg: "#dcfce7", // light-green
    },
    {
        id: "3",
        title: "ReactJS Developer",
        description: "A product designer makes a practical and functional product as artistic and attractive to a consumer as possible.",
        positions: 2,
        type: "Full Time",
        location: "WFO",
        icon: "science", // Closest to React
        iconBg: "#e0f2fe", // light-blue
    },
    {
        id: "4",
        title: "Python Developer",
        description: "A product designer makes a practical and functional product as artistic and attractive to a consumer as possible.",
        positions: 2,
        type: "Full Time",
        location: "WFO",
        icon: "token", // Closest to Python logo swirl
        iconBg: "#fef9c3", // light-yellow
    },
    {
        id: "5",
        title: "Senior Product Designer",
        description: "A product designer makes a practical and functional product as artistic and attractive to a consumer as possible.",
        positions: 2,
        type: "Full Time",
        location: "WFO",
        icon: "polymer",
        iconBg: "#fee2e2",
    },
    {
        id: "6",
        title: "Python Developer",
        description: "A product designer makes a practical and functional product as artistic and attractive to a consumer as possible.",
        positions: 2,
        type: "Full Time",
        location: "WFO",
        icon: "token",
        iconBg: "#fef9c3",
    },
    {
        id: "7",
        title: "Java Developer",
        description: "A product designer makes a practical and functional product as artistic and attractive to a consumer as possible.",
        positions: 2,
        type: "Full Time",
        location: "WFO",
        icon: "coffee", // Java
        iconBg: "#f1f5f9", // light-grey
    },
    {
        id: "8",
        title: "Vuejs Developer",
        description: "A product designer makes a practical and functional product as artistic and attractive to a consumer as possible.",
        positions: 2,
        type: "Full Time",
        location: "WFO",
        icon: "eco",
        iconBg: "#dcfce7",
    },
];

const MarketplaceJobsView = () => {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredJobs = MOCK_MARKETPLACE_JOBS.filter(job => 
        job.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-10 bg-slate-50/30 min-h-full">
            <div className="max-w-[1400px] mx-auto">
                {/* Search Bar */}
                <div className="flex items-center justify-between mb-10 gap-4">
                    <div className="relative flex-1 max-w-md group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-primary transition-colors">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Search engineering roles..."
                            className="w-full bg-white border border-slate-200 rounded-[20px] pl-12 pr-6 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Job Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredJobs.map((job) => (
                        <MarketplaceJobCard key={job.id} job={job} />
                    ))}
                    
                    {filteredJobs.length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50/50">
                            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">work_off</span>
                            <h3 className="text-xl font-bold text-slate-800">No jobs found</h3>
                            <p className="text-slate-500">Try adjusting your search criteria</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarketplaceJobsView;
