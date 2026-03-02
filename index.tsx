import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);

    // Auto-reload on stale chunk errors (happens after new deployments)
    const isChunkError =
      error.message?.includes("Failed to fetch dynamically imported module") ||
      error.message?.includes("Importing a module script failed") ||
      error.message?.includes("error loading dynamically imported module") ||
      error.message?.includes("Loading chunk") ||
      error.name === "ChunkLoadError";

    if (isChunkError) {
      const reloadKey = "chunk_reload_attempted";
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, "true");
        console.log("[ErrorBoundary] Stale chunk detected — reloading...");
        window.location.reload();
        return;
      }
      // Already tried once this session — clear flag and show error
      sessionStorage.removeItem(reloadKey);
    }
  }

  render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.message?.includes("Failed to fetch dynamically imported module") ||
        this.state.error?.message?.includes("Importing a module script failed");

      return (
        <div
          className={`p-8 h-screen font-mono overflow-auto flex flex-col items-center justify-center ${isChunkError ? "text-[#f0f0f0] bg-[#0a0a0a]" : "text-[#ff4444] bg-[#1a0000]"
            }`}
        >
          {isChunkError ? (
            <>
              <h1 className="text-2xl mb-2">Something went wrong</h1>
              <p className="opacity-60 mb-6 text-center max-w-[400px]">
                A new version was deployed. Please reload to get the latest update.
              </p>
              <button
                onClick={() => {
                  sessionStorage.removeItem("chunk_reload_attempted");
                  window.location.reload();
                }}
                className="px-8 py-3 bg-white text-black border-none rounded-lg cursor-pointer font-bold text-sm"
              >
                Reload Application
              </button>
            </>
          ) : (
            <>
              <h1 className="text-2xl mb-4">Application Crashed</h1>
              <pre className="whitespace-pre-wrap">{this.state.error?.toString()}</pre>
              {import.meta.env.DEV && (
                <pre className="mt-4 opacity-70">{this.state.error?.stack}</pre>
              )}
            </>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
