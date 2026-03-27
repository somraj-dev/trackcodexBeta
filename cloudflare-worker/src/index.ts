/**
 * Cloudflare Worker — TrackCodex Site Proxy & Deploy API
 * 
 * 1. Proxy: Serves sites from R2 based on subdomain.
 * 2. Deploy: Handles secure file uploads from the backend.
 * 
 * No AWS/S3 protocols used. Pure Cloudflare.
 */

interface Env {
  SITES_BUCKET: R2Bucket;      // R2 binding: trackcodex-sites
  SITE_ROUTING: KVNamespace;   // KV binding: site routing
  DEPLOY_SECRET: string;       // Secret for authorized uploads
  ANALYTICS_ENDPOINT: string;
  ANALYTICS_SECRET: string;
}

interface SiteRouting {
  projectSlug: string;
  deployId: string;
  projectId: string;
}

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json",
};

function getMimeType(path: string): string {
  const ext = "." + path.split(".").pop()?.toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const startTime = Date.now();
    const url = new URL(request.url);
    const hostname = url.hostname;
    const method = request.method;

    // ─── 1. HANDLE DEPLOY UPLOADS (PUT /_deploy/...) ────────────────
    if (url.pathname.startsWith("/_deploy/")) {
      // Check authorization
      const auth = request.headers.get("Authorization");
      if (!auth || auth !== `Bearer ${env.DEPLOY_SECRET}`) {
        return new Response("Unauthorized", { status: 401 });
      }

      if (method === "PUT") {
        // Path format: /_deploy/{projectSlug}/{deployId}/{filePath...}
        const parts = url.pathname.slice(9).split("/");
        const projectSlug = parts[0];
        const deployId = parts[1];
        const filePath = parts.slice(2).join("/");

        if (!projectSlug || !deployId || !filePath) {
          return new Response("Invalid deploy path", { status: 400 });
        }

        const r2Key = `${projectSlug}/${deployId}/${filePath}`;
        const contentType = request.headers.get("Content-Type") || getMimeType(filePath);

        await env.SITES_BUCKET.put(r2Key, request.body, {
          httpMetadata: {
            contentType: contentType,
            cacheControl: filePath.endsWith(".html") 
              ? "public, max-age=0, must-revalidate"
              : "public, max-age=31536000, immutable",
          },
          customMetadata: {
            project: projectSlug,
            deployment: deployId,
          }
        });

        return new Response(`Uploaded ${r2Key}`, { status: 200 });
      }

      return new Response("Method not allowed", { status: 405 });
    }

    // ─── 2. HANDLE SITE SERVING (Proxy) ──────────────────────────────
    
    let routingStr: string | null = null;
    let siteSlug: string | null = null;

    // Check if it's a TrackCodex subdomain or a custom domain
    // (Assume trackcodex.com and trackcodex.app are our base domains)
    const isBaseDomain = hostname.endsWith("trackcodex.com") || hostname.endsWith("trackcodex.app");

    if (isBaseDomain) {
      const parts = hostname.split(".");
      if (parts.length >= 3) {
        siteSlug = parts[0];
        if (!["www", "api", "proxy", "dashboard"].includes(siteSlug)) {
          routingStr = await env.SITE_ROUTING.get(`site:${siteSlug}`);
        }
      }
    } else {
      // It's a custom domain (e.g. example.com or www.example.com)
      let customDomain = hostname;
      if (customDomain.startsWith("www.")) {
        customDomain = customDomain.slice(4);
      }
      routingStr = await env.SITE_ROUTING.get(`domain:${customDomain}`);
    }

    if (!routingStr) {
      if (!isBaseDomain || (siteSlug && !["www", "api", "proxy", "dashboard"].includes(siteSlug))) {
        return new Response("Site not found", { status: 404 });
      }
      return new Response("TrackCodex Hosting Edge", { status: 200 });
    }

    const routing: SiteRouting = JSON.parse(routingStr);
    let path = url.pathname;
    if (path === "/" || path === "") path = "/index.html";

    const r2Key = `${routing.projectSlug}/${routing.deployId}${path}`;
    let object = await env.SITES_BUCKET.get(r2Key);

    // SPA fallback
    if (!object && !path.includes(".")) {
      const fallbackKey = `${routing.projectSlug}/${routing.deployId}/index.html`;
      object = await env.SITES_BUCKET.get(fallbackKey);
    }

    if (!object) return new Response("Not Found", { status: 404 });

    return new Response(object.body, {
      headers: {
        "Content-Type": object.httpMetadata?.contentType || getMimeType(path),
        "Cache-Control": object.httpMetadata?.cacheControl || "public, max-age=0",
        "X-TrackCodex-Deploy": routing.deployId.slice(0, 8),
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};
