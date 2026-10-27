export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  workspaceName: 'Ops Command',
}

/**
 * Live mode requires both the NestJS API and Supabase to be configured.
 * Otherwise the app runs a clearly-labelled, in-browser preview sandbox.
 */
export const isLiveMode = Boolean(config.apiBaseUrl && config.supabaseUrl && config.supabaseKey)
export const isPreviewMode = process.env.NEXT_PUBLIC_ENABLE_PREVIEW === 'true'
export const isSupabaseConfigured = Boolean(config.supabaseUrl && config.supabaseKey)
