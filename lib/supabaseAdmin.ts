import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
// Service role key for admin operations - should be kept secure
// In production, this should be stored server-side and accessed via API
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL in environment variables');
}

if (!serviceRoleKey) {
  console.warn('⚠️ VITE_SUPABASE_SERVICE_ROLE_KEY not found. Admin operations may fail.');
}

// Admin client with service role key for admin operations
// WARNING: This should ideally be used server-side only
export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;
