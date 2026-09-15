import { NextResponse } from "next/server"
import { getVisitComments, addComment } from "@/lib/comments-store"
import { getVisit } from "@/lib/store"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const comments = await getVisitComments(params.id)
    return NextResponse.json(comments)
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { displayName, body: commentBody } = body
    if (!displayName?.trim() || !commentBody?.trim()) {
      return NextResponse.json({ error: "Your name and a comment are required" }, { status: 400 })
    }
    const visit = await getVisit(params.id)
    if (!visit || !visit.teamId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    const comment = await addComment(params.id, visit.teamId, displayName.trim(), commentBody.trim())
    return NextResponse.json(comment, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong"
    return NextResponse.json({ error: message }, { status: message === "Not authenticated" ? 401 : 400 })
  }
}
