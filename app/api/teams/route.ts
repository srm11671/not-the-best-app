import { NextResponse } from "next/server"
import { getTeams, createTeam } from "@/lib/teams-store"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export async function GET() {
  try {
    const teams = await getTeams()
    return NextResponse.json(teams)
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, displayName, role } = body
    if (!name?.trim() || !displayName?.trim() || !role?.trim()) {
      return NextResponse.json(
        { error: "Team name, your display name, and your role are required" },
        { status: 400 }
      )
    }
    const team = await createTeam(name.trim(), displayName.trim(), role.trim())
    return NextResponse.json(team, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized"
    return NextResponse.json({ error: message }, { status: message === "Not authenticated" ? 401 : 400 })
  }
}
