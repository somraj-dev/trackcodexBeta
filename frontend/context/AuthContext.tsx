import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { profileService } from "../services/activity/profile";
import { auth, isFirebaseConfigured } from "../lib/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from "firebase/auth";
import { apiInstance } from "../services/infra/api";

interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  avatar?: string;
  role: string;
  bio?: string;
  company?: string;
  location?: string;
  website?: string;
  followers?: number;
  following?: number;
  createdAt?: string;
  profileReadme?: string;
  resumeUrl?: string;
  resumeFilename?: string;
  resumeUploadedAt?: string;
  showResume?: boolean;
  showReadme?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, csrfToken: string) => void;
  logout: () => void;
  csrfToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const api = apiInstance;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Sync CSRF token to localStorage for the axios interceptor in api.ts
  useEffect(() => {
    if (csrfToken) {
      localStorage.setItem("trackcodex_csrf_token", csrfToken);
    } else {
      localStorage.removeItem("trackcodex_csrf_token");
    }
  }, [csrfToken]);

  // Firebase Auth Listener
  useEffect(() => {
    let isMounted = true;

    // Safety net: Force loading to false after 10 seconds
    const loadingTimeout = setTimeout(() => {
      if (isMounted && isLoading) {
        console.warn("[AuthContext] Auth initialization timed out after 10s");
        setIsLoading(false);
      }
    }, 10000);

    // If Firebase isn't configured (no env keys), bypass the listener entirely
    if (!isFirebaseConfigured) {
      console.warn("Bypassing Firebase Auth Context listener - Missing API Keys");
      if (isMounted) setIsLoading(false);
      return;
    }

    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!isMounted) return;

      if (firebaseUser) {
        // Map Firebase user to our User interface
        const mappedUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          username: firebaseUser.displayName?.replace(/\s+/g, "").toLowerCase() || "",
          name: firebaseUser.displayName || "",
          avatar: firebaseUser.photoURL || "",
          role: "user",
        };
        setUser(mappedUser);
        profileService.initFromAuth(mappedUser);

        // Sync user to PostgreSQL backend immediately (using apiInstance for auto-token)
        try {
          apiInstance.post("/auth/sync").then((res) => {
            if (res.data?.csrfToken && isMounted) {
              setCsrfToken(res.data.csrfToken);
            }
          }).catch((err) => console.error("Failed to sync user to database:", err));

          // Check provider data for GitHub/Google
          for (const providerData of firebaseUser.providerData) {
            if (providerData.providerId === "github.com") {
              const ghUsername = providerData.displayName || "";
              if (ghUsername) {
                localStorage.setItem("trackcodex_github_username", ghUsername);
              }
              // Persist to backend
              apiInstance.post("/integrations/connect", { provider: "github", providerUsername: ghUsername }).catch(() => { });
            }
          }
        } catch {
          // Non-critical
        }
      } else {
        setUser(null);
        profileService.clearProfile();
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, []);

  const login = (userData: User, token: string) => {
    setUser(userData);
    setCsrfToken(token);
    profileService.initFromAuth(userData);
  };

  const logout = async () => {
    try {
      // Best effort backend session termination
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Backend logout failed", err);
    } finally {
      // Guarantee local Firebase session is destroyed NO MATTER WHAT
      try {
        await firebaseSignOut(auth);
      } catch (fbErr) {
        console.error("Firebase logout failed", fbErr);
      }

      setUser(null);
      setCsrfToken(null);
      localStorage.removeItem("trackcodex_github_username");
      localStorage.removeItem("redirect_after_login");
      profileService.clearProfile();
      navigate("/", { replace: true }); // Changed from window.location.href to navigate
    }
  };

  // Handle redirect after login
  useEffect(() => {
    if (user && !isLoading) {
      // Read the intended destination or default to home
      const rawPath = localStorage.getItem("redirect_after_login") || "/dashboard/home";
      localStorage.removeItem("redirect_after_login");

      // Safety check: ensure we don't redirect back to auth related pages
      const isAuthPath = rawPath.startsWith("/login") ||
        rawPath.startsWith("/signup") ||
        rawPath.startsWith("/logout") ||
        rawPath.startsWith("/auth");

      const redirectPath = isAuthPath ? "/dashboard/home" : rawPath;

      // Redirect safely replacing the auth URL in history
      navigate(redirectPath, { replace: true });
    }
  }, [user, isLoading, navigate]); // Added user and isLoading to dependencies

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        csrfToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

