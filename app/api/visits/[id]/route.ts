import { NextResponse } from "next/server"
import { getVisit, deleteVisit } from "@/lib/store"

export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const visit = await getVisit(params.id)
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
