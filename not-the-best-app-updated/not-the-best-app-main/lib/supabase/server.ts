import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Use this in Server Components, Route Handlers, and Server Actions.
// It reads the logged-in user's session from cookies and respects
// Row Level Security (RLS) — unlike the old service-role client, this
// one can only see/edit data the current user is allowed to touch.
export async function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — safe to ignore
            // because middleware refreshes the session on every request.
          }
        },
      },
    }
  )
}
