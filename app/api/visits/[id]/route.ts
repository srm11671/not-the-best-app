import { NextResponse } from "next/server"
import { getVisit, updateVisit, deleteVisit } from "@/lib/store"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const visit = await getVisit(params.id)
  if (!visit) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(visit, { headers: { "Cache-Control": "no-store, max-age=0" } })
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  const visit = await updateVisit(params.id, body)
  if (!visit) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(visit)
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const success = await deleteVisit(params.id)
  if (!success) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true })
}
