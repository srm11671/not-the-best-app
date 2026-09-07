import { NextResponse } from "next/server"
import { joinTeamByCode } from "@/lib/teams-store"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const AUTH_REQUIRED = process.env.REQUIRE_AUTH === "false"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, displayName, role, experience } = body
    if (!code?.trim() || !displayName?.trim() || !role?.trim()) {
      return NextResponse.json(
        { error: "Invite code, your display name, and your role are required" },
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

    const result = await joinTeamByCode(
      code.trim(),
      displayName.trim(),
      role.trim(),
      experience?.trim() || "",
      userId
    )
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
