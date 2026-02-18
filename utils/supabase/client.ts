import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // We use "process.env" to grab variables from Vercel's settings
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If variables are missing (which happens during the Vercel build step), 
  // we provide a fallback so the build doesn't crash.
  if (!url || !key) {
    return createBrowserClient(
      "https://placeholder-url.supabase.co", 
      "placeholder-key"
    )
  }

  return createBrowserClient(url, key)
}