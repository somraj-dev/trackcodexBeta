import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { auth } from "../../lib/firebase";
import { confirmPasswordReset } from "firebase/auth";
import TrackCodexLogo from "../../components/branding/TrackCodexLogo";

const ResetPassword = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Firebase sends oobCode (out-of-band code) in the reset link URL
    const oobCode = searchParams.get("oobCode");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            setIsLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }

        if (!oobCode) {
            setError("Invalid or expired reset link. Please request a new one.");
            setIsLoading(false);
            return;
        }

        try {
            await confirmPasswordReset(auth, oobCode, password);
            setSuccess(true);
            setTimeout(() => navigate("/login"), 3000);
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
        <div className="flex min-h-screen font-display">
            {/* Left Panel - Dark & Artistic */}
            <div className="hidden lg:flex w-[45%] bg-gh-bg flex-col justify-center items-center relative overflow-hidden p-12 text-gh-text-secondary border-r border-gh-border">
                <div className="relative z-10 w-full max-w-md">
                    <TrackCodexLogo className="mb-8 scale-110 origin-left" />
                    <h1 className="text-4xl font-bold text-gh-text mb-4 tracking-tight">
                        Secure Your Account
                    </h1>
                    <p className="text-lg text-gh-text-secondary leading-relaxed mb-8">
                        Create a strong, unique password to protect your TrackCodex workspace and data.
                    </p>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex flex-col justify-center items-center bg-gh-bg-secondary p-8 relative">
                <div className="w-full max-w-md bg-gh-bg rounded-xl shadow-sm border border-gh-border p-8 relative z-10">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gh-text mb-2 tracking-tight">
                            Create New Password
                        </h2>
                        <p className="text-gh-text-secondary text-sm">
                            Please enter your new password below.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {success && (
                            <div className="p-3 bg-green-50 text-green-700 text-sm rounded-md border border-green-200 flex flex-col gap-1">
                                <div className="flex items-center gap-2 font-medium">
                                    <span className="material-symbols-outlined text-green-500 text-[20px]">check_circle</span>
                                    Password updated successfully!
                                </div>
                                <div className="ml-7 text-green-600/80">Redirecting to login...</div>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200 flex items-center gap-2">
                                <span className="material-symbols-outlined text-red-500 text-[20px]">error</span>
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gh-text-secondary">
                                New Password
                            </label>
                            <div className="relative group/input">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gh-text-secondary group-focus-within/input:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">
                                        lock
                                    </span>
                                </span>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gh-bg border border-gh-border rounded-md text-sm text-gh-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gh-text-secondary">
                                Confirm New Password
                            </label>
                            <div className="relative group/input">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gh-text-secondary group-focus-within/input:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">
                                        lock_reset
                                    </span>
                                </span>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gh-bg border border-gh-border rounded-md text-sm text-gh-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || success}
                            className="w-full bg-primary hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Updating...
                                </>
                            ) : (
                                "Update Password"
                            )}
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
