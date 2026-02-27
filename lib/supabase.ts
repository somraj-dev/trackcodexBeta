import { createClient } from '@supabase/supabase-js';

// Helper: check if a string is a valid HTTP/HTTPS URL
function isValidHttpUrl(str: string | undefined): str is string {
    if (!str) return false;
    try {
        const url = new URL(str);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

// Use the direct Supabase URL (the SDK validates URL format internally)
// The proxy URL, if set, can be used at the network/fetch level instead
const directUrl = import.meta.env.VITE_SUPABASE_URL;
const proxyUrl = import.meta.env.VITE_SUPABASE_PROXY_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Pick the best valid URL: prefer proxy if valid, otherwise direct
const supabaseUrl = isValidHttpUrl(proxyUrl) ? proxyUrl
    : isValidHttpUrl(directUrl) ? directUrl
        : undefined;

console.log('[Supabase] Using URL:', supabaseUrl ? supabaseUrl.replace(/\/\/(.{8}).*(@|\.su)/, '//$1***$2') : 'NONE');

// Only initialize if keys are present and URL is valid
let supabase: ReturnType<typeof createClient> | null = null;
try {
    if (supabaseUrl && supabaseAnonKey) {
        supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true // This helps capture the code naturally
            }
        });
    }
} catch (err) {
    console.error('❌ Supabase createClient threw an error:', err);
}

if (!supabase) {
    console.error('❌ Supabase initialization failed: Missing or invalid VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
    console.error('  VITE_SUPABASE_URL present:', !!directUrl);
    console.error('  VITE_SUPABASE_PROXY_URL present:', !!proxyUrl);
    console.error('  VITE_SUPABASE_ANON_KEY present:', !!supabaseAnonKey);
}

export { supabase };
