import React from "react";

const HiringAnalyticsView = () => {
    return (
        <div className="p-8 text-gh-text max-w-[1200px] mx-auto">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight mb-2">Analytics</h1>
                    <p className="text-gh-text-secondary font-medium">
                        Gain insights into your hiring funnel and team growth metrics.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 bg-gh-bg-secondary border border-gh-border rounded-xl">
                    <p className="text-sm text-gh-text-secondary mb-2">Total Candidates Evaluated</p>
                    <p className="text-xl font-semibold text-white">124</p>
                </div>
                <div className="p-6 bg-gh-bg-secondary border border-gh-border rounded-xl">
                    <p className="text-sm text-gh-text-secondary mb-2">Average Time to Hire</p>
                    <p className="text-xl font-semibold text-amber-500">18 Days</p>
                </div>
                <div className="p-6 bg-gh-bg-secondary border border-gh-border rounded-xl">
                    <p className="text-sm text-gh-text-secondary mb-2">Offer Acceptance Rate</p>
                    <p className="text-xl font-semibold text-emerald-500">83%</p>
                </div>
            </div>

            <div className="py-20 text-center border border-dashed border-gh-border rounded-2xl bg-gh-bg-secondary">
                <span className="material-symbols-outlined text-4xl mb-4 text-primary">monitoring</span>
                <h3 className="text-lg font-bold text-gh-text mb-2">Advanced Analytics Coming Soon</h3>
                <p className="text-gh-text-secondary text-sm">
                    Detailed funnel tracking and predictive insights are being generated.
                </p>
            </div>
        </div>
    );
};

export default HiringAnalyticsView;


