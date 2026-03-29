import React from "react";
import { useNavigate } from "react-router-dom";

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
    const navigate = useNavigate();
    return (
        <div 
            onClick={() => navigate(`/marketplace/jobs/${job.id}`)}
            className="bg-gh-bg border border-gh-border rounded-[32px] p-8 hover:shadow-2xl hover:shadow-black/50 transition-all duration-500 cursor-pointer group flex flex-col h-full relative border-b-4 border-b-transparent hover:border-b-primary/20"
        >
            {/* Header: Logo and Menu */}
            <div className="flex justify-between items-start mb-8">
                <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center p-3.5 transition-transform duration-500 group-hover:scale-110 shadow-sm border border-gh-border/50"
                    style={{ backgroundColor: job.iconBg || 'var(--gh-bg-secondary)' }}
                >
                    <span className="material-symbols-outlined !text-[32px]">{job.icon}</span>
                </div>
                <button className="text-gh-text-secondary hover:text-primary transition-colors p-2 -mr-2">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1">
                <h3 className="text-2xl font-black text-gh-text mb-3 tracking-tight group-hover:text-primary transition-colors duration-300">
                    {job.title}
                </h3>
                <p className="text-gh-text-secondary leading-relaxed text-[15px] mb-8 font-medium line-clamp-3">
                    {job.description}
                </p>
            </div>

            {/* Footer tags */}
            <div className="flex flex-wrap items-center gap-3 mt-auto pt-8 border-t border-gh-border/50">
                <div className="bg-gh-bg-secondary px-5 py-2.5 rounded-2xl flex items-center gap-2 border border-gh-border/50">
                    <span className="text-gh-text-secondary text-[13px] font-bold">{job.positions} Positions</span>
                </div>
                <div className="bg-primary/5 px-5 py-2.5 rounded-2xl flex items-center gap-2 border border-primary/10">
                    <span className="text-primary text-[13px] font-black uppercase tracking-wider">{job.type}</span>
                </div>
                <div className="bg-amber-500/5 px-5 py-2.5 rounded-2xl flex items-center gap-2 border border-amber-500/10">
                    <span className="text-amber-600 dark:text-amber-500 text-[13px] font-bold">{job.location}</span>
                </div>
            </div>
        </div>
    );
};

export default MarketplaceJobCard;
