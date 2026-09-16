import { NextResponse } from "next/server"
import { getTeamRestaurants, addTeamRestaurant } from "@/lib/team-restaurants-store"
import { getTeamMembers } from "@/lib/teams-store"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

const AUTH_REQUIRED = process.env.REQUIRE_AUTH === "true"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const restaurants = await getTeamRestaurants(params.id)
    return NextResponse.json(restaurants)
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { restaurant, location, rating, summary, notes, foodItems } = body
    if (!restaurant?.trim() || !rating) {
      return NextResponse.json({ error: "Restaurant name and a rating are required" }, { status: 400 })
    }

    let memberId: string
    if (AUTH_REQUIRED) {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      const members = await getTeamMembers(params.id)
      const myMembership = members.find((m) => m.userId === user.id)
      if (!myMembership) {
        return NextResponse.json({ error: "Only team members can add a restaurant" }, { status: 403 })
      }
      memberId = myMembership.id
    } else {
      const members = await getTeamMembers(params.id)
      if (members.length === 0) {
        return NextResponse.json({ error: "This team has no members yet" }, { status: 400 })
      }
      memberId = members[0].id
    }

    const result = await addTeamRestaurant(
      params.id,
      memberId,
      restaurant.trim(),
      (location ?? "").trim(),
      rating,
      summary ?? "",
      notes ?? "",
      foodItems ?? []
    )
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
