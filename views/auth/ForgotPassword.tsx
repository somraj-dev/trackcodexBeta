import React, { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../../lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import TrackCodexLogo from "../../components/branding/TrackCodexLogo";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage(null);

        try {
            await sendPasswordResetEmail(auth, email);
            setMessage("Password reset link sent! Please check your email.");
            setEmail("");
        } catch (err: any) {
            if (err.code === "auth/user-not-found") {
                // Don't reveal if user exists — same message either way
                setMessage("If an account exists with this email, a password reset link has been sent.");
            } else {
                setError(err.message || "Failed to send reset link");
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
                        Account Recovery
                    </h1>
                    <p className="text-lg text-gh-text-secondary leading-relaxed mb-8">
                        Enter your email to receive a secure link to reset your password and regain access to your workspace.
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
                            Reset Password
                        </h2>
                        <p className="text-gh-text-secondary text-sm">
                            We'll send you an email with a link to reset your password.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {message && (
                            <div className="p-3 bg-green-50 text-green-700 text-sm rounded-md border border-green-200 flex items-center gap-2">
                                <span className="material-symbols-outlined text-green-500 text-[20px]">check_circle</span>
                                {message}
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
                                Email address
                            </label>
                            <div className="relative group/input">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gh-text-secondary group-focus-within/input:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">
                                        mail
                                    </span>
                                </span>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gh-bg border border-gh-border rounded-md text-sm text-gh-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                                    placeholder="you@company.com"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-[#0A0A0A]lue-600 text-white font-medium py-2 px-4 rounded-md transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Sending...
                                </>
                            ) : (
                                "Send reset link"
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gh-text-secondary">
                        Remember your password?{" "}
                        <Link
                            to="/login"
                            className="text-primary hover:underline font-medium hover:text-blue-500 transition-colors"
                        >
                            Back to login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
