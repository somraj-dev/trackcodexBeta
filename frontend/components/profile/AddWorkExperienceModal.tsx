import React, { useState } from "react";

interface AddWorkExperienceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddWorkExperienceModal: React.FC<AddWorkExperienceModalProps> = ({ isOpen, onClose }) => {
    const [isCurrentlyWorking, setIsCurrentlyWorking] = useState(false);
    const [isWorkFromHome, setIsWorkFromHome] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#000000] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[#333] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-[#333] bg-white dark:bg-[#000000]">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-gray-400 dark:text-[#888] !text-2xl">history</span>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Work Experience</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-gray-400 dark:text-[#888] hover:text-gray-600 dark:hover:text-white transition-colors">
                            <span className="material-symbols-outlined !text-2xl">visibility</span>
                        </button>
                        <button className="text-gray-400 dark:text-[#888] hover:text-gray-600 dark:hover:text-white transition-colors">
                            <span className="material-symbols-outlined !text-2xl">lightbulb</span>
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-8 space-y-8 overflow-y-auto max-h-[75vh] custom-scrollbar text-gray-900 dark:text-white">
                    {/* Breadcrumb & Promo */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-[#888] font-bold">
                            <span>Work Experience</span>
                            <span className="material-symbols-outlined !text-lg text-gray-300 dark:text-[#333]">chevron_right</span>
                            <span className="text-gray-600 dark:text-white">New Experience</span>
                        </div>
                        <label className="flex items-center gap-2.5 cursor-pointer w-fit">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 dark:border-[#333] bg-white dark:bg-[#000] text-blue-500 focus:ring-blue-500 focus:ring-offset-0" />
                            <span className="text-xs text-gray-500 dark:text-[#666] font-bold">Got this job from Unstop</span>
                        </label>
                    </div>

                    {/* Designation */}
                    <div>
                        <label className="block text-sm font-bold mb-2.5 text-gray-700 dark:text-white">
                            Designation<span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <div className="relative">
                            <select className="w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white appearance-none focus:outline-none focus:border-blue-500 transition-all font-medium">
                                <option value="" disabled selected>Select Designation</option>
                                <option value="software-engineer">Software Engineer</option>
                                <option value="frontend-developer">Frontend Developer</option>
                                <option value="backend-developer">Backend Developer</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#555] pointer-events-none !text-xl">expand_more</span>
                        </div>
                    </div>

                    {/* Organisation */}
                    <div>
                        <label className="block text-sm font-bold mb-2.5 text-gray-700 dark:text-white">
                            Organisation<span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Select Organisation"
                            className="w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] focus:outline-none focus:border-blue-500 transition-all font-medium"
                        />
                    </div>

                    {/* Employment Type */}
                    <div>
                        <label className="block text-sm font-bold mb-2.5 text-gray-700 dark:text-white">
                            Employment Type<span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <div className="relative">
                            <select className="w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white appearance-none focus:outline-none focus:border-blue-500 transition-all font-medium">
                                <option value="" disabled selected>Select Employment Type</option>
                                <option value="full-time">Full-time</option>
                                <option value="internship">Internship</option>
                                <option value="freelance">Freelance</option>
                                <option value="contract">Contract</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#555] pointer-events-none !text-xl">expand_more</span>
                        </div>
                    </div>

                    {/* Duration */}
                    <div>
                        <div className="flex items-center justify-between mb-2.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-white">
                                Duration<span className="text-red-500 ml-0.5">*</span>
                            </label>
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isCurrentlyWorking}
                                    onChange={(e) => setIsCurrentlyWorking(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 dark:border-[#333] bg-white dark:bg-[#000] text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                                />
                                <span className="text-xs text-gray-500 dark:text-[#666] font-bold">Currently working in this role</span>
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
                            <div className={`relative group ${isCurrentlyWorking ? 'opacity-30 grayscale' : 'cursor-pointer'}`} onClick={(e) => !isCurrentlyWorking && (e.currentTarget.querySelector('input') as HTMLInputElement).showPicker()}>
                                <input
                                    type="date"
                                    disabled={isCurrentlyWorking}
                                    className="w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all pr-10 cursor-pointer disabled:cursor-not-allowed font-medium"
                                />
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#555] !text-xl pointer-events-none group-hover:text-blue-500 dark:group-hover:text-white transition-colors">calendar_today</span>
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-3">
                        <div className="relative group border-2 border-blue-500 rounded-xl bg-white dark:bg-[#000000] flex items-center pr-4">
                            <input
                                type="text"
                                placeholder="Select Location"
                                className="flex-1 px-4 py-3 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] focus:outline-none font-medium"
                            />
                            <label className="flex items-center gap-2.5 cursor-pointer border-l border-gray-200 dark:border-[#333] pl-4">
                                <input
                                    type="checkbox"
                                    checked={isWorkFromHome}
                                    onChange={(e) => setIsWorkFromHome(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 dark:border-[#333] bg-white dark:bg-[#000] text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                                />
                                <span className="text-xs text-gray-500 dark:text-[#666] font-bold whitespace-nowrap">Work from Home</span>
                            </label>
                        </div>
                        <p className="text-[11px] text-red-500 font-bold pl-1">Location is required</p>
                    </div>

                    {/* Skills */}
                    <div>
                        <label className="block text-sm font-bold mb-2.5 text-gray-700 dark:text-white">Skills</label>
                        <input
                            type="text"
                            placeholder="Add skills"
                            className="w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] focus:outline-none focus:border-blue-500 transition-all font-medium"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold mb-2.5 text-gray-700 dark:text-white">Description</label>
                        <textarea
                            rows={4}
                            placeholder="Describe your role here..."
                            className="w-full px-4 py-4 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] focus:outline-none focus:border-blue-500 transition-all resize-none text-base leading-relaxed font-medium"
                        />
                    </div>

                    {/* AI Button */}
                    <button className="flex items-center gap-3 px-5 py-2.5 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-full hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all group shadow-sm dark:shadow-lg">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center p-1">
                            <span className="material-symbols-outlined text-white !text-[14px]">auto_fix_high</span>
                        </div>
                        <span className="text-sm font-bold text-gray-700 dark:text-white">Generate with AI</span>
                    </button>

                    {/* Attachments */}
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700 dark:text-white">Attachments</label>
                        <input
                            type="file"
                            id="work-attachments"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                console.warn("Files selected:", files);
                            }}
                        />
                        <div 
                            onClick={() => document.getElementById('work-attachments')?.click()}
                            className="border-2 border-dashed border-gray-200 dark:border-[#333] rounded-2xl p-6 text-center cursor-pointer hover:border-gray-300 dark:hover:border-[#444] hover:bg-gray-50 dark:hover:bg-[#050505] transition-all group"
                        >
                            <div className="flex items-center justify-center gap-2.5 text-gray-400 dark:text-[#888] group-hover:text-gray-600 dark:group-hover:text-white">
                                <span className="material-symbols-outlined !text-2xl font-bold">add</span>
                                <span className="text-sm font-bold">Attachments</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="px-8 py-5 border-t border-gray-100 dark:border-[#333] flex items-center justify-between bg-gray-50 dark:bg-[#3a3a3a]">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2.5 px-6 py-2.5 border border-gray-300 dark:border-[#555] rounded-full text-base font-bold text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#444] transition-all shadow-md mt-[-4px]"
                    >
                        <span className="material-symbols-outlined !text-xl">close</span>
                        Discard
                    </button>
                    <button
                        className="flex items-center gap-2.5 px-10 py-2.5 bg-gray-200 dark:bg-[#1a1a1a] rounded-full text-base font-bold text-gray-400 dark:text-[#555] cursor-not-allowed transition-all shadow-lg mt-[-4px]"
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

export default AddWorkExperienceModal;
