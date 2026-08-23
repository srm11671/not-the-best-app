import { NextResponse } from "next/server"
import { getVisit, updateVisit, deleteVisit } from "@/lib/store"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const visit = await getVisit(params.id)
    if (!visit) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(visit, { headers: { "Cache-Control": "no-store, max-age=0" } })
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const visit = await updateVisit(params.id, body)
    if (!visit) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(visit)
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const success = await deleteVisit(params.id)
    if (!success) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
