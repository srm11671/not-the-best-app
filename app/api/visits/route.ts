import { NextResponse } from "next/server"
import { getVisits, addVisit } from "@/lib/store"

export const dynamic = "force-dynamic"

export async function GET() {
  const visits = await getVisits()
  return NextResponse.json(visits)
}

export async function POST(request: Request) {
  const body = await request.json()
  const visit = await addVisit(body)
  return NextResponse.json(visit, { status: 201 })
}
