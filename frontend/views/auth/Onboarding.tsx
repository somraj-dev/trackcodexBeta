import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { profileService, UserProfile } from "../../services/activity/profile";

const Onboarding = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Step 1 Data: Profile
    const [username, setUsername] = useState(user?.username || "");
    const [avatar, setAvatar] = useState(user?.avatar || "https://github.com/identicons/jasonlong.png");

    // Step 2 Data: Personalized Experience
    const [interest, setInterest] = useState<string[]>([]);

    const interestsOptions = [
        { id: "learning", icon: "school", title: "Learning to code", desc: "I'm here to improve my skills and build my portfolio." },
        { id: "professional", icon: "work", title: "Professional work", desc: "I'm building projects for my company or clients." },
        { id: "oss", icon: "moped", title: "Open source", desc: "I want to contribute to the community and find projects." },
        { id: "hiring", icon: "person_search", title: "Looking for jobs", desc: "I want to showcase my skills to potential employers." },
    ];

    const toggleInterest = (id: string) => {
        setInterest(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleComplete = async () => {
        setIsLoading(true);
        try {
            // Update profile via service
            const currentProfile = profileService.getProfile();
            profileService.updateProfile({
                ...currentProfile,
                username: username,
                avatar: avatar,
                // We could also send interests to backend here if the model supports it
            });

            // Simulate backend sync
            await new Promise(resolve => setTimeout(resolve, 1500));

            setStep(3); // Go to final welcome step
        } catch (err) {
            console.error("Onboarding update failed:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 w-full bg-[#0d1117] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
                <div className="mx-auto h-12 w-12 bg-white rounded-full flex items-center justify-center filter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] mb-6">
                    <svg className="w-8 h-8 text-[#0d1117]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L2 7l10 5 10-5-10-5zm0 14.5l-10-5v5l10 5 10-5v-5l-10 5z" />
                    </svg>
                </div>

                {/* Progress Bar (GitHub Style) */}
                <div className="flex justify-center gap-2 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`h-1 w-12 rounded-full transition-colors duration-500 ${step >= s ? 'bg-[#2f81f7]' : 'bg-[#30363d]'}`}
                        />
                    ))}
                </div>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-[500px]">
                {step === 1 && (
                    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-2xl font-bold text-white mb-2">Welcome to TrackCodex!</h2>
                        <p className="text-[#8b949e] mb-8">Let's start with the basics. Choose how you'll appear to the community.</p>

                        <div className="space-y-6">
                            <div className="flex flex-col items-center mb-4">
                                <div className="relative group">
                                    <img
                                        src={avatar}
                                        className="w-24 h-24 rounded-full border-4 border-[#30363d] group-hover:border-[#2f81f7] transition-all cursor-pointer"
                                        alt="Avatar"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="material-symbols-outlined text-white">edit</span>
                                    </div>
                                </div>
                                <button className="text-xs text-[#2f81f7] mt-3 hover:underline">Change avatar</button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#e6edf3] mb-2 font-mono">
                                    What's your unique username?
                                </label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-[#30363d] bg-[#0d1117] text-[#8b949e] sm:text-sm">
                                        trackcodex.com/
                                    </span>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                                        className="flex-1 block w-full px-3 py-2 border border-[#30363d] rounded-none rounded-r-md focus:outline-none focus:ring-[#2f81f7] focus:border-[#2f81f7] sm:text-sm bg-[#0d1117] text-[#e6edf3]"
                                        placeholder="johndoe"
                                    />
                                </div>
                                <p className="mt-2 text-[12px] text-[#8b949e]">Only lowercase letters and numbers allowed.</p>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                disabled={!username}
                                className="w-full py-2 px-4 bg-[#238636] hover:bg-[#2ea043] text-white font-semibold rounded-md transition-colors disabled:opacity-50"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 shadow-2xl animate-in fade-in slide-in-from-right-4 duration-500">
                        <h2 className="text-2xl font-bold text-white mb-2">Tailor your experience</h2>
                        <p className="text-[#8b949e] mb-8">What are you planning to do on TrackCodex? Select all that apply.</p>

                        <div className="grid grid-cols-1 gap-4 mb-8">
                            {interestsOptions.map((opt) => (
                                <div
                                    key={opt.id}
                                    onClick={() => toggleInterest(opt.id)}
                                    className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${interest.includes(opt.id) ? 'border-[#2f81f7] bg-[#1f6feb]/10' : 'border-[#30363d] hover:border-[#8b949e]'}`}
                                >
                                    <span className={`material-symbols-outlined mr-4 ${interest.includes(opt.id) ? 'text-[#2f81f7]' : 'text-[#8b949e]'}`}>
                                        {opt.icon}
                                    </span>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">{opt.title}</h3>
                                        <p className="text-[12px] text-[#8b949e]">{opt.desc}</p>
                                    </div>
                                    {interest.includes(opt.id) && (
                                        <span className="material-symbols-outlined text-[#2f81f7] text-[18px] ml-auto">check_circle</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-2 px-4 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] font-semibold rounded-md transition-colors border border-[#30363d]"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleComplete}
                                disabled={interest.length === 0 || isLoading}
                                className="flex-[2] py-2 px-4 bg-[#238636] hover:bg-[#2ea043] text-white font-semibold rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
                            >
                                {isLoading ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                ) : null}
                                {isLoading ? "Saving..." : "Complete Setup"}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="text-center animate-in zoom-in fade-in duration-700">
                        <div className="inline-block relative mb-8">
                            {/* Success Orbit Animation Mockup */}
                            <div className="absolute inset-0 bg-[#238636] blur-[60px] opacity-20 animate-pulse"></div>
                            <img
                                src="/trackcodex_mascots_1772712882907.png"
                                className="w-48 h-48 relative z-10 animate-[float_4s_ease-in-out_infinite]"
                                alt="Welcome Mascot"
                            />
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">You're all set, {username}!</h2>
                        <p className="text-lg text-[#8b949e] max-w-sm mx-auto mb-10">
                            Your workspace is being prepared. Get ready to build something amazing.
                        </p>

                        <button
                            onClick={() => navigate("/dashboard/home")}
                            className="inline-flex items-center px-12 py-3 bg-white text-[#0d1117] font-bold rounded-full hover:bg-[#e6edf3] transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            Launch Dashboard
                            <span className="material-symbols-outlined ml-2">rocket_launch</span>
                        </button>
                    </div>
                )}
            </div>

            <footer className="mt-auto py-8 text-center">
                <p className="text-[12px] text-[#8b949e]">
                    Signed in as {user?.email} • <button onClick={logout} className="hover:text-[#2f81f7] underline cursor-pointer">Sign out</button>
                </p>
            </footer>
        </div>
    );
};

export default Onboarding;


