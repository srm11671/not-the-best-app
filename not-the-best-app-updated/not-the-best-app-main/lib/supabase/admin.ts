import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// This client bypasses Row Level Security entirely -- only use it in
// trusted server-only code that never runs on behalf of a specific
// request's user, like a webhook whose sender has already been
// verified (see app/api/webhooks/stripe/route.ts). Never import this
// into anything reachable from a page or a user-triggered API route.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
