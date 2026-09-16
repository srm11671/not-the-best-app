import { NextResponse } from "next/server"
import { getMyFanRatings, addFanRating } from "@/lib/fan-ratings-store"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const ratings = await getMyFanRatings(params.id)
    return NextResponse.json(ratings)
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { restaurant, location, rating, notes } = body
    if (!restaurant?.trim() || !rating) {
      return NextResponse.json({ error: "Restaurant name and a rating are required" }, { status: 400 })
    }
    const result = await addFanRating(params.id, restaurant.trim(), (location ?? "").trim(), rating, notes ?? "")
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong"
    return NextResponse.json({ error: message }, { status: message === "Not authenticated" ? 401 : 400 })
  }
}
