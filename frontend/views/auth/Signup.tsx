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
    <div className="flex flex-1 w-full bg-[#f6f8fa] font-sans overflow-hidden">
      {/* Left Panel - Information & Code Snippet */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-center p-16 xl:p-24 overflow-hidden">
        <div className="relative z-10 w-full max-w-lg">
          <h1 className="text-[64px] font-bold text-gray-900 mb-6 tracking-[-0.03em] leading-[1.05]">
            Create your <br />
            free account
          </h1>
          <p className="text-[#636c76] text-xl mb-12 leading-relaxed max-w-md font-normal">
            Build. Collaborate. Ship with confidence for Build. Collaborate. Ship with confidence. TrackCodex turns your ideas into production ready code.
          </p>

          {/* Account Configuration Code Snippet */}
          <div className="bg-[#fefefe] border border-[#d0d7de] rounded-xl p-6 shadow-sm relative group transition-all hover:shadow-md max-w-sm">
            <div className="flex items-center gap-2 mb-4 text-[#57606a] font-medium text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
              </svg>
              Account Configuration
            </div>
            <div className="font-mono text-[13px] leading-6 border-t border-gray-100 pt-4">
              <p className="text-gray-900">user_config &#123;</p>
              <p className="pl-4"><span className="text-[#0550ae]">method</span> = <span className="text-[#0a3069]">"signup"</span></p>
              <p className="pl-4"><span className="text-[#0550ae]">profile_fields</span> = <span className="text-[#0a3069]">["email", "username", "location"]</span></p>
              <p className="pl-4"><span className="text-[#0550ae]">default_role</span> = <span className="text-[#0a3069]">"developer"</span></p>
              <p className="text-gray-900">&#125;</p>
            </div>
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-blue-500/5 blur-xl -z-10 group-hover:opacity-100 opacity-0 transition-opacity rounded-xl"></div>
          </div>
        </div>
      </div>

      {/* Right Panel - Centered Form Card */}
      <div className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar py-12 px-6 lg:px-12 items-center justify-center">
        {/* Sign in prompt */}
        <div className="absolute top-8 right-8 text-[13px]">
          <span className="text-gray-500">Already have an account? </span>
          <Link to="/login" className="text-gray-900 font-semibold hover:text-blue-600 transition-all">
            Sign in →
          </Link>
        </div>

        <div className="w-full max-w-[480px] bg-white border border-[#d0d7de] rounded-xl shadow-[0_8px_24px_rgba(140,149,159,0.12)] p-8 lg:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Sign up for TrackCodex
            </h2>

            {/* Social Logins */}
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center px-4 py-[11px] border border-[#d0d7de] rounded-lg bg-white hover:bg-[#f6f8fa] transition-all text-sm font-semibold text-gray-700 shadow-sm"
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
                className="w-full flex items-center justify-center px-4 py-[11px] border border-[#d0d7de] rounded-lg bg-[#24292f] hover:bg-[#1f2328] transition-all text-sm font-semibold text-white shadow-sm"
              >
                <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                Continue with GitHub
              </button>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-[#d0d7de]"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-[11px] font-bold uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-[#d0d7de]"></div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-[13px] border border-red-100 font-medium font-sans">
                {error}
              </div>
            )}

            {verificationSent ? (
              <div className="space-y-6 text-center py-4">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Check your email</h3>
                  <p className="text-[#57606a] text-sm leading-relaxed">
                    Verification link sent to <span className="font-semibold text-gray-900">{email}</span>. Click to activate your account.
                  </p>
                </div>
                <button onClick={handleContinue} className="w-full bg-[#24292f] hover:bg-[#1f2328] text-white font-bold py-3 rounded-lg transition-all shadow-sm">
                  Continue to Dashboard
                </button>
                <button onClick={() => setVerificationSent(false)} className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                  Edit signup details
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#1f2328]">Email*</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`w-full px-3 py-2 border ${isEmailAlreadyInUse ? "border-red-500 ring-1 ring-red-500" : "border-[#d0d7de]"} rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 bg-[#f6f8fa] text-gray-900 font-medium`}
                    placeholder="Enter your email"
                  />
                  {isEmailAlreadyInUse && (
                    <div className="mt-2 text-[12px] text-red-600 font-medium flex items-center gap-1.5 translate-y-0.5">
                      <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      Email already in use. <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#1f2328]">Password*</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-[#d0d7de] rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 bg-[#f6f8fa] text-gray-900 font-medium pr-10"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
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
                  <p className={`text-[11px] font-medium leading-relaxed ${isPasswordValid ? "text-green-600" : "text-[#57606a]"}`}>
                    At least 15 chars OR 8 chars with number & letter.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#1f2328]">Username*</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-[#d0d7de] rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 bg-[#f6f8fa] text-gray-900 font-medium"
                    placeholder="Enter your username"
                  />
                  <p className="text-[11px] text-[#57606a] leading-tight">
                    Must be alphanumeric with single hyphens.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#1f2328]">Your Country/Region*</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountrySelector(!showCountrySelector)}
                      className="w-full px-3 py-[10px] border border-[#d0d7de] rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-[#f6f8fa] text-left text-[14px] flex items-center justify-between font-medium text-gray-900"
                    >
                      <span>{countries.find(c => c.code === country)?.name || country}</span>
                      <svg className={`w-4 h-4 text-gray-500 transition-transform ${showCountrySelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showCountrySelector && (
                      <div className="absolute top-full mt-2 left-0 w-full bg-white border border-[#d0d7de] rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in duration-200 overflow-hidden">
                        <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-[#f6f8fa]">
                          <span className="text-[14px] font-bold text-gray-900">Select Region</span>
                          <button 
                            type="button" 
                            onClick={() => setShowCountrySelector(false)} 
                            title="Close"
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="p-2">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Search regions..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="w-full pl-3 pr-3 py-2 bg-[#f6f8fa] border border-[#d0d7de] rounded-lg text-sm outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="max-h-[220px] overflow-y-auto no-scrollbar py-1">
                          {filteredCountries.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setCountry(c.code);
                                setShowCountrySelector(false);
                                setCountrySearch("");
                              }}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-[#f6f8fa] transition-colors flex items-center justify-between ${country === c.code ? 'bg-blue-50 text-blue-700 font-bold' : 'text-[#1f2328]'}`}
                            >
                              {c.name}
                              {country === c.code && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-[#57606a] leading-tight">
                    Required for compliance.
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#24292f] hover:bg-[#1f2328] text-white font-bold py-[14px] rounded-lg transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-md text-[16px] tracking-tight"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating account...
                      </div>
                    ) : "Create account"}
                  </button>
                </div>

                <p className="text-[12px] text-[#57606a] leading-relaxed pt-2">
                  By signing up, you agree to our <a href="https://docs.trackcodex.com/governance/policies/terms" className="text-blue-600 font-semibold hover:underline">Terms of Service</a> and <a href="https://docs.trackcodex.com/governance/policies/privacy" className="text-blue-600 font-semibold hover:underline">Privacy Statement</a>.
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Floating background blobs for mockup accuracy */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-400 opacity-[0.03] blur-[100px] pointer-events-none"></div>
        <div className="absolute top-24 -left-24 w-64 h-64 bg-purple-400 opacity-[0.02] blur-[80px] pointer-events-none"></div>
      </div>
    </div>
  );
};

export default Signup;


