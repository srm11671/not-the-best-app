import { NextResponse } from "next/server"
import { getTeamComments, addTeamComment } from "@/lib/team-comments-store"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export async function GET(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const comments = await getTeamComments(params.id, params.memberId)
    return NextResponse.json(comments)
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const body = await request.json()
    const { displayName, body: commentBody } = body
    if (!displayName?.trim() || !commentBody?.trim()) {
      return NextResponse.json({ error: "Your name and a comment are required" }, { status: 400 })
    }
    const comment = await addTeamComment(params.id, displayName.trim(), commentBody.trim(), params.memberId)
    return NextResponse.json(comment, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong"
    return NextResponse.json({ error: message }, { status: message === "Not authenticated" ? 401 : 400 })
  }
}
