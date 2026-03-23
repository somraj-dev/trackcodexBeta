import React from 'react';

interface AddSkillsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddSkillsModal: React.FC<AddSkillsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const suggestions = [
        "Social Recruiting",
        "BMC Helix ITSM (Remedy)",
        "Data Quality Management",
        "HTML",
        "Machine Learning Concepts",
        "E-Discovery",
        "Embedded programming",
        "GDPR Compliance",
        "Asana (Software)",
        "Education Law"
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#000000] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[#333] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-[#333] bg-white dark:bg-[#000000]">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-gray-400 dark:text-[#888] !text-2xl">history</span>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Skills</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-gray-400 dark:text-[#888] hover:text-gray-600 dark:hover:text-white transition-colors">
                            <span className="material-symbols-outlined !text-2xl">lightbulb</span>
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-8 space-y-8">
                    {/* Suggestions Section */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Suggestions</h3>
                        <div className="flex flex-wrap gap-3">
                            {suggestions.map((skill) => (
                                <button
                                    key={skill}
                                    className="px-5 py-2.5 rounded-full border border-gray-200 dark:border-[#333] text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#111] border-dashed transition-all"
                                >
                                    {skill}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Skills Input Section */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Skills</h3>
                        <div className="relative group">
                            <textarea
                                rows={4}
                                placeholder="List your skills here, showcasing what you excel at."
                                className="w-full px-5 py-4 bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#333] rounded-2xl text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all resize-none text-base leading-relaxed font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="px-8 py-5 border-t border-gray-100 dark:border-[#333] flex items-center justify-end bg-white dark:bg-[#000000]">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-base font-bold transition-all shadow-lg active:scale-95"
                    >
                        <span className="material-symbols-outlined !text-xl">check</span>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddSkillsModal;
