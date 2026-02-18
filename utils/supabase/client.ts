import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // We use "process.env" to grab variables from Vercel's settings
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If variables are missing (which happens during the Vercel build step), 
  // we provide a fallback so the build doesn't crash.
  if (!url || !key) {
    return createBrowserClient(
      "https://zgsmssdehbfnhbqigaze.supabase.co", 
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpnc21zc2RlaGJmbmhicWlnYXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMTc2NjMsImV4cCI6MjA4Njg5MzY2M30.B-dnpuSg4pBm_6Z5HDoZIqBUSo2PfSjt4noPm0Ll7A4"
    )
  }

  return createBrowserClient(url, key)
}