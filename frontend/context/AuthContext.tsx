import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  hasSettled: boolean;
  login: (userData: User, csrfToken: string) => void;
  logout: () => void;
  csrfToken: string | null;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const api = apiInstance;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<{
    user: User | null;
    isLoading: boolean;
    hasSettled: boolean;
  }>(() => {
    // Restore from localStorage on first render
    try {
      const stored = localStorage.getItem("trackcodex_user");
      const user = stored ? (JSON.parse(stored) as User) : null;
      return {
        user,
        isLoading: true,
        hasSettled: false
      };
    } catch {
      return { user: null, isLoading: true, hasSettled: false };
    }
  });

  const [csrfToken, setCsrfToken] = useState<string | null>(
    () => localStorage.getItem("trackcodex_csrf_token") || null
  );
  const navigate = useNavigate();

  const { user, isLoading, hasSettled } = authState;
  

  // Sync CSRF token to localStorage
  useEffect(() => {
    if (csrfToken) {
      localStorage.setItem("trackcodex_csrf_token", csrfToken);
    } else {
      localStorage.removeItem("trackcodex_csrf_token");
    }
  }, [csrfToken]);

  console.log("[DEBUG] AuthProvider render", { 
    userId: user?.id, 
    isLoading, 
    hasSettled,
    isFirebaseConfigured
  });

  const hasInitializedAuth = useRef(false);

  useEffect(() => {
    if (hasInitializedAuth.current) return;
    hasInitializedAuth.current = true;

    let isMounted = true;

    // Safety net: Force loading to false after 10 seconds
    const loadingTimeout = setTimeout(() => {
      if (isMounted && authState.isLoading) {
        console.warn("[AuthContext] Auth initialization timed out after 10s");
        setAuthState(prev => ({ ...prev, isLoading: false, hasSettled: true }));
      }
    }, 10000);

    if (!isFirebaseConfigured) {
      console.warn("Bypassing Firebase Auth Context listener - Missing API Keys");

      const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (isDev && !authState.user) {
        const devUser: User = {
          id: "dev-user-001",
          email: "dev@trackcodex.com",
          username: "devuser",
          name: "Dev User",
          avatar: "https://ui-avatars.com/api/?name=Dev+User&background=6366f1&color=fff",
          role: "admin",
        };
        console.info("[AuthContext] DEV MODE: Auto-logging in as mock user");
        setAuthState({ user: devUser, isLoading: false, hasSettled: true });
        try {
          localStorage.setItem("trackcodex_user", JSON.stringify(devUser));
        } catch { /* ignore */ }
        profileService.initFromAuth(devUser);
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false, hasSettled: true }));
      }
      clearTimeout(loadingTimeout);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!isMounted) return;

      if (firebaseUser) {
        const mappedUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          username: firebaseUser.displayName?.replace(/\s+/g, "").toLowerCase() || "",
          name: firebaseUser.displayName || "",
          avatar: firebaseUser.photoURL || "",
          role: "user",
        };
        
        setAuthState(prev => {
          const isSameUser = prev.user?.id === mappedUser.id;
          if (isSameUser && !prev.isLoading && prev.hasSettled) return prev;
          return {
            user: isSameUser ? prev.user : mappedUser,
            isLoading: false,
            hasSettled: true
          };
        });
        profileService.initFromAuth(mappedUser);

        apiInstance.post("/auth/sync").then((res) => {
          if (res.data?.csrfToken && isMounted) {
            setCsrfToken(res.data.csrfToken);
          }
        }).catch(() => {});
      } else {
        setAuthState(prev => (prev.user === null && !prev.isLoading && prev.hasSettled ? prev : { 
          user: null, 
          isLoading: false, 
          hasSettled: true 
        }));
        profileService.clearProfile();
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, []);

  const login = React.useCallback((userData: User, token: string) => {
    setAuthState({ user: userData, isLoading: false, hasSettled: true });
    setCsrfToken(token);
    try {
      localStorage.setItem("trackcodex_user", JSON.stringify(userData));
    } catch { /* ignore */ }
    profileService.initFromAuth(userData);
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Backend logout failed", err);
    } finally {
      try {
        await firebaseSignOut(auth);
      } catch (fbErr) {
        console.error("Firebase logout failed", fbErr);
      }

      setAuthState({ user: null, isLoading: false, hasSettled: true });
      setCsrfToken(null);
      localStorage.removeItem("trackcodex_user");
      localStorage.removeItem("trackcodex_github_username");
      localStorage.removeItem("redirect_after_login");
      profileService.clearProfile();
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const getIdToken = React.useCallback(async (): Promise<string | null> => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        return await currentUser.getIdToken();
      }
      return localStorage.getItem("trackcodex_auth_token") || null;
    } catch (err) {
      console.error("[AuthContext] Failed to get ID token:", err);
      return null;
    }
  }, []);

  const value = React.useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    hasSettled,
    login,
    logout,
    csrfToken,
    getIdToken,
  }), [user, isLoading, hasSettled, csrfToken, login, logout, getIdToken]);

  return (
    <AuthContext.Provider value={value}>
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

