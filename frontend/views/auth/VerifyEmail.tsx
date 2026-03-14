import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { api } from "../../services/infra/api";

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Verifying your email...");

    const token = searchParams.get("token");
    const userId = searchParams.get("userId");

    useEffect(() => {
        const verify = async () => {
            if (!token || !userId) {
                setStatus("error");
                setMessage("Missing verification token or user ID.");
                return;
            }

            try {
                await api.post("/auth/verify-email/confirm", {
                    token,
                    userId
                });

                setStatus("success");
                setMessage("Your email has been successfully verified! You can now access all features.");
                
                // Auto-redirect after 3 seconds
                setTimeout(() => {
                    navigate("/dashboard/home");
                }, 3000);
            } catch (err: any) {
                console.error("Verification failed:", err);
                setStatus("error");
                setMessage(err.response?.data?.message || "Failed to verify email. The link may be invalid or expired.");
            }
        };

        verify();
    }, [token, userId, navigate]);

    return (
        <div className="min-h-screen bg-[#f6f8fa] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white border border-gh-border rounded-lg p-8 shadow-sm text-center">
                <div className="mb-6">
                    <span className="material-symbols-outlined !text-[48px] text-primary">
                        {status === "loading" ? "sync" : status === "success" ? "verified" : "error"}
                    </span>
                </div>
                
                <h1 className="text-2xl font-bold text-gh-text mb-2">
                    {status === "loading" ? "Verifying Email" : status === "success" ? "Email Verified" : "Verification Failed"}
                </h1>
                
                <p className="text-gh-text-secondary mb-8">
                    {message}
                </p>

                {status === "success" && (
                    <Link 
                        to="/dashboard/home" 
                        className="inline-block bg-primary text-white px-6 py-2 rounded-md font-medium hover:bg-primary-hover transition-colors"
                    >
                        Go to Dashboard
                    </Link>
                )}

                {status === "error" && (
                    <div className="space-y-4">
                        <Link 
                            to="/signup" 
                            className="inline-block bg-primary text-white px-6 py-2 rounded-md font-medium hover:bg-primary-hover transition-colors"
                        >
                            Back to Signup
                        </Link>
                        <br />
                        <Link to="/contact" className="text-sm text-primary hover:underline">
                            Contact Support
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
