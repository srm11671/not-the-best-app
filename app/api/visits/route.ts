import { NextResponse } from "next/server"
import { getVisits, addVisit } from "@/lib/store"

export async function GET() {
  return NextResponse.json(getVisits())
}

export async function POST(request: Request) {
  const body = await request.json()
  const visit = addVisit(body)
  return NextResponse.json(visit, { status: 201 })
}
