import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { auth, googleProvider, githubProvider } from "../../lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup, fetchSignInMethodsForEmail, GithubAuthProvider, linkWithCredential } from "firebase/auth";

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Intercept desktop app handoff parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("source") === "desktop") {
      localStorage.setItem("redirect_after_login", "/auth/desktop-login");
    }
  }, []);

  // Safety net: If auth state becomes true, redirect away from login
  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = localStorage.getItem("redirect_after_login") || "/";
      localStorage.removeItem("redirect_after_login");
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // Auth state change is handled by onAuthStateChanged in AuthContext
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        console.error(err);
        setError(err.message || "Failed to initialize Google login");
      }
      setIsLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, githubProvider);
      // Auth state change is handled by onAuthStateChanged in AuthContext
    } catch (error: any) {
      if (error.code === 'auth/account-exists-with-different-credential' || (error.message && error.message.includes('account-exists-with-different-credential'))) {
        navigate("/auth/resolve-conflict", {
          state: {
            email: error.customData?.email || error.email,
            existingProvider: 'google.com' // Usually Google in this context 
          }
        });
        return;
      }
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        console.error(error);
        setError(error.message || "Failed to initialize GitHub login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const loginEmail = username.includes('@') ? username : null;

      if (!loginEmail) {
        throw new Error("Please use your email address to sign in.");
      }

      await signInWithEmailAndPassword(auth, loginEmail, password);

      // State update is handled by onAuthStateChanged in AuthContext
      const redirectPath = localStorage.getItem("redirect_after_login") || "/";
      localStorage.removeItem("redirect_after_login");
      navigate(redirectPath);
    } catch (err: any) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Invalid username/email or password");
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
    <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mt-6">
        {/* TrackCodex Logo imitating the GitHub icon placement */}
        <div className="mx-auto h-12 w-12 bg-white rounded-full flex items-center justify-center filter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] mb-6">
          <svg className="w-8 h-8 text-[#0d1117]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zm0 14.5l-10-5v5l10 5 10-5v-5l-10 5z" />
          </svg>
        </div>
        <h2 className="mt-6 text-center text-[24px] font-light tracking-tight text-[#e6edf3] mb-4">
          Sign in to TrackCodex
        </h2>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-[340px]">
        {error && (
          <div className="p-4 mb-4 rounded-md bg-[rgba(248,81,73,0.1)] border border-[rgba(248,81,73,0.4)] text-[#ff7b72] text-sm flex items-center justify-between animate-in fade-in zoom-in duration-200">
            {error}
            <button onClick={() => setError("")} className="text-[#ff7b72] hover:text-[#ff9892] focus:outline-none transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
          </div>
        )}

        <div className="bg-[#161b22] py-4 px-4 shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-[#30363d] rounded-lg sm:px-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#e6edf3]">
                Username or email address
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="appearance-none block w-full px-3 py-1.5 border border-[#30363d] rounded-md shadow-sm placeholder-[#8b949e] focus:outline-none focus:ring-[#2f81f7] focus:border-[#2f81f7] sm:text-sm bg-[#0d1117] text-[#e6edf3] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mt-4">
                <label className="block text-sm font-medium text-[#e6edf3]">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-[#2f81f7] hover:underline transition-colors font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-1.5 border border-[#30363d] rounded-md shadow-sm placeholder-[#8b949e] focus:outline-none focus:ring-[#2f81f7] focus:border-[#2f81f7] sm:text-sm bg-[#0d1117] text-[#e6edf3] transition-colors pr-10"
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-1.5 px-4 border border-[rgba(240,246,252,0.1)] rounded-md shadow-sm text-sm font-medium text-white bg-[#238636] hover:bg-[#2ea043] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ea043] disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          <div className="mt-5">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#30363d]"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-[#161b22] text-[#8b949e]">or</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex justify-center items-center py-1.5 px-4 border border-[#30363d] rounded-md shadow-sm text-sm font-medium text-[#c9d1d9] bg-[#21262d] hover:bg-[#30363d] hover:border-[#8b949e] focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-[18px] h-[18px] mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>

              <button
                type="button"
                onClick={handleGithubLogin}
                disabled={isLoading}
                className="w-full flex justify-center items-center py-1.5 px-4 border border-[#30363d] rounded-md shadow-sm text-sm font-medium text-[#c9d1d9] bg-[#21262d] hover:bg-[#30363d] hover:border-[#8b949e] focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-[18px] h-[18px] mr-2 text-[#c9d1d9]" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                Continue with GitHub
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-sm">
            <p className="text-[#8b949e]">
              <span className="mr-1 py-4 border border-transparent">
                New to TrackCodex?{" "}
                <Link to="/signup" className="text-[#2f81f7] hover:underline">
                  Create an account
                </Link>
              </span>
            </p>
          </div>
        </div>
      </div>

      <footer className="mt-16 py-8 pb-16 text-center">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[12px] text-[#8b949e] px-4 max-w-3xl mx-auto">
          <a href="#" className="hover:text-[#2f81f7] hover:underline transition-colors">Terms</a>
          <a href="#" className="hover:text-[#2f81f7] hover:underline transition-colors">Privacy</a>
          <a href="#" className="hover:text-[#2f81f7] hover:underline transition-colors">Docs</a>
          <a href="#" className="hover:text-[#2f81f7] hover:underline transition-colors">Contact TrackCodex Support</a>
          <a href="#" className="hover:text-[#2f81f7] hover:underline transition-colors">Manage cookies</a>
          <a href="#" className="hover:text-[#2f81f7] hover:underline transition-colors">Do not share my personal information</a>
        </div>
      </footer>
    </div>
  );
};

export default Login;
