import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Hackathon {
    id: string;
    role: string;
    company: string;
    logo: string;
    logoBg: string;
    logoText?: string;
}

const MOCK_HACKATHONS: Hackathon[] = [
    {
        id: 'tcs-se',
        role: 'Software Engineer',
        company: 'TCS',
        logo: '',
        logoBg: '#1a1a2e',
        logoText: 'tcs',
    },
    {
        id: 'nvidia-ese',
        role: 'Embedded Systems Engineer',
        company: 'NVIDIA',
        logo: '',
        logoBg: '#76b900',
        logoText: '⬡',
    },
    {
        id: 'accenture-se',
        role: 'Software Engineer',
        company: 'Accenture',
        logo: '',
        logoBg: '#A100FF',
        logoText: '>',
    },
    {
        id: 'deloitte-da',
        role: 'Data Analyst',
        company: 'Deloitte',
        logo: '',
        logoBg: '#ffffff',
        logoText: 'Deloitte.',
    },
    {
        id: 'ey-da',
        role: 'Data Analyst',
        company: 'EY',
        logo: '',
        logoBg: '#2E2E38',
        logoText: 'EY',
    },
    {
        id: 'fractal-da',
        role: 'Data Analyst',
        company: 'Fractal Analytics',
        logo: '',
        logoBg: '#1a1a2e',
        logoText: 'fractal••',
    },
    {
        id: 'tcs-qa',
        role: 'QA Engineer',
        company: 'Tata Consultancy',
        logo: '',
        logoBg: '#1a1a2e',
        logoText: 'tcs',
    },
    {
        id: 'reliance-ge',
        role: 'Graduate Engineer',
        company: 'Reliance Industries',
        logo: '',
        logoBg: '#C8903B',
        logoText: '®',
    },
    {
        id: 'wipro-qa',
        role: 'QA Engineer',
        company: 'Wipro',
        logo: '',
        logoBg: '#4B286D',
        logoText: 'wipro',
    },
];

const HackathonsView = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const displayed = MOCK_HACKATHONS.filter(h => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return h.role.toLowerCase().includes(q) || h.company.toLowerCase().includes(q);
    });

    return (
        <div className="p-8">
            <div className="max-w-[1400px] mx-auto">
                {/* Top Bar */}
                <div className="flex items-center justify-between mb-8">
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gh-text-secondary text-lg group-focus-within:text-primary">search</span>
                        <input
                            className="bg-gh-bg-secondary border border-gh-border rounded-full pl-12 pr-6 py-3 text-sm text-gh-text focus:ring-1 focus:ring-primary w-96 outline-none transition-all duration-300"
                            placeholder="Search by role, company, or skill..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {displayed.map(hackathon => (
                        <div
                            key={hackathon.id}
                            className="bg-white dark:bg-gh-bg-secondary border border-gray-200 dark:border-gh-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 cursor-pointer group flex flex-col"
                        >
                            {/* Logo Area */}
                            <div
                                className="h-32 flex items-center justify-center relative overflow-hidden"
                                style={{ backgroundColor: hackathon.logoBg }}
                            >
                                <span
                                    className="text-3xl font-black tracking-tight select-none"
                                    style={{
                                        color: hackathon.logoBg === '#ffffff' ? '#000000' : '#ffffff',
                                        fontFamily: "'Inter', sans-serif",
                                    }}
                                >
                                    {hackathon.logoText}
                                </span>
                                {/* Subtle gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                            </div>

                            {/* Info Area */}
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-bold text-gray-900 dark:text-gh-text text-[15px] mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight truncate">
                                    {hackathon.role}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gh-text-secondary mb-4">
                                    {hackathon.company}
                                </p>
                                <div className="mt-auto">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/marketplace/hackathons/${hackathon.id}/test`);
                                        }}
                                        className="px-6 py-2 border border-gray-300 dark:border-gh-border rounded-full text-sm font-semibold text-gray-700 dark:text-gh-text hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                                    >
                                        Start Test
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {displayed.length === 0 && (
                    <div className="col-span-full py-16 text-center text-gh-text-secondary border border-dashed border-gh-border rounded-2xl bg-gh-bg-secondary mt-4">
                        <span className="material-symbols-outlined text-4xl mb-4 opacity-50">search_off</span>
                        <h3 className="text-lg font-bold text-gh-text mb-2">No hackathons found.</h3>
                        <p className="text-sm">Try adjusting your search criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HackathonsView;
