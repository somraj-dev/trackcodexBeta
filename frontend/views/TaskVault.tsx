import React, { useState } from 'react';
import { 
    Plus, 
    Search, 
    Layout, 
    CheckCircle2, 
    Clock, 
    BookOpen, 
    ChevronRight,
    Rocket,
    CheckCircle,
    Circle,
    MoreHorizontal
} from 'lucide-react';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import CreateTaskModal from '../components/modals/CreateTaskModal';

const TaskVault: React.FC = () => {
    const [showCreateProject, setShowCreateProject] = useState(false);
    const [showCreateTask, setShowCreateTask] = useState(false);

    const profileChecklist = [
        { label: "Upload Your Profile Picture", desc: "Add a friendly photo so your teammates recognize you.", done: true },
        { label: "Set Your Job Title or Role", desc: "Helps your team understand what you do", done: false },
    ];

    const learnArticles = [
        { title: "Mastering the Task Vault", time: "5 min read", icon: "menu_book" },
        { title: "Working with Teams", time: "3 min read", icon: "groups" },
        { title: "Keyboard Shortcuts", time: "2 min read", icon: "keyboard" }
    ];

    return (
        <div className="flex-1 overflow-y-auto bg-gh-bg custom-scrollbar h-full">
            <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
                
                {/* ── Welcome Banner ── */}
                <div className="relative overflow-hidden rounded-3xl bg-gh-bg-secondary border border-gh-border p-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
                        {/* Left — Visual Progress */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative size-32">
                                <svg className="size-full -rotate-90">
                                    <circle
                                        cx="64" cy="64" r="42"
                                        fill="transparent"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        className="text-gh-border"
                                    />
                                    <circle
                                        cx="64" cy="64" r="42"
                                        fill="transparent"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        className="text-primary"
                                        strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 42 * 0.4} ${2 * Math.PI * 42 * 0.6}`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="size-16 rounded-full bg-gh-bg border border-gh-border flex items-center justify-center">
                                        <span className="material-symbols-outlined !text-[28px] text-gh-text-secondary">person</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-black text-gh-text">40%</p>
                                <p className="text-sm font-semibold text-gh-text-secondary mt-0.5">Let's Set Up Your Profile</p>
                                <p className="text-xs text-gh-text-secondary/60">Help your team recognize you!</p>
                            </div>
                            <button
                                className="mt-1 px-5 py-2 rounded-xl text-xs font-bold text-gh-text bg-gh-bg border border-gh-border hover:bg-gh-bg-secondary transition-all flex items-center gap-1.5 shadow-sm"
                            >
                                Complete Profile
                                <span className="material-symbols-outlined !text-[14px]">chevron_right</span>
                            </button>
                        </div>

                        {/* Right — Checklist */}
                        <div className="flex-1 space-y-4">
                            {profileChecklist.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-3 group">
                                    <div className={`mt-0.5 size-6 rounded-full flex items-center justify-center shrink-0 transition-all ${item.done
                                        ? "bg-primary text-gh-bg"
                                        : "border-2 border-gh-border text-transparent group-hover:border-gh-text-secondary"
                                        }`}>
                                        {item.done && <CheckCircle2 className="size-4" />}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-semibold ${item.done ? "text-gh-text" : "text-gh-text-secondary"}`}>
                                            {item.label}
                                        </p>
                                        <p className="text-xs text-gh-text-secondary/60">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Action Cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Create Project Card */}
                    <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl p-6 hover:shadow-lg transition-all group cursor-pointer"
                        onClick={() => setShowCreateProject(true)}>
                        <div className="flex items-start gap-4">
                            <div className="shrink-0 flex items-end gap-1">
                                <div className="w-8 h-10 bg-gh-bg-tertiary rounded-md border border-gh-border" />
                                <div className="w-8 h-12 bg-gh-bg border border-gh-border" />
                                <div className="w-8 h-8 bg-gh-bg-secondary rounded-md border border-gh-border" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-gh-text mb-1">Create Your First Project</h3>
                                <p className="text-xs text-gh-text-secondary mb-4 leading-relaxed">
                                    Start by organizing your tasks into a project — big or small!
                                </p>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowCreateProject(true); }}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-gh-text bg-gh-bg border border-gh-border hover:bg-gh-bg-secondary transition-all flex items-center gap-1.5 group-hover:border-primary/50"
                                >
                                    Create Project
                                    <ChevronRight className="size-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Add Tasks Card */}
                    <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl p-6 hover:shadow-lg transition-all group cursor-pointer"
                        onClick={() => setShowCreateTask(true)}>
                        <div className="flex items-start gap-4">
                            <div className="shrink-0 flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="size-4 rounded bg-primary/20 border border-primary/30" />
                                    <div className="h-2 w-16 bg-gh-bg-tertiary rounded-full" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="size-4 rounded bg-gh-bg-tertiary border border-gh-border" />
                                    <div className="h-2 w-12 bg-gh-bg rounded-full" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="size-4 rounded bg-gh-bg-tertiary border border-gh-border" />
                                    <div className="h-2 w-20 bg-gh-bg rounded-full" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-gh-text mb-1">Add Your First Tasks</h3>
                                <p className="text-xs text-gh-text-secondary mb-4 leading-relaxed">
                                    Break your project down into actionable steps by steps work
                                </p>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowCreateTask(true); }}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-gh-text bg-gh-bg border border-gh-border hover:bg-gh-bg-secondary transition-all flex items-center gap-1.5 group-hover:border-primary/50"
                                >
                                    Add Tasks
                                    <ChevronRight className="size-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Learn Section ── */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="size-5 text-gh-text-secondary" />
                        <h2 className="text-base font-bold text-gh-text">Learn</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {learnArticles.map((article, idx) => (
                            <div
                                key={idx}
                                className="bg-gh-bg-secondary border border-gh-border rounded-2xl overflow-hidden hover:shadow-md transition-all group cursor-pointer"
                            >
                                {/* Illustration Area */}
                                <div className="h-32 bg-gh-bg-tertiary flex items-center justify-center border-b border-gh-border relative overflow-hidden">
                                    {/* Decorative grid */}
                                    <div className="absolute inset-0 opacity-10 bg-[length:20px_20px] bg-[linear-gradient(var(--gh-border)_1px,transparent_1px),linear-gradient(90deg,var(--gh-border)_1px,transparent_1px)]" />
                                    <span className="material-symbols-outlined !text-[48px] text-gh-text-secondary/20 group-hover:text-primary/30 transition-colors relative z-10">
                                        {article.icon}
                                    </span>
                                </div>
                                <div className="p-4">
                                    <h3 className="text-sm font-bold text-gh-text mb-2 group-hover:text-primary transition-colors">
                                        {article.title}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-xs text-gh-text-secondary/60">
                                        <Clock className="size-3.5" />
                                        {article.time}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* ── Modals ── */}
            <CreateProjectModal isOpen={showCreateProject} onClose={() => setShowCreateProject(false)} />
            <CreateTaskModal isOpen={showCreateTask} onClose={() => setShowCreateTask(false)} />
        </div>
    );
};

export default TaskVault;
