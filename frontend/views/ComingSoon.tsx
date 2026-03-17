import React from "react";
import { useNavigate } from "react-router-dom";

const ComingSoon: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex-1 w-full flex flex-col items-center justify-center bg-gh-bg p-6 text-center">
            <div className="max-w-md w-full animate-slide-up">
                {/* Visual element */}
                <div className="relative mb-8 flex justify-center">
                    <div className="size-24 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group">
                        <span className="material-symbols-outlined !text-[48px] animate-bounce">
                            construction
                        </span>
                        {/* Decorative elements */}
                        <div className="absolute -top-2 -right-2 size-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                            <span className="material-symbols-outlined !text-[16px] text-amber-500">warning</span>
                        </div>
                    </div>
                </div>

                <h1 className="text-3xl font-black text-white mb-4 tracking-tight">
                    Under Development
                </h1>
                <p className="text-gh-text-secondary text-base mb-10 leading-relaxed">
                    We're working hard to bring this feature to life. Stay tuned for updates as we continue building the ultimate developer ecosystem!
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto px-6 py-2.5 bg-gh-bg-secondary border border-gh-border text-gh-text hover:text-white hover:border-gh-text-secondary rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white hover:bg-opacity-90 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined !text-[18px]">home</span>
                        Return Home
                    </button>
                </div>

                <div className="mt-16 pt-8 border-t border-gh-border">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#444] mb-3">
                        TrackCodex Ecosystem
                    </p>
                    <div className="flex justify-center gap-4 text-gh-text-secondary/40">
                        <span className="material-symbols-outlined !text-[20px]">terminal</span>
                        <span className="material-symbols-outlined !text-[20px]">code</span>
                        <span className="material-symbols-outlined !text-[20px]">account_tree</span>
                        <span className="material-symbols-outlined !text-[20px]">bolt</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComingSoon;
