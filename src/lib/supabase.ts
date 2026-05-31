import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  // Dev mode without .env.local — auth and sync will be disabled.
  // Copy .env.example to .env.local and add your Supabase project credentials.
  console.warn('[Supabase] env vars not set — running without auth/sync')
}

// Fallback to local Supabase dev server port when env vars are absent.
// API calls will fail gracefully; useAuthStore catches errors via try/catch.
export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseKey || 'placeholder-anon-key'
)
