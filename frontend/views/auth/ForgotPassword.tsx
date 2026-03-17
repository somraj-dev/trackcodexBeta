import React, { useState } from "react";
import { api } from "../../services/infra/api";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Captcha Mock State
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const [rotation, setRotation] = useState(180);

    const handleCaptchaSubmit = (e: React.MouseEvent) => {
        e.preventDefault();
        // Since original rotation is 0 for matching, normalized rotation is 0 or 360.
        const normalized = ((rotation % 360) + 360) % 360;
        if (normalized === 0) {
            setCaptchaVerified(true);
        } else {
            setError("Verification failed. Please match the direction exactly.");
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!captchaVerified) {
            setError("Please verify your account first.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setMessage(null);

        try {
            await api.post("/auth/password-reset/request", { email });
            setMessage("Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.");
            setEmail("");
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || "Failed to send reset link");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 bg-[#0d1117] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                {/* TrackCodex Logo imitating the GitHub icon placement */}
                <div className="mx-auto h-12 w-12 bg-white rounded-full flex items-center justify-center filter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] mb-6">
                    <svg className="w-8 h-8 text-[#0d1117]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L2 7l10 5 10-5-10-5zm0 14.5l-10-5v5l10 5 10-5v-5l-10 5z" />
                    </svg>
                </div>
                <h2 className="text-center text-[24px] font-light tracking-tight text-[#e6edf3] mb-2">
                    Reset your password
                </h2>
                <p className="text-[14px] text-[#e6edf3] mb-6">
                    Enter your user account's verified email address and we will send you a password reset link.
                </p>
            </div>

            <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-[400px]">
                {error && (
                    <div className="p-4 mb-4 rounded-md bg-[rgba(248,81,73,0.1)] border border-[rgba(248,81,73,0.4)] text-[#ff7b72] text-sm flex items-center justify-between animate-in fade-in zoom-in duration-200">
                        {error}
                        <button onClick={() => setError(null)} aria-label="Dismiss error" title="Dismiss error" className="text-[#ff7b72] hover:text-[#ff9892] focus:outline-none transition-colors">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                        </button>
                    </div>
                )}

                {message && (
                    <div className="p-4 mb-4 rounded-md bg-[rgba(46,160,67,0.1)] border border-[rgba(46,160,67,0.4)] text-[#3fb950] text-sm animate-in fade-in zoom-in duration-200">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email Input */}
                    <div>
                        <label className="block text-sm font-semibold text-[#e6edf3] mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="appearance-none block w-full px-3 py-[6px] border border-[#30363d] rounded-md shadow-sm placeholder-[#8b949e] focus:outline-none focus:ring-[#2f81f7] focus:border-[#2f81f7] sm:text-sm bg-[#0d1117] text-[#e6edf3] transition-colors"
                            placeholder="Enter your email address"
                        />
                    </div>

                    <div className="text-center">
                        <h3 className="text-sm font-bold text-[#e6edf3] mb-4">Verify your account</h3>

                        {!captchaVerified ? (
                            <div className="bg-white rounded-[10px] p-4 text-[#1F2328] shadow-lg max-w-full overflow-hidden animate-in fade-in duration-300">
                                <p className="text-[13px] text-left leading-snug mb-4">
                                    Use the arrows to rotate the asset to face in the same direction as the asset in the left image (1 of 1)
                                </p>

                                <div className="flex gap-4 justify-center items-stretch mb-4">
                                    {/* Target Image (Left) */}
                                    <div className="w-[110px] h-[110px] bg-black bg-[url('https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?auto=format&fit=crop&w=150&q=80')] bg-cover relative border border-[#d0d7de] flex items-center justify-center">
                                        <div className="absolute inset-0 bg-black/30 mix-blend-multiply"></div>
                                        <span className="text-5xl filter drop-shadow-md z-10" style={{ transform: 'scaleX(-1)' }}>🐕</span>
                                        <div className="absolute bottom-0 w-full bg-black text-white text-[9px] font-bold py-1 px-2 text-left leading-tight z-20">
                                            Match the<br />direction!
                                        </div>
                                    </div>

                                    {/* Interactive Image (Right) */}
                                    <div className="flex-1 max-w-[130px] flex flex-col justify-between items-center">
                                        <div className="w-[110px] h-[110px] bg-black bg-[url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=150&q=80')] bg-cover border border-[#d0d7de] flex items-center justify-center relative shadow-inner overflow-hidden">
                                            <div className="absolute inset-0 bg-white/20"></div>
                                            <div className="relative z-10 text-5xl transition-transform duration-300 ease-out filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]" style={{ transform: `rotate(${rotation}deg)` }}>
                                                🐕
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center w-full mt-3 px-1">
                                            <button type="button" onClick={() => setRotation(r => r - 45)} aria-label="Rotate left" title="Rotate left" className="w-8 h-8 rounded-full border border-[#d0d7de] flex items-center justify-center hover:bg-[#f6f8fa] active:bg-[#ebedef] transition-colors focus:ring-2 focus:ring-[#0969da] outline-none">
                                                <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                            </button>
                                            <div className="flex gap-1 justify-center items-center">
                                                <div className="w-2 h-2 rounded-full bg-[#1a7f37]"></div>
                                                <div className="w-[6px] h-[6px] rounded-full bg-[#d0d7de]"></div>
                                                <div className="w-[6px] h-[6px] rounded-full bg-[#d0d7de]"></div>
                                            </div>
                                            <button type="button" onClick={() => setRotation(r => r + 45)} aria-label="Rotate right" title="Rotate right" className="w-8 h-8 rounded-full border border-[#d0d7de] flex items-center justify-center hover:bg-[#f6f8fa] active:bg-[#ebedef] transition-colors focus:ring-2 focus:ring-[#0969da] outline-none">
                                                <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button type="button" onClick={handleCaptchaSubmit} className="w-full py-1.5 border border-[#d0d7de] rounded-md text-[#0969da] font-medium text-[13px] hover:bg-[#f6f8fa] active:bg-[#ebedef] transition-colors mt-2 mb-1 cursor-pointer">
                                    Submit
                                </button>

                                <div className="text-[9px] text-[#656d76] mb-3 break-all text-center font-mono">
                                    2951899fdea69c866.B81721/104
                                </div>

                                <div className="flex justify-between px-6 pt-1 border-t border-[#d0d7de]/50">
                                    <button type="button" className="flex flex-col items-center text-[11px] text-[#656d76] hover:text-[#24292f] transition-colors">
                                        <svg className="w-5 h-5 mb-0.5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 3a9 9 0 0 0-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1c0-3.87 3.13-7 7-7s7 3.13 7 7v1h-4v8h4c1.1 0 2-.9 2-2v-7a9 9 0 0 0-9-9z"></path>
                                        </svg>
                                        Audio
                                    </button>
                                    <button type="button" onClick={() => setRotation(180)} className="flex flex-col items-center text-[11px] text-[#656d76] hover:text-[#24292f] transition-colors">
                                        <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Restart
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#161b22] border border-[#30363d] rounded-[10px] p-4 flex flex-col items-center justify-center shadow-lg animate-in zoom-in duration-300 h-[100px]">
                                <div className="w-10 h-10 bg-[#238636] rounded-full flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(35,134,54,0.3)] text-white">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-[#e6edf3] font-semibold text-sm">Account Verified</span>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !captchaVerified}
                        className="w-full flex justify-center py-2 px-4 shadow-[0_0_transparent,0_0_transparent,0_1px_rgba(27,31,36,0.12)] border border-[rgba(240,246,252,0.1)] rounded-md text-sm font-semibold text-white bg-[#238636] hover:bg-[#2ea043] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ea043] disabled:opacity-50 disabled:bg-[#238636] disabled:border-transparent transition-colors mt-8"
                    >
                        {isLoading ? "Sending email..." : "Send password reset email"}
                    </button>
                </form>
            </div>

        </div>
    );
};

export default ForgotPassword;


