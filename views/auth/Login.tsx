import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, api } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Safety net: If auth state becomes true (e.g. from onAuthStateChange),
  // redirect away from login immediately
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback/google`,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to initialize Google login");
      setIsLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback/github`,
          queryParams: {
            prompt: 'consent',
          },
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to initialize GitHub login");
      setIsLoading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. Sign in with Supabase
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: username.includes('@') ? username : `${username}@manual-sync.local`, // Fallback logic for username
        password,
      });

      if (authError) {
        if (authError.message === "Invalid login credentials") {
          throw new Error("Invalid username/email or password");
        }
        throw authError;
      }

      // 2. State update is handled by onAuthStateChange in AuthContext
      // The useEffect above will catch isAuthenticated becoming true and redirect

      // 3. Also try direct redirect as a fast path
      const redirectPath = localStorage.getItem("redirect_after_login") || "/dashboard/home";
      localStorage.removeItem("redirect_after_login");
      navigate(redirectPath);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen font-display">
      {/* Left Panel - Dark & Artistic */}
      <div className="hidden lg:flex w-[45%] bg-gh-bg flex-col justify-center items-center relative overflow-hidden p-12 text-gh-text-secondary">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10 max-w-lg text-center">
          <h1 className="text-5xl font-bold mb-6 tracking-tight text-white leading-tight">
            Welcome back
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              to the future
            </span>
          </h1>
          <p className="text-lg text-gray-400 mb-12">
            Secure access to your TrackCodex workspace. Continue building what
            matters.
          </p>

          <div className="relative w-full aspect-square max-w-md mx-auto">
            {/* 3D Mascot Illustration */}
            <img
              src="/login_illu.png"
              alt="Login Security"
              className="w-full h-full object-contain drop-shadow-2xl animate-[float_6s_ease-in-out_infinite]"
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Light & Clean Form */}
      <div className="flex-1 bg-white flex flex-col justify-center items-center p-6 lg:p-12 text-gray-900">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Sign in to TrackCodex
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="flex items-center justify-center w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all bg-white text-gray-700 font-medium font-sans shadow-sm hover:shadow-md h-[50px]"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                className="w-5 h-5 mr-3"
                alt="Google"
              />
              Google
            </button>
            <button
              type="button"
              onClick={handleGithubLogin}
              disabled={isLoading}
              className="flex items-center justify-center w-full px-4 py-3 bg-[#24292e] hover:bg-[#1b1f23] text-white rounded-lg focus:ring-4 focus:ring-gray-300 transition-all font-medium font-sans shadow-lg hover:shadow-xl h-[50px]"
            >
              <svg
                className="w-5 h-5 mr-3"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              GitHub
            </button>
          </div>

          {/* DEV ONLY: Quick Login */}
          {import.meta.env.MODE === "development" && (
            <button
              onClick={async () => {
                try {
                  setIsLoading(true);
                  const res = await api.post("/auth/dev-login");
                  login(res.data.user, res.data.csrfToken);
                  const redirectPath =
                    localStorage.getItem("redirect_after_login") ||
                    "/dashboard/home";
                  localStorage.removeItem("redirect_after_login");
                  navigate(redirectPath);
                } catch (err: any) {
                  console.error("Dev login error:", err);
                  alert(
                    "Dev Login Failed: " +
                    (err.response?.data?.error ||
                      err.message ||
                      "Unknown error"),
                  );
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              type="button"
              className="w-full mt-3 px-4 py-3 border border-yellow-400 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors font-bold shadow-sm flex items-center justify-center"
            >
              ⚡ Quick Login (Dev Only)
            </button>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500 font-medium">
                or
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Username or Email Address
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gh-text-secondary">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:text-blue-500 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group/input">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gh-text-secondary group-focus-within/input:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">
                      lock
                    </span>
                  </span>
                  <input
                    type="password"
                    name="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gh-bg border border-gh-border rounded-md text-sm text-gh-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm border border-red-200 text-center">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1F2937] hover:bg-black text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processing..." : "Sign in"}
              </button>
            </div>
          </form>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              New to TrackCodex?{" "}
              <Link
                to="/signup"
                className="text-blue-600 font-semibold hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
