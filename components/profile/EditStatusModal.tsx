import React, { useState, useEffect } from "react";
import { profileService, TechStatus } from "../../services/profile";

interface EditStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EditStatusModal: React.FC<EditStatusModalProps> = ({ isOpen, onClose }) => {
    const [emoji, setEmoji] = useState("😊");
    const [text, setText] = useState("");
    const [busy, setBusy] = useState(false);
    const [expiration, setExpiration] = useState("never");
    const [visibleTo, setVisibleTo] = useState("everyone");

    useEffect(() => {
        if (isOpen) {
            const profile = profileService.getProfile();
            if (profile.techStatus) {
                setEmoji(profile.techStatus.emoji || "😊");
                setText(profile.techStatus.text || "");
                setBusy(profile.techStatus.busy || false);
                setExpiration("never");
            } else {
                setEmoji("😊");
                setText("");
                setBusy(false);
                setExpiration("never");
            }
            setVisibleTo("everyone");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSuggestion = (sEmoji: string, sText: string) => {
        setEmoji(sEmoji);
        setText(sText);
    };

    const handleClear = () => {
        const profile = profileService.getProfile();
        const currentStatus = profile.techStatus;
        if (currentStatus) {
            const updatedProfile = { ...profile };
            delete updatedProfile.techStatus;
            profileService.updateProfile(updatedProfile);
        }
        onClose();
    };

    const handleSave = () => {
        if (!text.trim() && !busy) {
            handleClear();
            return;
        }

        let expiresAt: number | undefined;
        const now = Date.now();
        switch (expiration) {
            case "30m": expiresAt = now + 30 * 60 * 1000; break;
            case "1h": expiresAt = now + 60 * 60 * 1000; break;
            case "4h": expiresAt = now + 4 * 60 * 60 * 1000; break;
            case "today":
                const endOfDay = new Date();
                endOfDay.setHours(23, 59, 59, 999);
                expiresAt = endOfDay.getTime();
                break;
            case "this_week":
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + (7 - nextWeek.getDay()));
                nextWeek.setHours(23, 59, 59, 999);
                expiresAt = nextWeek.getTime();
                break;
            default: expiresAt = undefined;
        }

        const newStatus: TechStatus = {
            emoji: emoji,
            text: text,
            busy: busy,
            expiresAt,
        };

        profileService.updateProfile({ techStatus: newStatus });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0A0A]lack/50 backdrop-blur-sm font-display p-4">
            <div className="bg-[#11141A] border border-[#1E232E] rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-4 py-3 border-b border-[#1E232E] flex items-center justify-between">
                    <h2 className="text-white font-bold text-sm">Edit status</h2>
                    <button onClick={onClose} title="Close" className="text-[#8b949e] hover:text-white transition-colors">
                        <span className="material-symbols-outlined !text-lg block">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="px-4 py-5 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-white mb-2">What's happening</label>
                        <div className="relative flex items-center bg-[#0A0D14] border border-[#1E232E] rounded-md focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                            <div className="flex items-center justify-center border-r border-[#1E232E]">
                                <input
                                    type="text"
                                    value={emoji}
                                    onChange={(e) => setEmoji(e.target.value.substring(0, 2))}
                                    title="Status Emoji"
                                    className="w-10 bg-transparent text-center border-none focus:ring-0 text-base py-1 px-1"
                                />
                            </div>
                            <input
                                type="text"
                                name="statusText"
                                id="statusText"
                                title="Status Text"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="What's your status?"
                                maxLength={72}
                                className="flex-1 bg-transparent border-none text-white px-3 py-1.5 text-sm focus:ring-0"
                            />
                        </div>
                        <p className="text-xs text-[#8b949e] mt-1">{72 - text.length} characters remaining</p>
                    </div>

                    {/* Suggestions */}
                    <div className="flex flex-wrap gap-2 pt-1">
                        <button onClick={() => handleSuggestion("🌴", "On vacation")} className="flex items-center gap-1.5 px-3 py-1 bg-[#11141A] hover:bg-[#30363d] border border-[#1E232E] rounded-full text-xs font-medium text-[#c9d1d9] transition-colors">
                            <span className="text-sm">🌴</span> On vacation
                        </button>
                        <button onClick={() => handleSuggestion("🤒", "Out sick")} className="flex items-center gap-1.5 px-3 py-1 bg-[#11141A] hover:bg-[#30363d] border border-[#1E232E] rounded-full text-xs font-medium text-[#c9d1d9] transition-colors">
                            <span className="text-sm">🤒</span> Out sick
                        </button>
                        <button onClick={() => handleSuggestion("🏡", "Working from home")} className="flex items-center gap-1.5 px-3 py-1 bg-[#11141A] hover:bg-[#30363d] border border-[#1E232E] rounded-full text-xs font-medium text-[#c9d1d9] transition-colors">
                            <span className="text-sm">🏡</span> Working from home
                        </button>
                        <button onClick={() => handleSuggestion("🎯", "Focusing")} className="flex items-center gap-1.5 px-3 py-1 bg-[#11141A] hover:bg-[#30363d] border border-[#1E232E] rounded-full text-xs font-medium text-[#c9d1d9] transition-colors">
                            <span className="text-sm">🎯</span> Focusing
                        </button>
                    </div>

                    <div className="pt-2">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center mt-0.5">
                                <input
                                    type="checkbox"
                                    checked={busy}
                                    onChange={(e) => setBusy(e.target.checked)}
                                    title="Busy Status"
                                    className="peer size-4 appearance-none rounded-sm border border-[#8b949e] bg-[#0A0D14] checked:bg-[#0A0A0A]lue-600 checked:border-blue-600 cursor-pointer focus:ring-0 focus:ring-offset-0"
                                />
                                <span className="material-symbols-outlined !text-[12px] text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 pointer-events-none">check</span>
                            </div>
                            <div>
                                <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">Busy</span>
                                <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">
                                    When others mention you, assign you, or request your review, TrackCodex will let them know that you have limited availability.
                                </p>
                            </div>
                        </label>
                    </div>

                    <div className="pt-2 border-t border-[#1E232E]">
                        <label htmlFor="expiration" className="block text-sm font-bold text-white mb-2 mt-4">Expiration</label>
                        <select
                            id="expiration"
                            value={expiration}
                            onChange={(e) => setExpiration(e.target.value)}
                            title="Expiration Time"
                            className="w-full bg-[#11141A] border border-[#1E232E] rounded-md px-3 py-1.5 text-sm text-white focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="never">Never</option>
                            <option value="30m">in 30 minutes</option>
                            <option value="1h">in 1 hour</option>
                            <option value="4h">in 4 hours</option>
                            <option value="today">today</option>
                            <option value="this_week">this week</option>
                        </select>
                        <p className="text-[11px] text-[#8b949e] mt-2">Your status will be cleared after the selected time.</p>
                    </div>

                    <div className="pt-2 border-t border-[#1E232E]">
                        <label htmlFor="visibleTo" className="block text-sm font-bold text-white mb-2 mt-4">Visible to</label>
                        <select
                            id="visibleTo"
                            value={visibleTo}
                            onChange={(e) => setVisibleTo(e.target.value)}
                            title="Status Visibility"
                            className="w-full bg-[#11141A] border border-[#1E232E] rounded-md px-3 py-1.5 text-sm text-white focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="everyone">Everyone</option>
                            <option value="organization">Organization only</option>
                        </select>
                        <p className="text-[11px] text-[#8b949e] mt-2">Limit status visibility to a single organization.</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-[#0A0D14] border-t border-[#1E232E] flex items-center justify-between gap-2">
                    <p className="text-xs text-[#8b949e]">Status visibility settings apply across TrackCodex.</p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="px-4 py-1.5 bg-[#11141A] hover:bg-[#30363d] text-[#c9d1d9] text-sm font-bold rounded-md border border-[#1E232E] transition-colors"
                        >
                            Clear status
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            title="Set status"
                            className="px-4 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-bold rounded-md border border-transparent transition-colors disabled:opacity-50"
                        >
                            Set status
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditStatusModal;
