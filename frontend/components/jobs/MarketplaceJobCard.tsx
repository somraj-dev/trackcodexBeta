import React from "react";

interface MarketplaceJobCardProps {
    job: {
        id: string;
        title: string;
        description: string;
        positions: number;
        type: string;
        location: string;
        icon: string;
        iconBg: string;
    };
}

const MarketplaceJobCard: React.FC<MarketplaceJobCardProps> = ({ job }) => {
    return (
        <div className="bg-white border border-slate-100 rounded-[32px] p-8 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 cursor-pointer group flex flex-col h-full relative border-b-4 border-b-transparent hover:border-b-primary/20">
            {/* Header: Logo and Menu */}
            <div className="flex justify-between items-start mb-8">
                <div 
                    className={`size-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-500`}
                    style={{ backgroundColor: job.iconBg }}
                >
                    <span className="material-symbols-outlined !text-[32px]">{job.icon}</span>
                </div>
                <button className="text-slate-400 hover:text-slate-600 p-2 -mr-2 transition-colors">
                    <span className="material-symbols-outlined">more_vert</span>
                </button>
            </div>

            {/* Content: Title and Description */}
            <div className="flex-1">
                <h3 className="text-[20px] font-bold text-slate-800 mb-3 group-hover:text-primary transition-colors duration-300">
                    {job.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 font-medium">
                    {job.description}
                </p>
            </div>

            {/* Footer: Tags */}
            <div className="flex flex-wrap gap-2 mt-8">
                <span className="px-5 py-2 bg-slate-100/80 text-slate-600 rounded-full text-xs font-bold tracking-tight">
                    {job.positions} Positions
                </span>
                <span className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold tracking-tight">
                    {job.type}
                </span>
                <span className="px-5 py-2 bg-amber-50 text-orange-600 rounded-full text-xs font-bold tracking-tight">
                    {job.location}
                </span>
            </div>
        </div>
    );
};

export default MarketplaceJobCard;
