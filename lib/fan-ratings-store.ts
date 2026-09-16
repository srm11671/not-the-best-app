import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { FanPrivateRating, NTBRating } from "@/types"
import { getTeamFanForUser } from "@/lib/teams-store"

const AUTH_REQUIRED = process.env.REQUIRE_AUTH === "true"

interface FanRatingRow {
  id: string
  team_id: string
  fan_id: string
  user_id: string | null
  restaurant: string
  location: string | null
  rating: string
  notes: string | null
  created_at: string
}

function rowToRating(row: FanRatingRow): FanPrivateRating {
  return {
    id: row.id,
    teamId: row.team_id,
    fanId: row.fan_id,
    userId: row.user_id,
    restaurant: row.restaurant,
    location: row.location ?? "",
    rating: row.rating as NTBRating,
    notes: row.notes ?? "",
    createdAt: row.created_at,
  }
}

async function getClientAndUser() {
  if (!AUTH_REQUIRED) {
    return { supabase: createAdminClient(), user: null as { id: string } | null }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  return { supabase, user }
}

// A fan's own private ratings for this team -- RLS guarantees this never
// returns another user's rows, but we also scope by user_id defensively.
export async function getMyFanRatings(teamId: string): Promise<FanPrivateRating[]> {
  const { supabase, user } = await getClientAndUser()
  let query = supabase.from("fan_private_ratings").select("*").eq("team_id", teamId)
  if (AUTH_REQUIRED && user) query = query.eq("user_id", user.id)
  const { data, error } = await query.order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return (data as FanRatingRow[]).map(rowToRating)
}

export async function addFanRating(
  teamId: string,
  restaurant: string,
  location: string,
  rating: NTBRating,
  notes: string
): Promise<FanPrivateRating> {
  const { supabase, user } = await getClientAndUser()

  let fanId: string | null = null
  if (AUTH_REQUIRED && user) {
    const fan = await getTeamFanForUser(teamId, user.id)
    if (!fan) throw new Error("Only fans who've redeemed the fan code can log a private rating")
    fanId = fan.id
  } else {
    const { data: anyFan } = await supabase
      .from("team_fans")
      .select("id")
      .eq("team_id", teamId)
      .limit(1)
      .maybeSingle()
    fanId = anyFan?.id ?? null
  }
  if (!fanId) throw new Error("You must join this team as a fan before logging a private rating")

  const row = {
    team_id: teamId,
    fan_id: fanId,
    user_id: AUTH_REQUIRED && user ? user.id : null,
    restaurant,
    location,
    rating,
    notes,
  }
  const { data, error } = await supabase.from("fan_private_ratings").insert(row).select("*").single()
  if (error) throw new Error(error.message)
  return rowToRating(data as FanRatingRow)
}
