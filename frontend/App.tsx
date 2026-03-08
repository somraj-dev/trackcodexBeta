import React, { useState, useEffect } from "react";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { RealtimeProvider } from "./contexts/RealtimeContext";
import { MessagingProvider } from "./context/MessagingContext";
import { CookieConsent } from "./components/legal/CookieConsent";
import SplashScreen from "./components/branding/SplashScreen";
import AppRoutes from "./AppRoutes";

// Root-level Error Boundary for deployment updates
class ChunkErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError(error: Error) {
    if (error.message.includes("imported module") || error.message.includes("Importing a module script failed")) return { hasError: true };
    throw error;
  }
  componentDidCatch() {
    const reloadKey = "chunk_reload_" + window.location.pathname;
    if (!sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, "1");
      window.location.reload();
    }
  }
  render() {
    if (this.state.hasError) return (
      <div className="flex h-screen items-center justify-center bg-gh-bg text-gh-text text-center p-8">
        <div>
          <h2 className="text-xl font-bold mb-2">Application Updated</h2>
          <p className="text-gh-text-secondary mb-4">Please reload to get the latest version.</p>
          <button onClick={() => { sessionStorage.clear(); window.location.reload(); }} className="px-4 py-2 bg-primary text-white rounded-md">Reload</button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (typeof (window as any).electron?.onAuthToken === "function") {
      (window as any).electron.onAuthToken(async (token: string) => {
        const { auth } = await import("./lib/firebase");
        const { signInWithCustomToken } = await import("firebase/auth");
        await signInWithCustomToken(auth, token);
      });
    }
  }, []);

  if (isLoading) return <SplashScreen />;

  return (
    <ChunkErrorBoundary>
      <React.Suspense fallback={<SplashScreen />}>
         <AppRoutes isAuthenticated={isAuthenticated} />
         <CookieConsent />
      </React.Suspense>
    </ChunkErrorBoundary>
  );
};

const AppWithProviders = () => {
  const { user, isAuthenticated } = useAuth();
  return (
    <NotificationProvider>
      {isAuthenticated && user ? (
        <RealtimeProvider userId={user.id}>
          <MessagingProvider><AppContent /></MessagingProvider>
        </RealtimeProvider>
      ) : (
        <AppContent />
      )}
    </NotificationProvider>
  );
};

const App = () => {
  const isElectron = window.navigator.userAgent.toLowerCase().includes('electron') || window.location.protocol === 'file:';
  const Router = isElectron ? HashRouter : BrowserRouter;

  useEffect(() => {
    if (!isElectron && window.location.hash.startsWith('#/')) {
      const cleanPath = window.location.hash.substring(2);
      window.history.replaceState(null, '', `/${cleanPath}`);
    }
  }, [isElectron]);

  return (
    <ThemeProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider><AppWithProviders /></AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
