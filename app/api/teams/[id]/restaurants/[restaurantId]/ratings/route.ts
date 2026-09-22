import { NextResponse } from "next/server"
import { addOrUpdateRating, RatingInput } from "@/lib/team-restaurants-store"
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
    const { rating } = body
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

    const input: RatingInput = {
      rating,
      summary: body.summary ?? "",
      notes: body.notes ?? "",
      foodItems: body.foodItems ?? [],
      date: body.date ?? "",
      occasion: body.occasion ?? "",
      companions: body.companions ?? [],
      serviceNotes: body.serviceNotes ?? [],
      itemsConsidered: body.itemsConsidered ?? [],
      wantToTryNextTime: body.wantToTryNextTime ?? [],
      totalSpent: Number(body.totalSpent) || 0,
      pricePerPerson: Number(body.pricePerPerson) || 0,
      waitTimeMinutes: Number(body.waitTimeMinutes) || 0,
      atmosphere: Number(body.atmosphere) || 7,
      cleanliness: Number(body.cleanliness) || 7,
      overallValue: Number(body.overallValue) || 7,
      photos: Number(body.photos) || 0,
      criticName: body.criticName || undefined,
      criticRating: body.criticRating != null ? Number(body.criticRating) : undefined,
      criticReviewUrl: body.criticReviewUrl || undefined,
    }

    const result = await addOrUpdateRating(params.id, params.restaurantId, memberId, input)
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
