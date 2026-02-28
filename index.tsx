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
          style={{
            padding: "2rem",
            color: isChunkError ? "#f0f0f0" : "#ff4444",
            backgroundColor: isChunkError ? "#0a0a0a" : "#1a0000",
            height: "100vh",
            fontFamily: "monospace",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isChunkError ? (
            <>
              <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
                Something went wrong
              </h1>
              <p style={{ opacity: 0.6, marginBottom: "1.5rem", textAlign: "center", maxWidth: "400px" }}>
                A new version was deployed. Please reload to get the latest update.
              </p>
              <button
                onClick={() => {
                  sessionStorage.removeItem("chunk_reload_attempted");
                  window.location.reload();
                }}
                style={{
                  padding: "0.75rem 2rem",
                  backgroundColor: "#fff",
                  color: "#000",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                }}
              >
                Reload Application
              </button>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
                Application Crashed
              </h1>
              <pre style={{ whiteSpace: "pre-wrap" }}>
                {this.state.error?.toString()}
              </pre>
              {import.meta.env.DEV && (
                <pre style={{ marginTop: "1rem", opacity: 0.7 }}>
                  {this.state.error?.stack}
                </pre>
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
