import { NextResponse } from "next/server"
import { addOrUpdateRating } from "@/lib/team-restaurants-store"
import { getTeamMembers } from "@/lib/teams-store"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const AUTH_REQUIRED = process.env.REQUIRE_AUTH === "true"

export async function POST(
  request: Request,
  { params }: { params: { id: string; restaurantId: string } }
) {
  try {
    const body = await request.json()
    const { rating, summary, notes, foodItems } = body
    if (!rating) {
      return NextResponse.json({ error: "A rating is required" }, { status: 400 })
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
        return NextResponse.json({ error: "Only team members can rate this restaurant" }, { status: 403 })
      }
      memberId = myMembership.id
    } else {
      const members = await getTeamMembers(params.id)
      if (members.length === 0) {
        return NextResponse.json({ error: "This team has no members yet" }, { status: 400 })
      }
      memberId = members[0].id
    }

    const result = await addOrUpdateRating(
      params.id,
      params.restaurantId,
      memberId,
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
