import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("⚠️  [SUPABASE] Missing keys. Auth features will fail.");
}

// Initialize admin client only if keys are present to prevent crash
export const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
    : null as any;

if (!supabaseAdmin) {
    console.error("❌ [SUPABASE] Admin client initialization failed: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

/**
 * Helper to get a client with a specific user's token
 * used for checking permissions or making requests on behalf of a user
 */
export const getSupabaseUserClient = (token: string) => {
    return createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || "", {
        global: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    });
};
