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
        metadata: {
            location: "Bangalore, India",
            endDate: "2026-05-15T23:59:59Z",
            responsibilities: [
                "Create high-fidelity mockups and prototypes using Figma.",
                "Collaborate with product managers to define user flows.",
                "Conduct user research and usability testing.",
                "Maintain and evolve the design system components."
            ],
            requirements: [
                "Bachelor's degree in Design or related field.",
                "Portfolio demonstrating expertise in UI/UX design.",
                "Proficiency in Figma and Adobe Creative Suite.",
                "Experience with responsive web and mobile design."
            ],
            recruitmentProcess: [
                { name: "Portfolio Review", detail: "Review of your past work", type: "Offline", icon: "fact_check" },
                { name: "Design Challenge", detail: "Take-home assignment", type: "Online", icon: "edit" }
            ],
            additionalInfo: {
                salary: { min: "₹ 15,00,000", max: "₹ 25,00,000", period: "/Year" },
                workDetail: "Hybrid Model (3 days office)",
                jobType: { type: "In Office", timing: "Full Time" }
            }
        }
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
        metadata: {
            location: "Remote",
            endDate: "2026-04-30T23:59:59Z",
            responsibilities: [
                "Develop and maintain frontend applications using Vue.js 3 and Vite.",
                "Implement scalable state management with Pinia.",
                "Write clean, modular, and well-documented Vue components.",
                "Collaborate with backend developers for API integration."
            ],
            requirements: [
                "Strong proficiency in JavaScript/TypeScript.",
                "3+ years of experience with Vue.js framework.",
                "Familiarity with Tailwind CSS and CSS-in-JS.",
                "Knowledge of frontend build tools like Vite and Webpack."
            ],
            recruitmentProcess: [
                { name: "Technical Interview", detail: "Deep dive into Vue architecture", type: "Online", icon: "code" }
            ],
            additionalInfo: {
                salary: { min: "₹ 8,00,000", max: "₹ 18,00,000", period: "/Year" },
                workDetail: "Remote First",
                jobType: { type: "Remote", timing: "Full Time" }
            }
        }
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
        metadata: {
            location: "Hyderabad, India",
            endDate: "2026-06-10T23:59:59Z",
            responsibilities: [
                "Build dynamic user interfaces with React and Next.js.",
                "Optimize application performance for maximum speed.",
                "Work closely with UI/UX designers to implement pixel-perfect designs.",
                "Participate in code reviews and advocate for best practices."
            ],
            requirements: [
                "2+ years of professional React development experience.",
                "Proficiency in React Hooks, Context API, and Redux.",
                "Experience with Next.js and Server-Side Rendering (SSR).",
                "Strong understanding of CSS Flexbox and Grid."
            ],
            recruitmentProcess: [
                { name: "Initial Screening", detail: "General background check", type: "Online", icon: "person_search" },
                { name: "React Quiz", detail: "Interactive assessment", type: "Online", icon: "quiz" }
            ],
            additionalInfo: {
                salary: { min: "₹ 12,00,000", max: "₹ 20,00,000", period: "/Year" },
                workDetail: "Standard 40-hour work week",
                jobType: { type: "In Office", timing: "Full Time" }
            }
        }
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
        <div className="p-10 bg-gh-bg min-h-full">
            <div className="max-w-[1400px] mx-auto">
                {/* Search Bar */}
                <div className="flex items-center justify-between mb-10 gap-4">
                    <div className="relative flex-1 max-w-md group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gh-text-secondary text-lg group-focus-within:text-primary transition-colors">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Search engineering roles..."
                            className="w-full bg-gh-bg-secondary border border-gh-border rounded-[20px] pl-12 pr-6 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm text-gh-text"
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
