import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 6. Only initialize if keys are present
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null as any; // Cast so types still work, but it won't crash at startup

if (!supabase) {
    console.error('❌ Supabase initialization failed: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}
