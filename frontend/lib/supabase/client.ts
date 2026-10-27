import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config, isLiveMode } from '@/lib/config'

let client: SupabaseClient | null = null

/** Browser-only singleton. Returns null in preview mode (Supabase not configured). */
export function getSupabase(): SupabaseClient | null {
  if (!isLiveMode || typeof window === 'undefined') return null
  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  }
  return client
}
