import { NextResponse } from "next/server"
import { getVisits, addVisit } from "@/lib/store"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const visits = await getVisits()
    return NextResponse.json(visits)
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const visit = await addVisit(body)
    return NextResponse.json(visit, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
