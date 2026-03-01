import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { auth, googleProvider, githubProvider } from "../../lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup, GithubAuthProvider, linkWithCredential } from "firebase/auth";

export default function Login() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // To mimic the Vercel flow exactly:
  // Usually Vercel has a split flow: Enter Email -> Next screen -> Enter Password.
  // For simplicity and immediate compatibility, we'll keep both fields or show password on next state!
  const [showPassword, setShowPassword] = useState(false);

  // Safety net: If auth state becomes true, redirect away from login
  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = localStorage.getItem("redirect_after_login") || "/dashboard/home";
      localStorage.removeItem("redirect_after_login");
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to initialize Google login");
      setIsLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, githubProvider);
    } catch (error: any) {
      if (error.code === 'auth/account-exists-with-different-credential' || (error.message && error.message.includes('account-exists-with-different-credential'))) {
        const pendingAuthCredential = GithubAuthProvider.credentialFromError(error);
        if (pendingAuthCredential) {
          try {
            const result = await signInWithPopup(auth, googleProvider);
            await linkWithCredential(result.user, pendingAuthCredential);
            return;
          } catch (linkingError) {
            console.error("Linking failed:", linkingError);
            setError("Your email is registered with Google. Please click 'Continue with Google' to sign in.");
            setIsLoading(false);
            return;
          }
        }
        setError("Your email is registered with Google. Please click 'Continue with Google' to sign in.");
        setIsLoading(false);
        return;
      }
      console.error(error);
      setError(error.message || "Failed to initialize GitHub login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter an email address");
      return;
    }
    setError("");
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      const redirectPath = localStorage.getItem("redirect_after_login") || "/dashboard/home";
      localStorage.removeItem("redirect_after_login");
      navigate(redirectPath);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Invalid email or password");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email");
      } else {
        setError(err.message || "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]lack font-sans text-white px-4">
      <div className="w-full max-w-[340px] flex flex-col items-center">
        {/* Vercel-like Triangle Logo */}
        <div className="w-12 h-12 border border-[#333] rounded-full flex items-center justify-center mb-8">
          <svg viewBox="0 0 24 24" fill="white" className="w-[22px] h-[22px] pb-[3px]">
            <path d="M12 2L2 22h20L12 2z" />
          </svg>
        </div>

        <h1 className="text-[26px] font-bold mb-3 tracking-tight text-white">Continue with TrackCodex</h1>
        <p className="text-[#a1a1aa] text-sm mb-8 text-center px-4 leading-relaxed">
          Use your email or another service to sign in to TrackCodex
        </p>

        {error && (
          <div className="w-full p-3 mb-6 bg-red-500/10 border border-red-500/30 rounded-md text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <div className="w-full space-y-4">
          {!showPassword ? (
            <form onSubmit={handleEmailContinue} className="w-full flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                className="w-full px-4 py-[13px] bg-[#0A0A0A]lack border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[#888] focus:ring-1 focus:ring-[#888] hover:border-[#444] transition-all"
                required
              />
              <button
                type="submit"
                className="w-full bg-white text-black font-semibold text-[14.5px] py-[13px] rounded-lg hover:bg-[#e6e6e6] transition-colors"
              >
                Continue with Email
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
              <div className="w-full text-left text-sm text-[#a1a1aa] mb-1">
                Signing in as <span className="text-white">{email}</span>
                <button type="button" onClick={() => setShowPassword(false)} className="ml-2 text-[#0070F3] hover:text-[#3291FF] underline">Edit</button>
              </div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="w-full px-4 py-[13px] bg-[#0A0A0A]lack border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[#888] focus:ring-1 focus:ring-[#888] hover:border-[#444] transition-all"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white text-black font-semibold text-[14.5px] py-[13px] rounded-lg hover:bg-[#e6e6e6] transition-colors disabled:opacity-70 flex items-center justify-center"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                ) : null}
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          {!showPassword && (
            <>
              {/* Vercel invisible separator (just spacing) */}
              <div className="h-2"></div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center bg-[#0A0A0A]lack border border-[#333] rounded-lg py-[13px] text-[14.5px] hover:bg-[#0A0A0A] hover:border-[#444] transition-all text-[#ededed] font-medium"
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-[18px] h-[18px] mr-[10px]" alt="Google" />
                  Continue with Google
                </button>

                <button
                  onClick={handleGithubLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center bg-[#0A0A0A]lack border border-[#333] rounded-lg py-[13px] text-[14.5px] hover:bg-[#0A0A0A] hover:border-[#444] transition-all text-[#ededed] font-medium"
                >
                  <svg className="w-[18px] h-[18px] mr-[10px] fill-white" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  Continue with GitHub
                </button>

                <button
                  type="button"
                  className="w-full flex items-center justify-center bg-[#0A0A0A]lack border border-[#333] rounded-lg py-[13px] text-[14.5px] hover:bg-[#0A0A0A] hover:border-[#444] transition-all text-[#ededed] font-medium"
                >
                  <svg className="w-[18px] h-[18px] mr-[10px] fill-white" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.19 2.31-.88 3.5-.8 1.56.05 2.89.81 3.63 1.93-3.08 1.77-2.6 5.86.34 7.07-.63 1.54-1.47 3.06-2.55 4.02zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  Continue with Apple
                </button>
              </div>
            </>
          )}

          <div className="mt-8 text-center space-y-6 pt-2">
            {!showPassword && (
              <div className="text-[14px] font-medium text-[#ededed] hover:text-white cursor-pointer transition-colors block tracking-wide">
                Show other options
              </div>
            )}

            <div className="text-[#a1a1aa] text-[14px]">
              Don't have an account? <Link to="/signup" className="text-[#0070F3] hover:text-[#3291FF] transition-colors ml-1 font-medium">Sign Up</Link>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Links */}
      <div className="absolute bottom-6 w-full text-center flex justify-center gap-6 text-[#888888] text-[13px]">
        <Link to="/legal/terms" className="hover:text-white transition-colors">Terms</Link>
        <Link to="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
      </div>
    </div>
  );
}
