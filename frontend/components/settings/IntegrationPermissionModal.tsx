
import React from 'react';

interface Integration {
    id: string;
    name: string;
    icon: string;
}

interface IntegrationPermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    integration: Integration | null;
}

const IntegrationPermissionModal: React.FC<IntegrationPermissionModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    integration,
}) => {
    if (!isOpen || !integration) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1C1C1C] border border-[#333] rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col">
                {/* Header with Logos */}
                <div className="p-8 pb-6 flex flex-col items-center">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-[#888888] hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="size-16 bg-black rounded-2xl border border-[#333] flex items-center justify-center shadow-lg">
                            {/* App Logo Placeholder - replace with actual app logo if available */}
                            <span className="material-symbols-outlined text-3xl text-white">hub</span>
                        </div>
                        <div className="flex gap-1 text-[#888888]">
                            <span className="size-1.5 rounded-full bg-gray-600"></span>
                            <span className="size-1.5 rounded-full bg-gray-600"></span>
                            <span className="size-1.5 rounded-full bg-gray-600"></span>
                        </div>
                        <div className="size-16 bg-black rounded-2xl border border-[#333] flex items-center justify-center shadow-lg">
                            <span className="material-symbols-outlined text-3xl text-white">
                                {integration.icon}
                            </span>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-1">
                        Connect {integration.name}
                    </h2>
                    <p className="text-[#a1a1aa] text-sm">
                        Developed by {integration.name}
                    </p>
                </div>

                {/* Content Body */}
                <div className="px-6 pb-6 space-y-4">

                    {/* Permission Item 1 */}
                    <div className="p-4 rounded-lg bg-[#222] border border-[#333]">
                        <h3 className="text-white font-bold text-sm mb-1">Permissions always respected</h3>
                        <p className="text-xs text-[#a1a1aa] leading-relaxed">
                            TrackCodex is strictly limited to permissions you've explicitly set. Disable access anytime to revoke permissions.
                        </p>
                    </div>

                    {/* Permission Item 2 */}
                    <div className="p-4 rounded-lg bg-[#222] border border-[#333]">
                        <h3 className="text-white font-bold text-sm mb-1">You're in control</h3>
                        <p className="text-xs text-[#a1a1aa] leading-relaxed">
                            TrackCodex always respects your training data preferences. Data from {integration.name} may be used to provide you relevant and useful information.
                        </p>
                    </div>

                    {/* Permission Item 3 */}
                    <div className="p-4 rounded-lg bg-[#222] border border-[#333]">
                        <h3 className="text-white font-bold text-sm mb-1">Connectors may introduce risk</h3>
                        <p className="text-xs text-[#a1a1aa] leading-relaxed">
                            Connectors are designed to respect your privacy, but sites may attempt to steal your data. <span className="underline cursor-pointer hover:text-white">Learn more on how to stay safe</span>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[#333] bg-[#111]">
                    <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-[#1C1C1C] border border-[#333]">
                        <div className="size-8 rounded-full bg-white flex items-center justify-center shrink-0">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="size-5" />
                        </div>
                        <div className="text-xs text-[#a1a1aa] leading-tight">
                            <strong className="text-white block mb-0.5">You use Google to authenticate</strong>
                            For added security, enable Multi-factor authentication (MFA) on your Google account.
                        </div>
                    </div>

                    <button
                        onClick={onConfirm}
                        className="w-full py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
                    >
                        Continue to {integration.name}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IntegrationPermissionModal;


