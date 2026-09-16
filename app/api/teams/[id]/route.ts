import { NextResponse } from "next/server"
import { getTeam, getTeamMembers, updateTeam, deleteTeam } from "@/lib/teams-store"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

const AUTH_REQUIRED = process.env.REQUIRE_AUTH === "true"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const team = await getTeam(params.id)
    if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const members = await getTeamMembers(params.id)

    let isOwner = !AUTH_REQUIRED
    if (AUTH_REQUIRED) {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      isOwner = !!user && team.createdBy === user.id
    }

    // Codes are only ever included in the response for the team's owner.
    const safeTeam = isOwner ? team : { ...team, inviteCode: undefined, fanCode: undefined }
    return NextResponse.json({ team: safeTeam, members, isOwner })
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const team = await updateTeam(params.id, body)
    if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const { inviteCode, fanCode, ...safe } = team
    return NextResponse.json(safe)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized"
    return NextResponse.json({ error: message }, { status: 401 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await deleteTeam(params.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized"
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
