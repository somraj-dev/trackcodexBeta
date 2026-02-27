/**
 * Cloudflare Worker: Supabase Reverse Proxy
 * 
 * Routes all requests from supabase-proxy.quantaforze.com → rpwwyhrallublnejtgqt.supabase.co
 * This bypasses ISP-level blocking of supabase.co in India.
 * 
 * Deploy: Use Cloudflare Dashboard → Workers & Pages → Create Worker
 * Then add a Custom Domain: supabase-proxy.quantaforze.com
 */

const SUPABASE_URL = "https://rpwwyhrallublnejtgqt.supabase.co";

export default {
    async fetch(request) {
        const url = new URL(request.url);

        // Build the target Supabase URL preserving path and query params
        const targetUrl = `${SUPABASE_URL}${url.pathname}${url.search}`;

        // Clone the request headers
        const headers = new Headers(request.headers);

        // Set the correct Host header for Supabase
        headers.set("Host", "rpwwyhrallublnejtgqt.supabase.co");

        // Remove Cloudflare-specific headers that might cause issues
        headers.delete("cf-connecting-ip");
        headers.delete("cf-ray");
        headers.delete("cf-visitor");

        // Forward the request to Supabase
        const response = await fetch(targetUrl, {
            method: request.method,
            headers: headers,
            body: request.method !== "GET" && request.method !== "HEAD"
                ? request.body
                : undefined,
            redirect: "manual", // Don't follow redirects — return them to the client
        });

        // Clone the response and add CORS headers
        const responseHeaders = new Headers(response.headers);

        // Allow the frontend origin
        const origin = request.headers.get("Origin") || "*";
        responseHeaders.set("Access-Control-Allow-Origin", origin);
        responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey, x-client-info, X-Supabase-Api-Version");
        responseHeaders.set("Access-Control-Allow-Credentials", "true");
        responseHeaders.set("Access-Control-Max-Age", "86400");

        // Handle preflight OPTIONS requests
        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: responseHeaders,
            });
        }

        // Fix redirect locations to point back through the proxy
        const location = responseHeaders.get("Location");
        if (location && location.includes("rpwwyhrallublnejtgqt.supabase.co")) {
            responseHeaders.set(
                "Location",
                location.replace(
                    "https://rpwwyhrallublnejtgqt.supabase.co",
                    `https://${url.hostname}`
                )
            );
        }

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });
    },
};
