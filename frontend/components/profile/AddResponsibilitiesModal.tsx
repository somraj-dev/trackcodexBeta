import React, { useState } from 'react';

interface AddResponsibilitiesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddResponsibilitiesModal: React.FC<AddResponsibilitiesModalProps> = ({ isOpen, onClose }) => {
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
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Responsibilities</h2>
                    </div>
                    <button className="text-gray-400 dark:text-[#888] hover:text-gray-600 dark:hover:text-white transition-colors">
                        <span className="material-symbols-outlined !text-2xl">lightbulb</span>
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-8 space-y-8 overflow-y-auto max-h-[75vh] custom-scrollbar text-gray-900 dark:text-white">
                    {/* Position */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2.5">
                            Position of Responsibility<span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Designation"
                            className="w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] focus:outline-none focus:border-blue-500 transition-all font-medium"
                        />
                    </div>

                    {/* Organization */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2.5">
                            Organisation<span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Select organisation"
                            className="w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] focus:outline-none focus:border-blue-500 transition-all font-medium"
                        />
                    </div>

                    {/* Location */}
                    <div className="relative group border border-gray-200 dark:border-[#333] rounded-xl bg-white dark:bg-[#000000] flex items-center pr-4">
                        <input
                            type="text"
                            placeholder="Select Location"
                            className="flex-1 px-4 py-3 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] focus:outline-none font-medium"
                        />
                        <label className="flex items-center gap-2.5 cursor-pointer pl-4">
                            <input
                                type="checkbox"
                                checked={isWorkFromHome}
                                onChange={(e) => setIsWorkFromHome(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 dark:border-[#333] bg-white dark:bg-[#000] text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                            />
                            <span className="text-xs text-gray-500 dark:text-[#666] font-bold whitespace-nowrap">Work from Home</span>
                        </label>
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
                                    className="w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all pr-10 cursor-pointer text-sm font-medium"
                                />
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#555] !text-xl pointer-events-none group-hover:text-blue-500 dark:group-hover:text-white transition-colors">calendar_today</span>
                            </div>
                            <div className={`relative group ${isCurrentlyWorking ? 'opacity-30 grayscale' : 'cursor-pointer'}`} onClick={(e) => !isCurrentlyWorking && (e.currentTarget.querySelector('input') as HTMLInputElement).showPicker()}>
                                <input
                                    type="date"
                                    disabled={isCurrentlyWorking}
                                    className="w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all pr-10 cursor-pointer disabled:cursor-not-allowed text-sm font-medium"
                                />
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#555] !text-xl pointer-events-none group-hover:text-blue-500 dark:group-hover:text-white transition-colors">calendar_today</span>
                            </div>
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

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2.5">Description</label>
                        <textarea
                            rows={4}
                            placeholder="Outline the specific responsibilities you undertook in your roles, along with any key skills you utilized or developed, and impactful experiences or achievements you had while fulfilling these duties."
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

                    {/* Attachments */}
                    <div className="space-y-4">
                        <input
                            type="file"
                            id="resp-attachments"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                console.warn("Files selected:", files);
                            }}
                        />
                        <div 
                            onClick={() => document.getElementById('resp-attachments')?.click()}
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

export default AddResponsibilitiesModal;
