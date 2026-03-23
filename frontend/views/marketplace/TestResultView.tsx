import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TestResultView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [step, setStep] = useState<'analyzing' | 'result'>('analyzing');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (step === 'analyzing') {
            const interval = setInterval(() => {
                setProgress(prev => {
                    const next = prev + 15 + Math.random() * 10;
                    if (next >= 100) {
                        clearInterval(interval);
                        setTimeout(() => setStep('result'), 500);
                        return 100;
                    }
                    return next;
                });
            }, 400);
            return () => clearInterval(interval);
        }
    }, [step]);

    // Mock Data based on the reference image
    const stats = {
        total: 30,
        correct: 13,
        incorrect: 16,
        unattempted: 1
    };

    if (step === 'analyzing') {
        return (
            <div className="min-h-screen bg-[#fafafb] dark:bg-gh-bg font-sans flex flex-col items-center">
                {/* Minimal Header just for Analyzing step */}
                <header className="w-full border-b border-gray-200 dark:border-gh-border bg-white dark:bg-gh-bg-secondary px-6 py-4 flex items-center gap-3 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold tracking-tighter shadow-sm">
                        TC
                    </div>
                    <span className="text-gray-400 dark:text-gray-600">|</span>
                    <h1 className="text-sm font-semibold text-gray-700 dark:text-gh-text">Embedded Systems Engineer - Mock Test</h1>
                </header>

                <main className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl px-6">
                    <h2 className="text-2xl font-bold text-[#0B2147] dark:text-blue-100 mb-2">Analyzing Your Performance</h2>
                    <p className="text-[14px] text-gray-500 dark:text-gh-text-secondary mb-10 text-center max-w-sm leading-relaxed">
                        Our AI is analyzing your responses to provide personalized feedback
                    </p>

                    <div className="bg-white dark:bg-[#1a1a1c] border border-gray-100 dark:border-gh-border rounded-[14px] p-5 w-[420px] flex items-center gap-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
                        <div className="w-12 h-12 bg-[#eff4ff] dark:bg-blue-900/30 rounded-full flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 !text-[26px] animate-pulse">psychology</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-[13px] font-medium text-gray-800 dark:text-gh-text mb-2.5">Analyzing performance patterns...</p>
                            <div className="w-full h-[6px] bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Result Step
    return (
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-gh-bg font-sans flex flex-col items-center justify-center p-6">
            <h1 className="text-[28px] font-bold text-[#2d3748] dark:text-gh-text mb-8 tracking-tight">
                Embedded Systems Engineer - Mock Test
            </h1>

            <div className="bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-gh-border rounded-[12px] shadow-sm flex items-stretch divide-x divide-gray-200 dark:divide-gh-border mb-8 py-2">
                
                {/* Total Score */}
                <div className="px-8 py-4 flex flex-col items-center justify-center min-w-[140px]">
                    <span className="material-symbols-outlined text-gray-400 dark:text-gh-text-secondary mb-2 !text-[28px]">leaderboard</span>
                    <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium mb-1">Total Score</span>
                    <div className="text-[26px] font-black text-gray-800 dark:text-white tracking-tight">
                        {stats.correct}<span className="text-gray-400 dark:text-gray-500 text-xl font-bold">/{stats.total}</span>
                    </div>
                </div>

                {/* Questions */}
                <div className="px-8 py-4 flex flex-col items-center justify-center min-w-[120px]">
                    <span className="material-symbols-outlined text-gray-400 dark:text-gh-text-secondary mb-2 !text-[28px]">help</span>
                    <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium mb-1">Questions</span>
                    <div className="text-[24px] font-bold text-gray-800 dark:text-white tracking-tight">{stats.total}</div>
                </div>

                {/* Correct */}
                <div className="px-8 py-4 flex flex-col items-center justify-center min-w-[120px]">
                    <span className="material-symbols-outlined text-gray-400 dark:text-gh-text-secondary mb-2 !text-[28px]">done_all</span>
                    <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium mb-1">Correct</span>
                    <div className="text-[24px] font-bold text-gray-800 dark:text-white tracking-tight">{stats.correct}</div>
                </div>

                {/* Incorrect */}
                <div className="px-8 py-4 flex flex-col items-center justify-center min-w-[120px]">
                    <span className="material-symbols-outlined text-gray-400 dark:text-gh-text-secondary mb-2 !text-[28px]">cancel</span>
                    <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium mb-1">Incorrect</span>
                    <div className="text-[24px] font-bold text-gray-800 dark:text-white tracking-tight">{stats.incorrect}</div>
                </div>

                {/* Unattempted */}
                <div className="px-8 py-4 flex flex-col items-center justify-center min-w-[120px]">
                    <span className="material-symbols-outlined text-gray-400 dark:text-gh-text-secondary mb-2 !text-[28px]">close</span>
                    <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium mb-1">Unattempted</span>
                    <div className="text-[24px] font-bold text-gray-800 dark:text-white tracking-tight">{stats.unattempted}</div>
                </div>

            </div>

            <div className="w-full max-w-[700px] flex justify-start">
                <button 
                    onClick={() => navigate('/marketplace/hackathons')}
                    className="bg-[#0a66c2] hover:bg-[#004182] dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-6 py-2.5 rounded text-[14px] font-medium transition-colors shadow-sm"
                >
                    Go to Home
                </button>
            </div>
        </div>
    );
};

export default TestResultView;
