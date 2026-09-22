import { NextResponse } from "next/server"
import { getTeamRestaurant, getTeamRestaurants } from "@/lib/team-restaurants-store"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get("teamId") ?? ""
  const restaurantId = searchParams.get("restaurantId") ?? ""

  try {
    const all = await getTeamRestaurants(teamId)
    const single = await getTeamRestaurant(teamId, restaurantId)
    return NextResponse.json({
      ok: true,
      teamId,
      restaurantId,
      allIds: all.map((r) => r.id),
      allCount: all.length,
      singleFound: !!single,
      single,
    })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      teamId,
      restaurantId,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    }, { status: 500 })
  }
}
