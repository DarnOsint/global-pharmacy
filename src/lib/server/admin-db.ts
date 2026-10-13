import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Service-role client. Bypasses RLS, so it must only be used inside route
// handlers after the caller's session and location have been checked.
let client: SupabaseClient | null = null;

export function adminDb(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase server credentials are not configured');
    client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  }
  return client;
}
