import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, googleProvider, githubProvider } from "../../lib/firebase";
import { api } from "../../services/infra/api";
import {
  signInWithPopup
} from "firebase/auth";

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("India");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [emailPrefs, setEmailPrefs] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [isEmailAlreadyInUse, setIsEmailAlreadyInUse] = useState(false);

  const countries = [
    { name: "Afghanistan", code: "AF" }, { name: "Albania", code: "AL" }, { name: "Algeria", code: "DZ" },
    { name: "Andorra", code: "AD" }, { name: "Angola", code: "AO" }, { name: "Antigua and Barbuda", code: "AG" },
    { name: "Argentina", code: "AR" }, { name: "Armenia", code: "AM" }, { name: "Australia", code: "AU" },
    { name: "Austria", code: "AT" }, { name: "Azerbaijan", code: "AZ" }, { name: "Bahamas", code: "BS" },
    { name: "Bahrain", code: "BH" }, { name: "Bangladesh", code: "BD" }, { name: "Barbados", code: "BB" },
    { name: "Belarus", code: "BY" }, { name: "Belgium", code: "BE" }, { name: "Belize", code: "BZ" },
    { name: "Benin", code: "BJ" }, { name: "Bhutan", code: "BT" }, { name: "Bolivia", code: "BO" },
    { name: "Bosnia and Herzegovina", code: "BA" }, { name: "Botswana", code: "BW" }, { name: "Brazil", code: "BR" },
    { name: "Brunei", code: "BN" }, { name: "Bulgaria", code: "BG" }, { name: "Burkina Faso", code: "BF" },
    { name: "Burundi", code: "BI" }, { name: "Cabo Verde", code: "CV" }, { name: "Cambodia", code: "KH" },
    { name: "Cameroon", code: "CM" }, { name: "Canada", code: "CA" }, { name: "Central African Republic", code: "CF" },
    { name: "Chad", code: "TD" }, { name: "Chile", code: "CL" }, { name: "China", code: "CN" },
    { name: "Colombia", code: "CO" }, { name: "Comoros", code: "KM" }, { name: "Congo", code: "CG" },
    { name: "Costa Rica", code: "CR" }, { name: "Croatia", code: "HR" }, { name: "Cuba", code: "CU" },
    { name: "Cyprus", code: "CY" }, { name: "Czechia", code: "CZ" }, { name: "Denmark", code: "DK" },
    { name: "Djibouti", code: "DJ" }, { name: "Dominican Republic", code: "DO" }, { name: "Ecuador", code: "EC" },
    { name: "Egypt", code: "EG" }, { name: "El Salvador", code: "SV" }, { name: "Equatorial Guinea", code: "GQ" },
    { name: "Eritrea", code: "ER" }, { name: "Estonia", code: "EE" }, { name: "Eswatini", code: "SZ" },
    { name: "Ethiopia", code: "ET" }, { name: "Fiji", code: "FJ" }, { name: "Finland", code: "FI" },
    { name: "France", code: "FR" }, { name: "Gabon", code: "GA" }, { name: "Gambia", code: "GM" },
    { name: "Georgia", code: "GE" }, { name: "Germany", code: "DE" }, { name: "Ghana", code: "GH" },
    { name: "Greece", code: "GR" }, { name: "Grenada", code: "GD" }, { name: "Guatemala", code: "GT" },
    { name: "Guinea", code: "GN" }, { name: "Guinea-Bissau", code: "GW" }, { name: "Guyana", code: "GY" },
    { name: "Haiti", code: "HT" }, { name: "Honduras", code: "HN" }, { name: "Hungary", code: "HU" },
    { name: "Iceland", code: "IS" }, { name: "India", code: "IN" }, { name: "Indonesia", code: "ID" },
    { name: "Iran", code: "IR" }, { name: "Iraq", code: "IQ" }, { name: "Ireland", code: "IE" },
    { name: "Israel", code: "IL" }, { name: "Italy", code: "IT" }, { name: "Jamaica", code: "JM" },
    { name: "Japan", code: "JP" }, { name: "Jordan", code: "JO" }, { name: "Kazakhstan", code: "KZ" },
    { name: "Kenya", code: "KE" }, { name: "Kiribati", code: "KI" }, { name: "Kuwait", code: "KW" },
    { name: "Kyrgyzstan", code: "KG" }, { name: "Laos", code: "LA" }, { name: "Latvia", code: "LV" },
    { name: "Lebanon", code: "LB" }, { name: "Lesotho", code: "LS" }, { name: "Liberia", code: "LR" },
    { name: "Libya", code: "LY" }, { name: "Liechtenstein", code: "LI" }, { name: "Lithuania", code: "LT" },
    { name: "Luxembourg", code: "LU" }, { name: "Madagascar", code: "MG" }, { name: "Malawi", code: "MW" },
    { name: "Malaysia", code: "MY" }, { name: "Maldives", code: "MV" }, { name: "Mali", code: "ML" },
    { name: "Malta", code: "MT" }, { name: "Marshall Islands", code: "MH" }, { name: "Mauritania", code: "MR" },
    { name: "Mauritius", code: "MU" }, { name: "Mexico", code: "MX" }, { name: "Micronesia", code: "FM" },
    { name: "Moldova", code: "MD" }, { name: "Monaco", code: "MC" }, { name: "Mongolia", code: "MN" },
    { name: "Montenegro", code: "ME" }, { name: "Morocco", code: "MA" }, { name: "Mozambique", code: "MZ" },
    { name: "Myanmar", code: "MM" }, { name: "Namibia", code: "NA" }, { name: "Nauru", code: "NR" },
    { name: "Nepal", code: "NP" }, { name: "Netherlands", code: "NL" }, { name: "New Zealand", code: "NZ" },
    { name: "Nicaragua", code: "NI" }, { name: "Niger", code: "NE" }, { name: "Nigeria", code: "NG" },
    { name: "North Korea", code: "KP" }, { name: "North Macedonia", code: "MK" }, { name: "Norway", code: "NO" },
    { name: "Oman", code: "OM" }, { name: "Pakistan", code: "PK" }, { name: "Palau", code: "PW" },
    { name: "Palestine State", code: "PS" }, { name: "Panama", code: "PA" }, { name: "Papua New Guinea", code: "PG" },
    { name: "Paraguay", code: "PY" }, { name: "Peru", code: "PE" }, { name: "Philippines", code: "PH" },
    { name: "Poland", code: "PL" }, { name: "Portugal", code: "PT" }, { name: "Qatar", code: "QA" },
    { name: "Romania", code: "RO" }, { name: "Russia", code: "RU" }, { name: "Rwanda", code: "RW" },
    { name: "Samoa", code: "WS" }, { name: "San Marino", code: "SM" }, { name: "Sao Tome and Principe", code: "ST" },
    { name: "Saudi Arabia", code: "SA" }, { name: "Senegal", code: "SN" }, { name: "Serbia", code: "RS" },
    { name: "Seychelles", code: "SC" }, { name: "Sierra Leone", code: "SL" }, { name: "Singapore", code: "SG" },
    { name: "Slovakia", code: "SK" }, { name: "Slovenia", code: "SI" }, { name: "Solomon Islands", code: "SB" },
    { name: "Somalia", code: "SO" }, { name: "South Africa", code: "ZA" }, { name: "South Korea", code: "KR" },
    { name: "South Sudan", code: "SS" }, { name: "Spain", code: "ES" }, { name: "Sri Lanka", code: "LK" },
    { name: "Sudan", code: "SD" }, { name: "Suriname", code: "SR" }, { name: "Sweden", code: "SE" },
    { name: "Switzerland", code: "CH" }, { name: "Syria", code: "SY" }, { name: "Tajikistan", code: "TJ" },
    { name: "Tanzania", code: "TZ" }, { name: "Thailand", code: "TH" }, { name: "Timor-Leste", code: "TL" },
    { name: "Togo", code: "TG" }, { name: "Tonga", code: "TO" }, { name: "Trinidad and Tobago", code: "TT" },
    { name: "Tunisia", code: "TN" }, { name: "Turkey", code: "TR" }, { name: "Turkmenistan", code: "TM" },
    { name: "Tuvalu", code: "TV" }, { name: "Uganda", code: "UG" }, { name: "Ukraine", code: "UA" },
    { name: "United Arab Emirates", code: "AE" }, { name: "United Kingdom", code: "GB" }, { name: "United States", code: "US" },
    { name: "Uruguay", code: "UY" }, { name: "Uzbekistan", code: "UZ" }, { name: "Vanuatu", code: "VU" },
    { name: "Vatican City", code: "VA" }, { name: "Venezuela", code: "VE" }, { name: "Vietnam", code: "VN" },
    { name: "Yemen", code: "YE" }, { name: "Zambia", code: "ZM" }, { name: "Zimbabwe", code: "ZW" }
  ];

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Password validation logic
  const passwordCriteria = {
    minLength: password.length >= 15,
    complex: password.length >= 8 && /[0-9]/.test(password) && /[a-z]/.test(password)
  };
  const isPasswordValid = passwordCriteria.minLength || passwordCriteria.complex;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      if (firebaseError.code !== 'auth/popup-closed-by-user' && firebaseError.code !== 'auth/cancelled-popup-request') {
        console.error(err);
        setError(firebaseError.message || "Failed to initialize Google login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, githubProvider);
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      if (firebaseError.code === 'auth/account-exists-with-different-credential') {
        navigate("/auth/resolve-conflict", {
          state: {
            email: (firebaseError as any).customData?.email || (firebaseError as any).email,
            existingProvider: 'google.com'
          }
        });
        return;
      }
      if (firebaseError.code !== 'auth/popup-closed-by-user' && firebaseError.code !== 'auth/cancelled-popup-request') {
        console.error(err);
        setError(firebaseError.message || "Failed to initialize GitHub login");
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
      // 1. Backend Registration (Syncs with Prisma and handles Firebase creation)
      try {
        await api.auth.register({
          email,
          password,
          name: username,
          username,
          country,
          emailPreferences: emailPrefs
        });
      } catch (apiErr: any) {
        // If Axios error has a response from the backend
        if (apiErr.response && apiErr.response.data) {
          throw new Error(apiErr.response.data.message || apiErr.response.data.error || "Signup failed");
        }
        // If there was no response, it's a network error (CORS, offline, server down)
        console.error("Signup network error:", apiErr);
        throw new Error("Unable to connect to the TrackCodex server. Please ensure you are connected to the internet and the backend is running.");
      }

      // 2. Success - Verification email is sent by backend via Resend
      setVerificationSent(true);

      // 3. Redirect to onboarding after a short delay
      setTimeout(() => {
        navigate("/onboarding");
      }, 2000);
    } catch (error: unknown) {
      console.error("Signup validation error:", error);
      const err = error as Error;

      if (err.message.includes("Email already registered") || err.message.includes("auth/email-already-in-use") || err.message.includes("taken")) {
        setIsEmailAlreadyInUse(true);
        setError(""); // Clear general error
      } else if (err.message.includes("Failed to fetch") || err.message.includes("Unable to connect") || err.message === "Network Error") {
        setError("Unable to connect to the TrackCodex server. Please ensure you are connected to the internet and the backend is running.");
      } else {
        setError(err.message || "Signup failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    navigate("/dashboard/home");
  };

  return (
    <div className="flex min-h-screen lg:h-screen bg-white font-sans">
      {/* Left Panel - Exact GitHub Style Dark Panel */}
      <div className="hidden lg:flex w-1/2 bg-[#0d1117] relative flex-col justify-center p-16 overflow-hidden">
        {/* Subtle space-like background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,_#161b22_0%,_#0d1117_100%)]"></div>
          <div className="absolute inset-0 opacity-20 bg-[url('https://github.githubassets.com/assets/hero-drone-blur-eb6a4c11.png')] bg-cover"></div>
        </div>

        <div className="relative z-10 w-full max-w-lg">
          <h1 className="text-6xl font-extrabold text-white mb-8 tracking-tight">
            Create your <br />
            free account
          </h1>
          <p className="text-gray-400 text-xl mb-10 leading-relaxed max-w-md font-medium">
            Explore TrackCodex's core features for individuals and organizations. Code, collaborate, and ship faster.
          </p>

          <button className="flex items-center text-white font-semibold hover:text-gray-300 transition-colors group">
            See what's included
            <svg className="w-5 h-5 ml-2 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Floating Mascots - Using the exact generated image */}
          <div className="mt-16 relative">
            <img
              src="/auth_mascots.png"
              alt="TrackCodex Mascots"
              className="w-full max-w-sm object-contain animate-[float_6s_ease-in-out_infinite] filter drop-shadow-[0_0_20px_rgba(255,255,255,0.05)]"
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Exact GitHub Style White Panel */}
      <div className="flex-1 flex flex-col relative bg-white overflow-y-auto no-scrollbar">
        {/* Already have an account link */}
        <div className="absolute top-10 right-10 text-[13px]">
          <span className="text-gray-500">Already have an account? </span>
          <Link to="/login" className="text-gray-900 font-medium hover:text-blue-600 transition-all inline-flex items-center">
            Sign in →
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 lg:py-10 lg:px-16">
          <div className="w-full max-w-[440px] space-y-5">
            <h2 className="text-[26px] font-semibold text-gray-900 tracking-tight">
              Sign up for TrackCodex
            </h2>

            {/* Social Logins - Styled like GitHub */}
            <div className="space-y-3">
              <button
                onClick={handleGoogleLogin}
                title="Continue with Google"
                className="w-full flex items-center justify-center px-4 py-[10px] border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-all text-sm font-semibold text-gray-700 shadow-sm"
              >
                <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
              <button
                onClick={handleGithubLogin}
                title="Continue with GitHub"
                className="w-full flex items-center justify-center px-4 py-[10px] border border-gray-300 rounded-md bg-[#f6f8fa] hover:bg-[#ebedef] transition-all text-sm font-semibold text-gray-900 shadow-sm"
              >
                <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                Continue with GitHub
              </button>
            </div>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-[11px] font-medium uppercase tracking-widest">or</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm border border-red-100 animate-in fade-in zoom-in duration-200">
                {error}
              </div>
            )}

            {verificationSent ? (
              <div className="space-y-5 text-center animate-in slide-in-from-bottom-4 duration-300">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Check your email</h3>
                <p className="text-gray-600 leading-relaxed">
                  We sent a verification link to <span className="font-semibold">{email}</span>. <br />Click the link to verify your account.
                </p>
                <button onClick={handleContinue} title="Continue to Dashboard" className="w-full bg-[#24292f] hover:bg-[#1a1e22] text-white font-semibold py-3 rounded-md transition-all shadow-sm">
                  Continue to Dashboard
                </button>
                <button onClick={() => setVerificationSent(false)} title="Edit details" className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">
                  Edit signup details
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Email*</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    title="Enter your email"
                    className={`w-full px-3 py-2 border ${isEmailAlreadyInUse ? "border-red-500 ring-1 ring-red-500" : "border-gray-300"} rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 bg-white text-gray-900 font-medium`}
                    placeholder="Email"
                  />
                  {isEmailAlreadyInUse && (
                    <div className="mt-2 text-[12px] flex items-start gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      <svg className="w-4 h-4 text-red-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      <div className="text-red-600 leading-normal">
                        The email you have provided is already associated with an account. <br />
                        <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link> or <Link to="/forgot-password" className="text-blue-600 hover:underline font-medium">reset your password</Link>.
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Password*</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      title="Enter your password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 bg-white text-gray-900 font-medium pr-10"
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className={`text-[11px] mt-1 leading-relaxed transition-colors duration-200 ${isPasswordValid ? "text-green-600 font-medium" : "text-gray-500"}`}>
                    Password should be at least 15 characters OR at least 8 characters including a number and a lowercase letter.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Username*</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    title="Enter your username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 bg-white text-gray-900 font-medium"
                    placeholder="Username"
                  />
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    Username may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Your Country/Region*</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountrySelector(!showCountrySelector)}
                      className="w-full px-3 py-[9px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-left text-[14px] flex items-center justify-between"
                    >
                      <span>{countries.find(c => c.code === country)?.name || country}</span>
                      <svg className={`w-4 h-4 text-gray-500 transition-transform ${showCountrySelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showCountrySelector && (
                      <div className="absolute bottom-full mb-2 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in duration-200 overflow-hidden">
                        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                          <span className="text-[14px] font-bold text-gray-900">Select Country/Region</span>
                          <button
                            type="button"
                            onClick={() => setShowCountrySelector(false)}
                            title="Close"
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="p-2">
                          <div className="relative">
                            <input
                              autoFocus
                              type="text"
                              placeholder="Search countries..."
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="max-h-[250px] overflow-y-auto no-scrollbar py-1">
                          {filteredCountries.length > 0 ? (
                            filteredCountries.map((c) => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => {
                                  setCountry(c.code);
                                  setShowCountrySelector(false);
                                  setCountrySearch("");
                                }}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${country === c.code ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                              >
                                {c.name}
                                {country === c.code && (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">No countries found</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 leading-tight">
                    For compliance reasons, we're required to collect country information.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-800">Email preferences</label>
                  <div className="flex items-start">
                    <input
                      id="email-prefs"
                      type="checkbox"
                      checked={emailPrefs}
                      onChange={(e) => setEmailPrefs(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="email-prefs" className="ml-3 text-[13px] text-gray-600 leading-tight select-none cursor-pointer">
                      Receive occasional product updates and announcements
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#24292f] hover:bg-[#1a1e22] text-white font-bold py-[12px] rounded-md transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-sm text-[16px]"
                  >
                    {isLoading ? "Creating account..." : "Create account >"}
                  </button>
                </div>

                <div className="space-y-4 pt-4">
                  <p className="text-[12px] text-gray-600 leading-[1.6]">
                    By creating an account, you agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>. For more information about TrackCodex's privacy practices, see the <a href="#" className="text-blue-600 hover:underline">TrackCodex Privacy Statement</a>. We'll occasionally send you account related emails.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
