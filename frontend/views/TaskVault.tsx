import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
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
    MoreHorizontal,
    Filter,
    Table,
    Kanban,
    Calendar,
    Users,
    MessageSquare,
    CheckSquare,
    UserPlus,
    Smartphone,
    Monitor,
    LayoutDashboard,
    ChevronDown,
    Target
} from 'lucide-react';
import { CreateProjectModal } from '../components/modals/CreateProjectModal';
import { InviteModal } from '../components/modals/InviteModal';

const TaskVault: React.FC = () => {
    const { tasks, goals, addTask, addGoal } = useAppData();
    const [isCreateGoalModalOpen, setIsCreateGoalModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'kanban' | 'timeline' | 'list'>('list');
    const [isProfileComplete, setIsProfileComplete] = useState(false);
    const [viewMode, setViewMode] = useState<'tasks' | 'goals'>('tasks');
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
    
    const handleCreateGoal = (newGoal: any) => {
        addGoal(newGoal);
        setIsCreateGoalModalOpen(false);
    };

    const handleCreateTask = (newTask: any) => {
        addTask({...newTask, status: 'To-do', people: ['https://i.pravatar.cc/150?u=gs'], priority: 'Medium', type: 'Dashboard', estimation: '3 days'});
        setIsCreateTaskModalOpen(false);
    };

    const hasItems = goals.length > 0 || tasks.length > 0;

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
            <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-8">
                {/* ── View Switcher ── */}
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <button 
                            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                            className="flex items-center bg-gh-bg-secondary border border-gh-border rounded-lg p-1.5 px-3 hover:bg-gh-bg-tertiary transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <LayoutDashboard className="size-4 text-gh-text-secondary group-hover:text-gh-text" />
                                <div className="w-[1px] h-4 bg-gh-border" />
                                <span className="text-sm font-bold text-gh-text mr-2">
                                    {viewMode === 'tasks' ? 'All Tasks' : 'All Goals'}
                                </span>
                                <ChevronDown className={`size-3.5 text-gh-text-secondary transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </button>

                        {isSwitcherOpen && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-gh-bg-secondary border border-gh-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
                                <button 
                                    onClick={() => { setViewMode('tasks'); setIsSwitcherOpen(false); }}
                                    className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-bold hover:bg-gh-bg-tertiary transition-all ${viewMode === 'tasks' ? 'text-primary' : 'text-gh-text'}`}
                                >
                                    <CheckSquare className="size-3.5" />
                                    All Tasks
                                </button>
                                <button 
                                    onClick={() => { setViewMode('goals'); setIsSwitcherOpen(false); }}
                                    className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-bold hover:bg-gh-bg-tertiary transition-all ${viewMode === 'goals' ? 'text-primary' : 'text-gh-text'}`}
                                >
                                    <Target className="size-3.5" />
                                    All Goals
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                
                
                {/* ── Welcome Banner ── */}
                {!isProfileComplete && (
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
                                    onClick={() => setIsProfileComplete(true)}
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
                )}

                {/* ── Content Area ── */}
                {!hasItems ? (
                    <>
                        {/* ── Action Cards ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Create Project Card */}
                            <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl p-6 hover:shadow-lg transition-all group cursor-pointer opacity-80">
                                <div className="flex items-start gap-4">
                                    <div className="shrink-0 flex items-end gap-1">
                                        <div className="w-8 h-10 bg-gh-bg-tertiary rounded-md border border-gh-border" />
                                        <div className="w-8 h-12 bg-gh-bg border border-gh-border" />
                                        <div className="w-8 h-8 bg-gh-bg-secondary rounded-md border border-gh-border" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-base font-bold text-gh-text mb-1">Create Your First Goal</h3>
                                        <p className="text-xs text-gh-text-secondary mb-4 leading-relaxed">
                                            Start by organizing your tasks into a goal — big or small!
                                        </p>
                                        <button
                                            onClick={() => setIsCreateGoalModalOpen(true)}
                                            className="px-4 py-2 rounded-xl text-xs font-bold text-gh-text bg-gh-bg border border-gh-border hover:bg-gh-bg-secondary transition-all flex items-center gap-1.5 shadow-sm"
                                        >
                                            Create Goal
                                            <ChevronRight className="size-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Add Tasks Card */}
                            <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl p-6 hover:shadow-lg transition-all group cursor-pointer opacity-80">
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
                                            Break your goal down into actionable steps by steps work
                                        </p>
                                        <button
                                            onClick={() => setIsCreateTaskModalOpen(true)}
                                            className="px-4 py-2 rounded-xl text-xs font-bold text-gh-text bg-gh-bg border border-gh-border hover:bg-gh-bg-secondary transition-all flex items-center gap-1.5 shadow-sm"
                                        >
                                            Add Tasks
                                            <ChevronRight className="size-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col gap-6 bg-gh-bg rounded-2xl border border-gh-border p-6 min-h-[600px]">
                        {/* Craftboard Header */}
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-6">
                                <h2 className="text-2xl font-bold text-gh-text flex items-center gap-3">
                                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">C</div>
                                    Craftboard
                                </h2>
                                
                                <div className="flex items-center bg-gh-bg-secondary rounded-lg p-1 border border-gh-border">
                                    {[
                                        { id: 'kanban', icon: Kanban, label: 'Kanban' },
                                        { id: 'timeline', icon: Calendar, label: 'Timeline' },
                                        { id: 'list', icon: Table, label: 'List' }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-gh-bg text-gh-text shadow-sm' : 'text-gh-text-secondary hover:text-gh-text'}`}
                                        >
                                            <tab.icon className="size-3.5" />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-1.5 mr-2">
                                    <div className="size-7 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white border-2 border-gh-bg">AL</div>
                                    <img src="https://i.pravatar.cc/150?u=bt" className="size-7 rounded-full border-2 border-gh-bg" alt="avatar" />
                                    <img src="https://i.pravatar.cc/150?u=gs" className="size-7 rounded-full border-2 border-gh-bg" alt="avatar" />
                                </div>
                                 <button 
                                    onClick={() => setIsInviteModalOpen(true)}
                                    className="p-2 px-3 rounded-xl bg-gh-bg-secondary border border-gh-border text-gh-text-secondary hover:text-gh-text flex items-center gap-2 text-xs font-bold"
                                >
                                    <UserPlus className="size-3.5" />
                                    Invite
                                </button>
                                <div className="relative group ml-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gh-text-secondary group-focus-within:text-primary transition-colors" />
                                    <input 
                                        type="text" 
                                        placeholder="Search..." 
                                        className="bg-gh-bg-secondary border border-gh-border rounded-xl pl-9 pr-4 py-2 text-xs text-gh-text focus:outline-none focus:border-primary/50 w-44 transition-all"
                                    />
                                </div>
                                <button className="p-2 rounded-xl bg-gh-bg-secondary border border-gh-border text-gh-text-secondary hover:text-gh-text">
                                    <Filter className="size-4" />
                                </button>
                                <button 
                                    onClick={() => viewMode === 'tasks' ? setIsCreateTaskModalOpen(true) : setIsCreateGoalModalOpen(true)}
                                    className="bg-gh-text text-gh-bg px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 hover:opacity-90 transition-all ml-1"
                                >
                                    <Plus className="size-4" />
                                    {viewMode === 'tasks' ? 'New Task' : 'New Goal'}
                                </button>
                            </div>
                        </div>

                        {/* Status Groups */}
                        <div className="space-y-8 mt-4">
                            {['To-do', 'On Progress', 'In Review'].map(status => {
                                const currentItems = viewMode === 'tasks' ? tasks : goals.map(g => ({
                                    ...g,
                                    estimation: "Set deadline",
                                    type: "Goal",
                                    people: ["https://i.pravatar.cc/150?u=gs"],
                                    priority: "High",
                                    status: "On Progress"
                                }));
                                
                                const filteredItems = currentItems.filter(t => t.status === status);
                                return (
                                    <div key={status} className="space-y-4">
                                        <div className="flex items-center justify-between text-gh-text-secondary">
                                            <div className="flex items-center gap-2">
                                                <ChevronRight className={`size-4 transition-transform ${filteredItems.length > 0 ? 'rotate-90' : ''}`} />
                                                <h3 className="text-sm font-bold text-gh-text">{status}</h3>
                                                <span className="text-[10px] bg-gh-bg-secondary px-1.5 py-0.5 rounded-md border border-gh-border">{filteredItems.length || 0}</span>
                                            </div>
                                            <button onClick={() => viewMode === 'tasks' ? setIsCreateTaskModalOpen(true) : setIsCreateGoalModalOpen(true)} className="p-1 hover:bg-gh-bg-secondary rounded-md transition-all">
                                                <Plus className="size-4" />
                                            </button>
                                        </div>
                                        
                                        <div className="overflow-hidden">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="text-[11px] font-bold text-gh-text-secondary border-b border-gh-border uppercase tracking-wider">
                                                        <th className="py-3 px-4 w-10"><CheckSquare className="size-3.5" /></th>
                                                        <th className="py-3 px-4 min-w-[200px]">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-gh-text-secondary/40">@</span>
                                                                {viewMode === 'tasks' ? 'Task Name' : 'Goal Name'}
                                                            </div>
                                                        </th>
                                                        <th className="py-3 px-4 min-w-[250px]">Description</th>
                                                        <th className="py-3 px-4 min-w-[180px]">
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar className="size-3" />
                                                                {viewMode === 'tasks' ? 'Estimation' : 'Timeline'}
                                                            </div>
                                                        </th>
                                                        <th className="py-3 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <LayoutDashboard className="size-3" />
                                                                Type
                                                            </div>
                                                        </th>
                                                        <th className="py-3 px-4">
                                                            <div className="flex items-center gap-1.5">
                                                                <Users className="size-3" />
                                                                People
                                                            </div>
                                                        </th>
                                                        <th className="py-3 px-4">
                                                            <div className="flex items-center gap-1.5">
                                                                <Rocket className="size-3" />
                                                                Priority
                                                            </div>
                                                        </th>
                                                        <th className="py-3 px-4 w-10"><Plus className="size-3.5" /></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredItems.length > 0 ? filteredItems.map(task => (
                                                        <tr key={task.id} className="border-b border-gh-border/50 hover:bg-gh-bg-secondary/40 transition-colors group">
                                                            <td className="py-4 px-4"><div className="size-4 rounded border border-gh-border group-hover:border-primary transition-colors cursor-pointer" /></td>
                                                            <td className="py-4 px-4 text-xs font-bold text-gh-text">{task.name}</td>
                                                            <td className="py-4 px-4 text-xs text-gh-text-secondary">{task.description}</td>
                                                            <td className="py-4 px-4 text-xs text-gh-text-secondary">{task.estimation}</td>
                                                            <td className="py-4 px-4">
                                                                <div className="flex items-center gap-2 text-[10px] font-bold px-2 py-1 rounded-md border bg-gh-bg-secondary/50 border-gh-border w-fit text-gh-text-secondary">
                                                                    {viewMode === 'goals' ? <Target className="size-3 text-primary" /> : task.type === 'Dashboard' ? <Monitor className="size-3 text-purple-400" /> : <Smartphone className="size-3 text-orange-400" />}
                                                                    {task.type}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <div className="flex -space-x-1.5">
                                                                    {task.people.map((p: string, i: number) => (
                                                                        <img key={i} src={p} className="size-6 rounded-full border-2 border-gh-bg bg-gh-bg-tertiary shadow-sm" alt="avatar" />
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border w-fit ${
                                                                    task.priority === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                                    task.priority === 'Medium' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                                                    'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                                }`}>
                                                                    <div className={`size-1.5 rounded-full ${
                                                                        task.priority === 'High' ? 'bg-red-500' :
                                                                        task.priority === 'Medium' ? 'bg-orange-500' :
                                                                        'bg-blue-500'
                                                                    }`} />
                                                                    {task.priority}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <MoreHorizontal className="size-4 text-gh-text-secondary opacity-0 group-hover:opacity-100 cursor-pointer transition-all" />
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan={8} className="py-10 text-center text-xs text-gh-text-secondary italic">
                                                                No {viewMode} in this status yet. Click "+ New {viewMode === 'tasks' ? 'Task' : 'Goal'}" to get started!
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <CreateProjectModal 
                    isOpen={isCreateGoalModalOpen} 
                    onClose={() => setIsCreateGoalModalOpen(false)} 
                    onDeploy={handleCreateGoal}
                    mode="goal"
                />

                <CreateProjectModal 
                    isOpen={isCreateTaskModalOpen} 
                    onClose={() => setIsCreateTaskModalOpen(false)} 
                    onDeploy={handleCreateTask}
                    mode="task"
                />
            </div>
            <InviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
        </div>
    );
};

export default TaskVault;
