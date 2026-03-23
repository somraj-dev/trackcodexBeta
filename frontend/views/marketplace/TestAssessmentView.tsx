import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const MOCK_QUESTIONS = [
    {
        id: 1,
        text: "When performing data cleaning for a Deloitte client's financial dataset, you encounter missing values in the 'Revenue' column. Which imputation strategy would be most appropriate to maintain the integrity of the financial data and minimize bias?",
        difficulty: "MEDIUM",
        options: [
            "Replace missing values with the mean of the 'Revenue' column.",
            "Replace missing values with the median of the 'Revenue' column.",
            "Replace missing values with 0, assuming no revenue was generated.",
            "Remove all rows containing missing 'Revenue' values."
        ]
    },
    {
        id: 2,
        text: "In Python, which built-in function is used to convert an iterable into a list?",
        difficulty: "EASY",
        options: [
            "list()",
            "toList()",
            "convert_list()",
            "[]"
        ]
    },
    {
        id: 3,
        text: "What is the primary purpose of the 'GROUP BY' clause in an SQL query?",
        difficulty: "MEDIUM",
        options: [
            "To filter records based on a specific condition.",
            "To sort the result set in ascending or descending order.",
            "To arrange identical data into groups.",
            "To join two or more tables together based on a related column."
        ]
    },
    {
        id: 4,
        text: "Which of the following machine learning algorithms is best suited for predicting a continuous numeric value?",
        difficulty: "HARD",
        options: [
            "Logistic Regression",
            "Decision Tree Classifier",
            "K-Nearest Neighbors (Classification)",
            "Linear Regression"
        ]
    }
];

type Step = 'difficulty' | 'preparing' | 'guidelines' | 'assessment';

