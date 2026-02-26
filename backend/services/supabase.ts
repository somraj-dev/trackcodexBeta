import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("⚠️  [SUPABASE] Missing keys. Auth features will fail.");
}

/**
 * Supabase Admin client - used for backend operations that bypass RLS
 * like managing users, deleting accounts, etc.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

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
