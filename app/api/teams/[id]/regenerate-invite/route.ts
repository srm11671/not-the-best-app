import { NextResponse } from "next/server"
import { regenerateInviteCode, getTeam } from "@/lib/teams-store"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const AUTH_REQUIRED = process.env.REQUIRE_AUTH === "true"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    if (AUTH_REQUIRED) {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      const team = await getTeam(params.id)
      if (!team || team.createdBy !== user.id) {
        return NextResponse.json({ error: "Only the team owner can do this" }, { status: 403 })
      }
    }
    const team = await regenerateInviteCode(params.id)
    if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(team)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized"
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
