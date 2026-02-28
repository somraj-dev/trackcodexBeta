import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { profileService } from "../services/profile";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from "firebase/auth";

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

// Create axios instance with credentials support
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Essential for sending Cookies
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

        // Persist OAuth provider tokens to backend (non-blocking)
        try {
          const idToken = await firebaseUser.getIdToken();

          // Check provider data for GitHub/Google
          for (const providerData of firebaseUser.providerData) {
            if (providerData.providerId === "github.com") {
              const ghUsername = providerData.displayName || "";
              if (ghUsername) {
                localStorage.setItem("trackcodex_github_username", ghUsername);
              }
              // Persist to backend (the token was already handled during OAuth flow)
              fetch(`${API_BASE_URL}/integrations/connect`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${idToken}`,
                },
                credentials: "include",
                body: JSON.stringify({ provider: "github", providerUsername: ghUsername }),
              }).catch(() => { });
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

  // Configure axios interceptor to attach Firebase ID token
  useEffect(() => {
    const interceptor = api.interceptors.request.use(async (config) => {
      // CSRF token for state-changing requests
      if (
        ["post", "put", "delete", "patch"].includes(
          config.method?.toLowerCase() || "",
        ) &&
        csrfToken
      ) {
        config.headers["X-CSRF-Token"] = csrfToken;
      }

      // Attach Firebase ID token as Bearer token
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();
          config.headers["Authorization"] = `Bearer ${idToken}`;
        } catch {
          // Token refresh failed — session may have expired
        }
      }

      return config;
    });

    return () => api.interceptors.request.eject(interceptor);
  }, [csrfToken]);

  const login = (userData: User, token: string) => {
    setUser(userData);
    setCsrfToken(token);
    profileService.initFromAuth(userData);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
      await firebaseSignOut(auth);
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setUser(null);
      setCsrfToken(null);
      localStorage.removeItem("trackcodex_github_username");
      profileService.clearProfile();
      window.location.href = "/login";
    }
  };

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
