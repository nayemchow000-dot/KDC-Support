import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : ({} as Record<string, string>);

/**
 * Frontend Supabase Configuration
 * Uses the current Supabase Publishable Key architecture.
 * Browser-safe and strictly bound to Row Level Security (RLS).
 */
export const SUPABASE_URL: string = (env.VITE_SUPABASE_URL as string) || '';

export const SUPABASE_PUBLISHABLE_KEY: string =
  (env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
  (env.VITE_SUPABASE_ANON_KEY as string) ||
  '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_PUBLISHABLE_KEY &&
  !SUPABASE_URL.includes('your-project-id') &&
  !SUPABASE_PUBLISHABLE_KEY.includes('your_supabase_') &&
  !SUPABASE_PUBLISHABLE_KEY.includes('placeholder')
);

// Fallback dummy URL and Key so createClient initializes cleanly when waiting for user environment variables
const validUrl = isSupabaseConfigured ? SUPABASE_URL : 'https://placeholder-project.supabase.co';
const validKey = isSupabaseConfigured ? SUPABASE_PUBLISHABLE_KEY : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase: SupabaseClient = createClient(validUrl, validKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'kdc_supabase_auth_session',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export const ADMIN_BOOTSTRAP_EMAIL = 'nayemchow000@gmail.com';
