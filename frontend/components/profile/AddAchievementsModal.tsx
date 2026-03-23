import React from 'react';
import { useAppData } from '../../context/AppDataContext';

interface AddAchievementsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddAchievementsModal: React.FC<AddAchievementsModalProps> = ({ isOpen, onClose }) => {
    const { projects } = useAppData();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#000000] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[#333] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-[#333] bg-white dark:bg-[#000000]">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-gray-400 dark:text-[#888] !text-2xl">history</span>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Achievements</h2>
                    </div>
                    <button className="text-gray-400 dark:text-[#888] hover:text-gray-600 dark:hover:text-white transition-colors">
                        <span className="material-symbols-outlined !text-2xl">lightbulb</span>
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-8 space-y-8 overflow-y-auto max-h-[75vh] custom-scrollbar text-gray-900 dark:text-white">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2.5">
                            Title<span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Title"
                            className="w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] focus:outline-none focus:border-blue-500 transition-all font-medium"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2.5">Description</label>
                        <textarea
                            rows={4}
                            placeholder="Describe your achievement here, emphasizing the skills you developed, the challenges you overcame, and the impact or significance of this accomplishment in your professional journey."
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
                            <label className="text-sm font-bold text-gray-700 dark:text-white">Link this Achievement</label>
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
                                <option value="" disabled hidden>Link this Achievement</option>
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
                            placeholder="Add skills !"
                            className="w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] focus:outline-none focus:border-blue-500 transition-all font-medium"
                        />
                    </div>

                    {/* Attachments */}
                    <div className="space-y-4">
                        <input
                            type="file"
                            id="ach-attachments"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                console.warn("Files selected:", files);
                            }}
                        />
                        <div 
                            onClick={() => document.getElementById('ach-attachments')?.click()}
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

export default AddAchievementsModal;
