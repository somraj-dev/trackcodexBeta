/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_GITHUB_CLIENT_ID: string;
  readonly VITE_API_URL: string;
  /**
   * The URL of the TrackCodex Backend. 
   * WARNING: Do not use "http://localhost:4000" in development 
   * if the backend is Fastify running on 0.0.0.0. Node 18+ prefers IPv6 (::1) 
   * and will fail to resolve the IPv4 Fastify server. 
   * Always use "http://127.0.0.1:4000" instead.
   */
  readonly VITE_BACKEND_URL: string;
  // Add other env vars here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
