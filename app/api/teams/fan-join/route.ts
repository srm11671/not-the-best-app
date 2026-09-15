import { NextResponse } from "next/server"
import { joinTeamAsFan } from "@/lib/teams-store"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const AUTH_REQUIRED = process.env.REQUIRE_AUTH === "true"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, displayName } = body
    if (!code?.trim() || !displayName?.trim()) {
      return NextResponse.json(
        { error: "Fan code and your display name are required" },
        { status: 400 }
      )
    }

    let userId: string | null = null
    if (AUTH_REQUIRED) {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      userId = user.id
    }

    const result = await joinTeamAsFan(code.trim(), displayName.trim(), userId)
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
