import { createClient } from '@supabase/supabase-js';

// Use the proxy URL if available (bypasses ISP blocking of supabase.co in India)
// Falls back to direct Supabase URL
const supabaseUrl = import.meta.env.VITE_SUPABASE_PROXY_URL
    || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only initialize if keys are present
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true // This helps capture the code naturally
        }
    })
    : null as any;

if (!supabase) {
    console.error('❌ Supabase initialization failed: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}
