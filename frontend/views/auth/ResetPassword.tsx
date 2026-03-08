import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth } from "../../lib/firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";

const ResetPassword = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [email, setEmail] = useState<string | null>(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Firebase sends oobCode (out-of-band code) in the reset link URL
    const oobCode = searchParams.get("oobCode");

    useEffect(() => {
        const verifyCode = async () => {
            if (oobCode) {
                try {
                    const userEmail = await verifyPasswordResetCode(auth, oobCode);
                    setEmail(userEmail);
                } catch (err) {
                    setError("This reset link is invalid or has expired.");
                }
            } else {
                setError("No reset code found. Please request a new link.");
            }
        };
        verifyCode();
    }, [oobCode]);

    const passwordRequirements = [
        { id: 'length', label: 'At least 15 characters OR at least 8 characters including a number and a lowercase letter.', check: (p: string) => p.length >= 15 || (p.length >= 8 && /[0-9]/.test(p) && /[a-z]/.test(p)) }
    ];

    const isPasswordValid = passwordRequirements.every(req => req.check(password));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isPasswordValid) return;

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (!oobCode) {
            setError("Invalid or expired reset link. Please request a new one.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await confirmPasswordReset(auth, oobCode, password);
            setSuccess(true);
            setTimeout(() => navigate("/login"), 2000);
        } catch (err: any) {
            if (err.code === "auth/expired-action-code") {
                setError("This reset link has expired. Please request a new one.");
            } else if (err.code === "auth/invalid-action-code") {
                setError("This reset link is invalid or has already been used.");
            } else {
                setError(err.message || "Failed to update password");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                {/* TrackCodex Logo imitating the GitHub icon placement */}
                <div className="mx-auto h-12 w-12 bg-white rounded-full flex items-center justify-center filter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] mb-6">
                    <svg className="w-8 h-8 text-[#0d1117]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L2 7l10 5 10-5-10-5zm0 14.5l-10-5v5l10 5 10-5v-5l-10 5z" />
                    </svg>
                </div>
                <h2 className="text-center text-[24px] font-light tracking-tight text-[#e6edf3] mb-6">
                    Change password for @{email ? email.split('@')[0] : 'user'}
                </h2>

                {/* Requirement Hint (GitHub style) */}
                <p className={`text-[13px] mb-8 max-w-[320px] mx-auto leading-relaxed transition-colors duration-200 ${isPasswordValid ? "text-green-500 font-medium" : "text-[#8b949e]"}`}>
                    Make sure it's at least 15 characters OR at least 8 characters including a number and a lowercase letter. <a href="#" className="text-[#2f81f7] hover:underline">Learn more</a>.
                </p>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-[340px]">
                <div className="bg-[#161b22] py-8 px-4 shadow-2xl border border-[#30363d] rounded-md sm:px-6 animate-in fade-in zoom-in duration-300">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {success && (
                            <div className="p-3 mb-4 rounded-md bg-[rgba(35,134,54,0.1)] border border-[rgba(35,134,54,0.4)] text-[#3fb950] text-sm flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                Password updated! Redirecting...
                            </div>
                        )}

                        {error && (
                            <div className="p-3 mb-4 rounded-md bg-[rgba(248,81,73,0.1)] border border-[rgba(248,81,73,0.4)] text-[#ff7b72] text-sm flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">error</span>
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-[#e6edf3] mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-1.5 border border-[#30363d] rounded-md shadow-sm placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#2f81f7] focus:border-transparent sm:text-sm bg-[#0d1117] text-[#e6edf3] transition-all pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#e6edf3] mb-2">
                                Confirm password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-1.5 border border-[#30363d] rounded-md shadow-sm placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#2f81f7] focus:border-transparent sm:text-sm bg-[#0d1117] text-[#e6edf3] transition-all pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    {showConfirmPassword ? (
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading || success || !isPasswordValid}
                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white transition-all transform active:scale-[0.98] ${isPasswordValid
                                    ? "bg-[#238636] hover:bg-[#2ea043] focus:ring-2 focus:ring-offset-2 focus:ring-[#238636]"
                                    : "bg-[#238636] opacity-50 cursor-not-allowed"
                                    }`}
                            >
                                {isLoading ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    "Change password"
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <footer className="mt-8 text-center px-4">
                    <p className="text-[12px] text-[#8b949e]">
                        By changing your password, you agree to TrackCodex's <a href="#" className="text-[#2f81f7] hover:underline">Terms of Service</a> and <a href="#" className="text-[#2f81f7] hover:underline">Privacy Policy</a>.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default ResetPassword;
