import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Routes that don't require a logged-in user at all.
const PUBLIC_PATHS = ["/login", "/auth/callback"]

// Routes a logged-in user can reach even if their trial has expired
// and they haven't paid -- the paywall itself, and the endpoints that
// let them actually pay or that Stripe calls back into.
const ALLOWED_WHILE_UNPAID = [
  "/paywall",
  "/api/checkout",
  "/api/webhooks/stripe",
]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isPublicPath = PUBLIC_PATHS.some((p) => path.startsWith(p))

  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", path)
    return NextResponse.redirect(loginUrl)
  }

  if (user && path === "/login") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Trial / payment gate -- only relevant for logged-in users hitting
  // a route that isn't already the paywall or a payment endpoint.
  const isAllowedWhileUnpaid = ALLOWED_WHILE_UNPAID.some((p) => path.startsWith(p))
  if (user && !isPublicPath && !isAllowedWhileUnpaid) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("paid, trial_ends_at")
      .eq("user_id", user.id)
      .maybeSingle()

    const trialActive = profile?.trial_ends_at
      ? new Date(profile.trial_ends_at).getTime() > Date.now()
      : false
    const hasAccess = profile?.paid || trialActive

    if (!hasAccess) {
      return NextResponse.redirect(new URL("/paywall", request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.jpg).*)",
  ],
}
