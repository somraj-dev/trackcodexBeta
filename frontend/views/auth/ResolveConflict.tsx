import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, googleProvider, githubProvider } from "../../lib/firebase";
import { signInWithPopup } from "firebase/auth";

interface ConflictState {
    email: string;
    existingProvider: string;
    pendingProvider?: string;
}

const ResolveConflict = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // We expect the email and the pending provider to be passed in from Login/Signup
    const { email, existingProvider } = (location.state as ConflictState) || {};

    // For the demo/mock, if no state is found, we redirect back to login
    useEffect(() => {
        if (!email) {
            navigate("/login");
        }
    }, [email, navigate]);

    const handleResolve = async () => {
        setIsLoading(true);
        setError("");
        try {
            // 1. Sign in with the EXISTING provider first
            const provider = existingProvider === 'google.com' ? googleProvider : githubProvider;
            await signInWithPopup(auth, provider);

            // 2. We'd normally get the pending credential here from the error state 
            // but since we are on a new page, we need the user to re-authenticate with the NEW one 
            // or we could have passed the pending credential if it was serializable.
            // Simplified workflow: Sign in with the right one, then we can link later in settings.

            navigate("/dashboard/home");
        } catch (err: any) {
            console.error("Conflict resolution failed:", err);
            setError(err.message || "Failed to link accounts. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-[#161b22] p-10 rounded-2xl border border-[#30363d] shadow-2xl relative overflow-hidden">
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2f81f7] to-[#238636]"></div>

                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-[#1f6feb]/10 rounded-full flex items-center justify-center mb-6 border border-[#1f6feb]/30">
                        <span className="material-symbols-outlined text-[#2f81f7] text-3xl">account_circle</span>
                    </div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Email already in use</h2>
                    <p className="mt-4 text-[#8b949e] text-sm leading-relaxed">
                        The email <span className="text-white font-semibold">{email}</span> is already associated with an account using <span className="text-[#2f81f7] font-semibold">{existingProvider === 'google.com' ? 'Google' : 'GitHub'}</span>.
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    <div className="p-4 bg-[#0d1117] rounded-lg border border-[#30363d] space-y-3">
                        <div className="flex items-center gap-3 text-sm text-[#e6edf3]">
                            <span className="material-symbols-outlined text-[#238636] text-[18px]">check_circle</span>
                            Secure your account by linking them together.
                        </div>
                        <div className="flex items-center gap-3 text-sm text-[#e6edf3]">
                            <span className="material-symbols-outlined text-[#238636] text-[18px]">check_circle</span>
                            Single profile for all your contributions.
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-md bg-red-900/20 border border-red-500/50 text-red-400 text-xs text-center animate-in fade-in zoom-in duration-200">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 pt-2">
                        <button
                            onClick={handleResolve}
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-[#238636] hover:bg-[#2ea043] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#238636] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                            ) : (
                                <span className="material-symbols-outlined mr-2 text-[18px]">link</span>
                            )}
                            {isLoading ? "Redirecting..." : `Continue with ${existingProvider === 'google.com' ? 'Google' : 'GitHub'}`}
                        </button>

                        <button
                            onClick={() => navigate("/login")}
                            className="text-sm text-[#8b949e] hover:text-[#2f81f7] font-medium transition-colors"
                        >
                            Nevermind, take me back
                        </button>
                    </div>
                </div>

                {/* GitHub style footer decoration */}
                <div className="mt-8 pt-6 border-t border-[#30363d] flex justify-center gap-4 grayscale opacity-40">
                    <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" className="h-5 w-5 invert" alt="GitHub" />
                    <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" className="h-5 w-5" alt="Google" />
                </div>
            </div>
        </div>
    );
};

export default ResolveConflict;
