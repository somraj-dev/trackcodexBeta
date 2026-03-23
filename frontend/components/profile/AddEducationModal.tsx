import React from 'react';

interface AddEducationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddEducationModal: React.FC<AddEducationModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#000000] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[#333] animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-[#333] bg-white dark:bg-[#000000] shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-gray-400 dark:text-[#888] !text-2xl">history</span>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Education</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-gray-400 dark:text-[#888] !text-2xl cursor-pointer hover:text-gray-600 dark:hover:text-white transition-colors">visibility</span>
                        <span className="material-symbols-outlined text-gray-400 dark:text-[#888] !text-2xl cursor-pointer hover:text-gray-600 dark:hover:text-white transition-colors">lightbulb</span>
                    </div>
                </div>

                {/* Breadcrumb-like header inside content */}
                <div className="px-8 pt-6 pb-2 shrink-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <span className="text-gray-500 dark:text-gray-400">Education</span>
                        <span className="text-gray-400 dark:text-[#555]">&gt;</span>
                        <span className="text-gray-900 dark:text-white">New Education</span>
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-8 pt-4 space-y-6 overflow-y-auto custom-scrollbar text-gray-900 dark:text-white flex-1">
                    {/* Qualification */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2.5">
                            Qualification<span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <div className="relative">
                            <select className="appearance-none w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all font-medium pr-10">
                                <option value="" disabled selected hidden>Select Qualification</option>
                                <option value="hs">High School</option>
                                <option value="ug">Undergraduate</option>
                                <option value="pg">Postgraduate</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#555] pointer-events-none">arrow_drop_down</span>
                        </div>
                    </div>

                    {/* Course */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2.5">
                            Course<span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <div className="relative">
                            <select className="appearance-none w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all font-medium pr-10">
                                <option value="" disabled selected hidden>Select Course</option>
                                <option value="btech">B.Tech</option>
                                <option value="bsc">B.Sc</option>
                                <option value="bcom">B.Com</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#555] pointer-events-none">arrow_drop_down</span>
                        </div>
                    </div>

                    {/* Specialization */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2.5">
                            Specialization<span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <div className="relative">
                            <select className="appearance-none w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all font-medium pr-10">
                                <option value="" disabled selected hidden>Select Specialization</option>
                                <option value="cse">Computer Science</option>
                                <option value="me">Mechanical Engineering</option>
                                <option value="ee">Electrical Engineering</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#555] pointer-events-none">arrow_drop_down</span>
                        </div>
                    </div>

                    {/* College */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2.5">
                            College<span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="College"
                            className="w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] focus:outline-none focus:border-blue-500 transition-all font-medium"
                        />
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2.5">
                            Duration<span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Start Year"
                                className="w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] focus:outline-none focus:border-blue-500 transition-all font-medium"
                            />
                            <input
                                type="text"
                                placeholder="End Year"
                                className="w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] focus:outline-none focus:border-blue-500 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {/* Course Type */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2.5">
                            Course type
                        </label>
                        <div className="relative">
                            <select className="appearance-none w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all font-medium pr-10">
                                <option value="" disabled selected hidden>Select Course Type</option>
                                <option value="full">Full Time</option>
                                <option value="part">Part Time</option>
                                <option value="distance">Distance Learning</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#555] pointer-events-none">arrow_drop_down</span>
                        </div>
                    </div>

                    {/* Percentage & CGPA */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2.5">Percentage</label>
                            <input
                                type="text"
                                placeholder="Percentage"
                                className="w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] focus:outline-none focus:border-blue-500 transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2.5">CGPA</label>
                            <input
                                type="text"
                                placeholder="CGPA"
                                className="w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] focus:outline-none focus:border-blue-500 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {/* Roll Number & Lateral Entry */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2.5">Roll Number</label>
                            <input
                                type="text"
                                placeholder="Roll number"
                                className="w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#555] focus:outline-none focus:border-blue-500 transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2.5">Are you a Lateral Entry Student?</label>
                            <div className="relative">
                                <select className="appearance-none w-full px-4 py-3 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all font-medium pr-10">
                                    <option value="" disabled selected hidden>Lateral entry</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#555] pointer-events-none">arrow_drop_down</span>
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
                            placeholder="Detail your education journey: degrees, accomplishments, skills gained. Share your academic and learning experiences to stand out"
                            className="w-full px-4 py-4 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all resize-none text-sm leading-relaxed font-medium"
                        />
                    </div>

                    {/* AI Button */}
                    <button className="flex items-center gap-3 px-5 py-2.5 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-full hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all group shadow-sm w-max">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center p-1">
                            <span className="material-symbols-outlined text-white !text-[14px]">auto_fix_high</span>
                        </div>
                        <span className="text-sm font-bold text-gray-700 dark:text-white">Generate with AI</span>
                    </button>

                    {/* Attachments */}
                    <div className="space-y-4">
                        <input
                            type="file"
                            id="edu-attachments"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                console.warn("Files selected:", files);
                            }}
                        />
                        <div 
                            onClick={() => document.getElementById('edu-attachments')?.click()}
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
                <div className="px-8 py-5 border-t border-gray-100 dark:border-[#333] flex items-center justify-between bg-white dark:bg-[#000000] shrink-0">
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

export default AddEducationModal;
