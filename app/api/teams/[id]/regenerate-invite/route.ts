import { NextResponse } from "next/server"
import { regenerateInviteCode, getTeamMembers } from "@/lib/teams-store"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const AUTH_REQUIRED = process.env.REQUIRE_AUTH === "false"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    if (AUTH_REQUIRED) {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      const members = await getTeamMembers(params.id)
      const isAdmin = members.some((m) => m.userId === user.id && m.isAdmin)
      if (!isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 })
    }
    const team = await regenerateInviteCode(params.id)
    if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(team)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized"
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