const TestAssessmentView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // Overall Flow State
    const [step, setStep] = useState<Step>('difficulty');
    
    // Step 1: Difficulty
    const [difficulty, setDifficulty] = useState<string>('');
    
    // Step 2: Preparing
    const [loadingProgress, setLoadingProgress] = useState(0);

    // Step 3: Guidelines
    const [startText, setStartText] = useState('');

    // Step 4: Assessment
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [timeLeft, setTimeLeft] = useState(36);
    
    // Post-Assessment: Summary Modal
    const [showSummaryModal, setShowSummaryModal] = useState(false);

    const question = MOCK_QUESTIONS[currentQuestionIdx];
    const attemptedCount = Object.keys(selectedAnswers).length;

    // --- Loading Screen Effect ---
    useEffect(() => {
        if (step === 'preparing') {
            const interval = setInterval(() => {
                setLoadingProgress(prev => {
                    const next = prev + Math.random() * 15;
                    if (next >= 100) {
                        clearInterval(interval);
                        setTimeout(() => setStep('guidelines'), 400);
                        return 100;
                    }
                    return next;
                });
            }, 300);
            return () => clearInterval(interval);
        }
    }, [step]);

    // --- Assessment Timer Effect ---
    useEffect(() => {
        if (step === 'assessment' && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft, step]);


    // --- Handlers ---
    const handleSelectOption = (option: string) => {
        setSelectedAnswers(prev => ({ ...prev, [question.id]: option }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIdx < MOCK_QUESTIONS.length - 1) {
            setCurrentQuestionIdx(prev => prev + 1);
            setTimeLeft(36); 
        } else {
            setShowSummaryModal(true);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIdx > 0) {
            setCurrentQuestionIdx(prev => prev - 1);
        }
    };

    
    // --- Render Helpers ---

    const renderHeader = (showNav = false) => (
        <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gh-border bg-white dark:bg-gh-bg z-10 shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold tracking-tighter">
                    TC
                </div>
                <h1 className="text-sm font-semibold text-gray-700 dark:text-gh-text">Embedded Systems Engineer - Mock Test</h1>
            </div>

            {showNav && (
                <div className="flex items-center gap-1 bg-gray-50 dark:bg-gh-bg-secondary border border-gray-200 dark:border-gh-border rounded-md p-1">
                    <button 
                        onClick={handlePreviousQuestion}
                        disabled={currentQuestionIdx === 0}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gh-text-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                        <span className="material-symbols-outlined !text-[18px]">chevron_left</span>
                    </button>
                    
                    {MOCK_QUESTIONS.map((q, idx) => {
                        const isAttempted = !!selectedAnswers[q.id];
                        return (
                            <button
                                key={q.id}
                                onClick={() => setCurrentQuestionIdx(idx)}
                                className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                                    currentQuestionIdx === idx
                                        ? "bg-gray-800 dark:bg-white text-white dark:text-gray-900 shadow-sm"
                                        : isAttempted 
                                            ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60" 
                                            : "text-gray-600 dark:text-gh-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700"
                                }`}
                            >
                                {idx + 1}
                            </button>
                        )
                    })}
                    
                    <button 
                        onClick={handleNextQuestion}
                        disabled={currentQuestionIdx === MOCK_QUESTIONS.length - 1}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gh-text-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                        <span className="material-symbols-outlined !text-[18px]">chevron_right</span>
                    </button>
                    <div className="w-px h-5 bg-gray-300 dark:bg-gh-border mx-1" />
                    <button 
                        onClick={() => setShowSummaryModal(true)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gh-text-secondary transition-colors"
                    >
                        <span className="material-symbols-outlined !text-[18px]">grid_view</span>
                    </button>
                </div>
            )}

            <div className="w-[150px]"></div> {/* Spacer */}
        </header>
    );

    // --- Steps ---

    if (step === 'difficulty') {
        const levels = [
            { id: 'Novice', color: '#10b981', bars: 1 },
            { id: 'Easy', color: '#34d399', bars: 2 },
            { id: 'Intermediate', color: '#fbbf24', bars: 3 },
            { id: 'Master', color: '#f97316', bars: 4 },
            { id: 'Expert', color: '#dc2626', bars: 5 },
        ];

        return (
            <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-gray-50/30 dark:bg-[#1a1a1c] font-sans text-gray-800 dark:text-gh-text">
                {renderHeader()}
                <main className="flex-1 flex flex-col items-center justify-center">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-gh-text mb-12">Select difficulty level</h2>
                    
                    <div className="flex gap-4">
                        {levels.map(lvl => (
                            <button
                                key={lvl.id}
                                onClick={() => setDifficulty(lvl.id)}
                                className={`w-36 h-40 bg-white dark:bg-gh-bg-secondary border rounded-xl flex flex-col items-center justify-center gap-6 transition-all duration-300 ${
                                    difficulty === lvl.id 
                                        ? "border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-500/10 scale-105" 
                                        : "border-gray-200 dark:border-gh-border hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md"
                                }`}
                            >
                                <div className="flex items-end gap-1 h-8">
                                    {[1,2,3,4,5].map(barIndex => (
                                        <div 
                                            key={barIndex} 
                                            className="w-2 rounded-t-sm transition-all"
                                            style={{ 
                                                height: `${barIndex * 6}px`, 
                                                backgroundColor: barIndex <= lvl.bars ? lvl.color : '#e5e7eb',
                                                opacity: barIndex <= lvl.bars ? 1 : 0.5
                                            }}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm font-semibold text-gray-600 dark:text-gh-text-secondary">{lvl.id}</span>
                            </button>
                        ))}
                    </div>
                </main>
                <footer className="px-8 py-4 border-t border-gray-200 dark:border-gh-border bg-white dark:bg-gh-bg flex justify-end shrink-0">
                    <button
                        disabled={!difficulty}
                        onClick={() => setStep('preparing')}
                        className="px-8 py-2.5 bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-semibold rounded hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gh-text disabled:opacity-50 transition-colors"
                    >
                        Next
                    </button>
                </footer>
            </div>
        );
    }

    if (step === 'preparing') {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-gray-50/30 dark:bg-[#1a1a1c] font-sans text-gray-800 dark:text-gh-text">
                {renderHeader()}
                <main className="flex-1 flex flex-col items-center justify-center pb-20">
                    <h2 className="text-2xl font-bold text-[#0B2147] dark:text-blue-100 mb-2 tracking-tight">Preparing Your Assessment</h2>
                    <p className="text-sm text-gray-500 dark:text-gh-text-secondary mb-8 max-w-sm text-center leading-relaxed">
                        Our AI is crafting personalized questions based on your requirements
                    </p>
                    
                    <div className="bg-white dark:bg-gh-bg-secondary border border-gray-200 dark:border-gh-border rounded-xl p-6 shadow-xl shadow-gray-200/40 dark:shadow-none w-[400px] flex items-center gap-4 relative overflow-hidden">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 !text-[28px] animate-pulse">psychology</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-[13px] font-medium text-gray-800 dark:text-gh-text mb-3">Analyzing requirements...</p>
                            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${loadingProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-[11px] text-gray-400 mt-6 tracking-wide">
                        It might take upto 30 seconds to generate the questions!
                    </p>
                </main>
            </div>
        );
    }

    if (step === 'guidelines') {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-white dark:bg-gh-bg font-sans text-gray-800 dark:text-gh-text">
                {renderHeader()}
                <main className="flex-1 flex overflow-hidden">
                    {/* Left Panel */}
                    <div className="w-1/2 h-full bg-[#f8f9fc] dark:bg-[#121212] p-16 flex flex-col justify-center border-r border-gray-200 dark:border-gh-border">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gh-text mb-10 tracking-tight">Embedded Systems Engineer - Mock Test</h2>
                        
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-12">
                                <span className="flex items-center gap-2 text-[13px] font-medium text-gray-500 dark:text-gh-text-secondary w-24">
                                    <span className="material-symbols-outlined !text-[18px]">help</span> Questions
                                </span>
                                <span className="font-semibold text-gray-800 dark:text-gh-text text-[15px]">{MOCK_QUESTIONS.length}</span>
                            </div>
                            <div className="flex items-center gap-12">
                                <span className="flex items-center gap-2 text-[13px] font-medium text-gray-500 dark:text-gh-text-secondary w-24">
                                    <span className="material-symbols-outlined !text-[18px]">task</span> Marks
                                </span>
                                <span className="font-semibold text-gray-800 dark:text-gh-text text-[15px]">{MOCK_QUESTIONS.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div className="w-1/2 h-full bg-white dark:bg-gh-bg p-16 flex flex-col justify-center">
                        <h3 className="flex items-center gap-2 font-bold text-gray-800 dark:text-gh-text mb-8 tracking-tight">
                            <span className="material-symbols-outlined !text-[20px]">lightbulb</span> Guidelines
                        </h3>
                        
                        <div className="mb-4">
                            <h4 className="font-bold text-gray-800 dark:text-gh-text text-sm mb-4">Timelines & Questions</h4>
                            <ul className="space-y-3 mb-10">
                                <li className="flex items-start text-[13px] text-gray-600 dark:text-gh-text-secondary">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600 mt-1.5 mr-3 shrink-0" />
                                    <span><strong className="text-gray-800 dark:text-gh-text font-semibold">Assessment Duration:</strong> 00:03:00 (hh:mm:ss)</span>
                                </li>
                                <li className="flex items-start text-[13px] text-gray-600 dark:text-gh-text-secondary">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600 mt-1.5 mr-3 shrink-0" />
                                    <span><strong className="text-gray-800 dark:text-gh-text font-semibold">Total Questions to be answered:</strong> {MOCK_QUESTIONS.length} Questions</span>
                                </li>
                                <li className="flex items-start text-[13px] text-gray-600 dark:text-gh-text-secondary">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600 mt-1.5 mr-3 shrink-0" />
                                    <span>Do not close the window or tab if you wish to continue the application.</span>
                                </li>
                                <li className="flex items-start text-[13px] text-gray-600 dark:text-gh-text-secondary">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600 mt-1.5 mr-3 shrink-0" />
                                    <span>Please ensure that you attempt the assessment in one sitting as once you start the assessment, the timer won't stop.</span>
                                </li>
                            </ul>
                        </div>

                        <div className="flex gap-4">
                            <input
                                type="text"
                                placeholder='Type "start" to Start'
                                value={startText}
                                onChange={(e) => setStartText(e.target.value)}
                                className="flex-1 px-4 py-2 bg-white dark:bg-gh-bg-secondary border border-gray-300 dark:border-gh-border rounded focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 text-sm text-gray-800 dark:text-gh-text"
                            />
                            <button
                                disabled={startText.toLowerCase() !== 'start'}
                                onClick={() => {
                                    setStep('assessment');
                                    setTimeLeft(180); // 3 minutes total for demo
                                }}
                                className={`px-6 text-sm font-semibold rounded transition-colors ${
                                    startText.toLowerCase() === 'start' 
                                        ? "bg-gray-800 dark:bg-white text-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-200 shadow-md" 
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                                }`}
                            >
                                Start &rarr;
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Step 4: Assessment
    return (
        <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-white dark:bg-gh-bg font-sans text-gray-800 dark:text-gh-text">
            {renderHeader(true)}

            {/* Main Content Area */}
            <main className="flex-1 flex overflow-hidden relative">
                {/* Left Panel: Question */}
                <div className="w-1/2 h-full bg-[#f8f9fc] dark:bg-[#121212] p-8 lg:p-12 overflow-y-auto border-r border-gray-200 dark:border-gh-border">
                    <div className="flex items-center gap-3 mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gh-text">Question {currentQuestionIdx + 1}</h2>
                        <span className="px-3 py-0.5 border border-gray-300 dark:border-gh-border rounded-full text-[11px] font-bold tracking-wider text-gray-500 dark:text-gh-text-secondary uppercase">
                            {question.difficulty}
                        </span>
                    </div>
                    
                    <p className="text-[15px] leading-relaxed text-gray-700 dark:text-gh-text-secondary">
                        {question.text}
                    </p>
                </div>

                {/* Right Panel: Answer */}
                <div className="w-1/2 h-full bg-white dark:bg-gh-bg flex flex-col">
                    {/* Timer Bar */}
                    <div className="w-full bg-[#fff0e6] dark:bg-[#3d1a0e] py-1.5 flex justify-center items-center relative overflow-hidden">
                        {/* Progress line */}
                        <div 
                            className="absolute top-0 left-0 h-0.5 bg-[#e45115] transition-all duration-1000 ease-linear"
                            style={{ width: ((timeLeft / 180) * 100) + '%' }}
                        />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                            Time Left <span className="text-[#e45115] font-bold">{Math.floor(timeLeft / 60)}m {timeLeft % 60}s</span>
                        </span>
                    </div>

                    <div className="p-8 lg:p-12 overflow-y-auto flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gh-text mb-6">Answer</h3>
                        
                        <div className="space-y-4">
                            {question.options.map((option, idx) => {
                                const isSelected = selectedAnswers[question.id] === option;
                                return (
                                    <label 
                                        key={idx}
                                        onClick={() => handleSelectOption(option)}
                                        className={"flex items-start p-4 rounded-md border cursor-pointer transition-all " + (
                                            isSelected 
                                                ? "border-blue-500 dark:border-blue-400 bg-blue-50/30 dark:bg-blue-900/10" 
                                                : "border-gray-200 dark:border-gh-border hover:border-blue-300 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gh-bg-secondary"
                                        )}
                                    >
                                        <div className="flex h-5 items-center mr-3 mt-0.5">
                                            <div className={"w-4 h-4 rounded-full border flex items-center justify-center " + (
                                                isSelected ? "border-blue-600 dark:border-blue-400" : "border-gray-400 dark:border-gray-600"
                                            )}>
                                                {isSelected && <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />}
                                            </div>
                                        </div>
                                        <span className="text-[14px] text-gray-700 dark:text-gh-text-secondary leading-snug">{option}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Summary Modal Drawer */}
                {showSummaryModal && (
                    <div className="absolute inset-0 z-50 flex justify-end">
                        <div 
                            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[1px] transition-opacity"
                            onClick={() => setShowSummaryModal(false)}
                        />
                        <div className="relative w-[450px] bg-white dark:bg-[#1a1a1c] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ease-out border-l border-gray-200 dark:border-gh-border">
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gh-border">
                                <h3 className="text-[17px] font-bold text-gray-800 dark:text-gh-text">Question Summary</h3>
                                <button 
                                    onClick={() => setShowSummaryModal(false)}
                                    className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                >
                                    <span className="material-symbols-outlined !text-[20px]">close</span>
                                </button>
                            </div>

                            {/* Drawer Content */}
                            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                                {/* Warning Box */}
                                {timeLeft > 0 && (
                                    <div className="bg-[#fff4ed] dark:bg-[#2e1d16] border border-[#ffd2b3] dark:border-[#7a3922] rounded-lg p-4 flex items-center justify-between shadow-sm">
                                        <div className="flex gap-3">
                                            <span className="material-symbols-outlined text-[#df3308] dark:text-[#f87171] mt-0.5 !text-[20px]">info</span>
                                            <div>
                                                <h4 className="text-[#df3308] dark:text-[#f87171] font-semibold text-[14px]">There is time left.</h4>
                                                <p className="text-[#df3308]/80 dark:text-[#f87171]/80 text-[12px] mt-0.5">Are you sure you want to finish the assessment?</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[#df3308] dark:text-[#f87171] font-bold text-[13px] whitespace-nowrap border border-[#ffd2b3] dark:border-[#7a3922] px-3 py-1.5 rounded-md bg-white dark:bg-[#1f1614]">
                                            <span className="material-symbols-outlined !text-[16px]">timer</span>
                                            -1h -{Math.floor(timeLeft / 60)}m -{timeLeft % 60}s
                                        </div>
                                    </div>
                                )}

                                {/* Circular Stats & Legend */}
                                <div className="border border-gray-100 dark:border-gh-border rounded-xl p-6 shadow-sm flex items-center gap-8 bg-white dark:bg-gh-bg">
                                    <div className="w-28 h-28 rounded-full border-[6px] border-[#f4f5f5] dark:border-gray-800 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold text-gray-800 dark:text-white">{MOCK_QUESTIONS.length}</span>
                                        <span className="text-[11px] text-gray-500 dark:text-gh-text-secondary font-medium mt-0.5">Total Questions</span>
                                    </div>
                                    <div className="flex-1 flex flex-col gap-3">
                                        <div className="flex items-center justify-between bg-[#eaf1fc] dark:bg-blue-900/20 px-4 py-3 rounded-lg">
                                            <div className="flex items-center gap-3 text-[13px] font-medium text-gray-600 dark:text-gray-300">
                                                <div className="w-3 h-3 rounded-[3px] bg-[#1a73e8] dark:bg-blue-400" />
                                                Questions Attempted:
                                            </div>
                                            <span className="font-bold text-gray-800 dark:text-white text-[14px]">{attemptedCount}</span>
                                        </div>
                                        <div className="flex items-center justify-between bg-[#f6f7f9] dark:bg-gray-800/50 px-4 py-3 rounded-lg">
                                            <div className="flex items-center gap-3 text-[13px] font-medium text-gray-600 dark:text-gray-300">
                                                <div className="w-3 h-3 rounded-[3px] border border-gray-300 dark:border-gray-500 bg-transparent border-dashed" />
                                                Questions Skipped:
                                            </div>
                                            <span className="font-bold text-gray-800 dark:text-white text-[14px]">{MOCK_QUESTIONS.length - attemptedCount}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Grid display inside Drawer */}
                                <div>
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <h4 className="font-bold text-gray-800 dark:text-gh-text text-[14px]">Questions Summary</h4>
                                        <div className="flex gap-4 text-[11px] font-medium text-gray-600 dark:text-gray-400">
                                            <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#0d9488] rounded-[3px]" /> Que attempt</span>
                                            <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-[3px]" /> Not attempt</span>
                                        </div>
                                    </div>
                                    
                                    <div className="border border-gray-100 dark:border-gh-border rounded-xl p-5 shadow-sm bg-white dark:bg-gh-bg">
                                        <div className="flex flex-wrap gap-2.5">
                                            {MOCK_QUESTIONS.map((q, idx) => {
                                                const isAttempted = !!selectedAnswers[q.id];
                                                return (
                                                    <button
                                                        key={q.id}
                                                        onClick={() => {
                                                            setCurrentQuestionIdx(idx);
                                                            setShowSummaryModal(false);
                                                        }}
                                                        className={`w-[36px] h-[36px] rounded-[6px] text-[13px] font-medium flex items-center justify-center transition-all ${
                                                            isAttempted 
                                                                ? "bg-[#0d9488] text-white" 
                                                                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                        }`}
                                                    >
                                                        {idx + 1}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Drawer Footer */}
                            <div className="px-6 py-4 flex justify-between items-center bg-white dark:bg-[#1a1a1c] mt-auto border-t border-gray-200 dark:border-gh-border">
                                <button 
                                    onClick={() => setShowSummaryModal(false)}
                                    className="text-[14px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    Close
                                </button>
                                <button 
                                    onClick={() => navigate(`/marketplace/hackathons/${id}/results`)}
                                    className="px-8 py-2.5 bg-[#d83f06] hover:bg-[#b03004] text-white text-[14px] font-semibold rounded-[6px] flex items-center justify-center transition-colors shadow-none"
                                >
                                    Finish
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Footer */}
            <footer className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gh-border bg-white dark:bg-gh-bg z-10 shrink-0">
                <button 
                    onClick={() => setShowSummaryModal(true)}
                    className="px-6 py-2 bg-[#df3308] hover:bg-[#c92a05] text-white text-sm font-semibold rounded transition-colors"
                >
                    Finish
                </button>
                
                <div className="flex gap-4">
                    <button 
                        onClick={handleNextQuestion}
                        className="px-8 py-2 bg-white dark:bg-gh-bg border border-gray-300 dark:border-gh-border text-gray-700 dark:text-gh-text hover:bg-gray-50 dark:hover:bg-gh-bg-secondary text-sm font-semibold rounded transition-colors"
                    >
                        Skip
                    </button>
                    <button 
                        onClick={handleNextQuestion}
                        disabled={!selectedAnswers[question.id]}
                        className="px-6 py-2 bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-50 text-sm font-semibold rounded transition-colors"
                    >
                        {currentQuestionIdx === MOCK_QUESTIONS.length - 1 ? "Submit" : "Submit & Next"}
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default TestAssessmentView;
