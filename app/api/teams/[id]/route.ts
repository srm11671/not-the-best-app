import { NextResponse } from "next/server"
import { getTeam, getTeamMembers, updateTeam, deleteTeam } from "@/lib/teams-store"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const team = await getTeam(params.id)
    if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const members = await getTeamMembers(params.id)
    return NextResponse.json({ team, members })
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const team = await updateTeam(params.id, body)
    if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(team)
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
