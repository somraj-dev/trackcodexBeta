import React, { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';

interface AddProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose }) => {
    const [isOngoing, setIsOngoing] = useState(false);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const { projects } = useAppData();

    const projectTypes = ["Full Time", "Part Time", "Freelance"];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#000000] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[#333] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-[#333] bg-white dark:bg-[#000000]">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-gray-400 dark:text-[#888] !text-2xl">history</span>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Projects</h2>
                    </div>
                    <button className="text-gray-400 dark:text-[#888] hover:text-gray-600 dark:hover:text-white transition-colors">
                        <span className="material-symbols-outlined !text-2xl">lightbulb</span>
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-8 space-y-8 overflow-y-auto max-h-[75vh] custom-scrollbar text-gray-900 dark:text-white">
                    {/* Project Name */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2.5">
                            Project name<span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Project name"
                            className="w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] focus:outline-none focus:border-blue-500 transition-all font-medium"
                        />
                    </div>

                    {/* Project Type */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2.5">
                            Project Type<span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {projectTypes.map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedType(type)}
                                    className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-all ${
                                        selectedType === type
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                            : 'border-gray-300 dark:border-[#555] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-[#111] border-dashed'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Project Duration */}
                    <div>
                        <div className="flex items-center justify-between mb-2.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-white">
                                Project Duration
                            </label>
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isOngoing}
                                    onChange={(e) => setIsOngoing(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 dark:border-[#333] bg-white dark:bg-[#000] text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                                />
                                <span className="text-sm font-bold text-blue-600 dark:text-blue-500">Ongoing</span>
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative group cursor-pointer" onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement).showPicker()}>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all pr-10 cursor-pointer font-medium"
                                />
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#555] !text-xl pointer-events-none group-hover:text-blue-500 dark:group-hover:text-white transition-colors">calendar_today</span>
                            </div>
                            <div className={`relative group ${isOngoing ? 'opacity-30 grayscale' : 'cursor-pointer'}`} onClick={(e) => !isOngoing && (e.currentTarget.querySelector('input') as HTMLInputElement).showPicker()}>
                                <input
                                    type="date"
                                    disabled={isOngoing}
                                    className="w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all pr-10 cursor-pointer disabled:cursor-not-allowed font-medium"
                                />
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#555] !text-xl pointer-events-none group-hover:text-blue-500 dark:group-hover:text-white transition-colors">calendar_today</span>
                            </div>
                        </div>
                    </div>

                    {/* Project Description */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2.5">Project Description</label>
                        <textarea
                            rows={4}
                            placeholder="Detail the project you worked on, the role you played, the skills you honed or acquired, and the key learnings or outcomes from your involvement in the project."
                            className="w-full px-4 py-4 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all resize-none text-sm leading-relaxed font-medium"
                        />
                    </div>

                    {/* AI Button */}
                    <button className="flex items-center gap-3 px-5 py-2.5 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-full hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all group shadow-sm">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center p-1">
                            <span className="material-symbols-outlined text-white !text-[14px]">auto_fix_high</span>
                        </div>
                        <span className="text-sm font-bold text-gray-700 dark:text-white">Generate with AI</span>
                    </button>

                    {/* Link */}
                    <div>
                        <div className="flex items-center gap-1.5 mb-2.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-white">Link this Project</label>
                            <div className="relative group flex items-center">
                                <span className="material-symbols-outlined text-gray-400 dark:text-[#555] !text-base cursor-help">info</span>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[250px] bg-blue-600 text-white text-[13px] font-semibold px-3 py-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-lg leading-snug text-center">
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-600 rotate-45" />
                                    It will show only those you are building through Our Dashboard
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <select 
                                className="appearance-none w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium pr-10 cursor-pointer"
                                defaultValue=""
                            >
                                <option value="" disabled hidden>Link this Project</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#555] pointer-events-none">expand_more</span>
                        </div>
                    </div>

                    {/* Skills */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2.5">Skills</label>
                        <input
                            type="text"
                            placeholder="Add skills"
                            className="w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] focus:outline-none focus:border-blue-500 transition-all font-medium"
                        />
                    </div>

                    {/* Attachments */}
                    <div className="space-y-4">
                        <input
                            type="file"
                            id="proj-attachments"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                console.warn("Files selected:", files);
                            }}
                        />
                        <div 
                            onClick={() => document.getElementById('proj-attachments')?.click()}
                            className="border border-dashed border-gray-300 dark:border-[#333] rounded-xl p-4 text-center cursor-pointer hover:border-gray-400 dark:hover:border-[#444] transition-all group"
                        >
                            <div className="flex items-center justify-center gap-2.5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white">
                                <span className="material-symbols-outlined !text-xl">add</span>
                                <span className="text-sm font-bold">Attachments</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="px-8 py-5 border-t border-gray-100 dark:border-[#333] flex items-center justify-between bg-white dark:bg-[#000000]">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 dark:border-[#555] rounded-full text-sm font-bold text-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-[#111] transition-all shadow-sm"
                    >
                        <span className="material-symbols-outlined !text-xl">close</span>
                        Discard
                    </button>
                    <button
                        className="flex items-center gap-2 px-8 py-2.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-full text-sm font-bold text-gray-300 dark:text-[#333] cursor-not-allowed transition-all shadow-sm"
                        disabled
                    >
                        <span className="material-symbols-outlined !text-xl">check</span>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddProjectModal;
