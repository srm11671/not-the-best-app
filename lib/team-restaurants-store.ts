import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { TeamRestaurant, TeamRestaurantRating, FoodItem, ConsideredItem, NTBRating } from "@/types"

const AUTH_REQUIRED = process.env.REQUIRE_AUTH === "true"

interface RestaurantRow {
  id: string
  team_id: string
  restaurant: string
  location: string | null
  added_by_member_id: string | null
  created_at: string
}

interface RatingRow {
  id: string
  team_restaurant_id: string
  team_id: string
  member_id: string
  rating: string
  summary: string | null
  notes: string | null
  food_items: FoodItem[]
  visit_date: string | null
  occasion: string | null
  companions: string[] | null
  service_notes: string[] | null
  items_considered: ConsideredItem[] | null
  want_to_try_next_time: string[] | null
  total_spent: number | null
  price_per_person: number | null
  wait_time_minutes: number | null
  atmosphere: number | null
  cleanliness: number | null
  overall_value: number | null
  photos: number | null
  critic_name: string | null
  critic_rating: number | null
  critic_review_url: string | null
  created_at: string
  updated_at: string
  team_members?: { display_name: string } | null
}

// Every field a team member's rating can capture -- the exact same shape as
// the personal "Log a Dining Memory" form (DiningVisit), so logging a team
// visit is the same experience as logging a personal one.
export interface RatingInput {
  rating: NTBRating
  summary: string
  notes: string
  foodItems: FoodItem[]
  date: string
  occasion: string
  companions: string[]
  serviceNotes: string[]
  itemsConsidered: ConsideredItem[]
  wantToTryNextTime: string[]
  totalSpent: number
  pricePerPerson: number
  waitTimeMinutes: number
  atmosphere: number
  cleanliness: number
  overallValue: number
  photos: number
  criticName?: string
  criticRating?: number
  criticReviewUrl?: string
}

function rowToRating(row: RatingRow): TeamRestaurantRating {
  return {
    id: row.id,
    teamRestaurantId: row.team_restaurant_id,
    teamId: row.team_id,
    memberId: row.member_id,
    memberDisplayName: row.team_members?.display_name,
    rating: row.rating as NTBRating,
    summary: row.summary ?? "",
    notes: row.notes ?? "",
    foodItems: row.food_items ?? [],
    date: row.visit_date ?? "",
    occasion: row.occasion ?? "",
    companions: row.companions ?? [],
    serviceNotes: row.service_notes ?? [],
    itemsConsidered: row.items_considered ?? [],
    wantToTryNextTime: row.want_to_try_next_time ?? [],
    totalSpent: row.total_spent ?? 0,
    pricePerPerson: row.price_per_person ?? 0,
    waitTimeMinutes: row.wait_time_minutes ?? 0,
    atmosphere: row.atmosphere ?? 7,
    cleanliness: row.cleanliness ?? 7,
    overallValue: row.overall_value ?? 7,
    photos: row.photos ?? 0,
    criticName: row.critic_name ?? undefined,
    criticRating: row.critic_rating ?? undefined,
    criticReviewUrl: row.critic_review_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

// The team's shared restaurant catalog, each with every member's individual
// rating attached (grouped, not duplicated).
export async function getTeamRestaurants(teamId: string): Promise<TeamRestaurant[]> {
  const { supabase } = await getClientAndUser()
  const { data: restaurants, error } = await supabase
    .from("team_restaurants")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)

  const { data: ratings, error: ratingsError } = await supabase
    .from("team_restaurant_ratings")
    .select("*, team_members(display_name)")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true })
  if (ratingsError) throw new Error(ratingsError.message)

  const ratingsByRestaurant = new Map<string, TeamRestaurantRating[]>()
  for (const row of (ratings as RatingRow[]) ?? []) {
    const list = ratingsByRestaurant.get(row.team_restaurant_id) ?? []
    list.push(rowToRating(row))
    ratingsByRestaurant.set(row.team_restaurant_id, list)
  }

  return ((restaurants as RestaurantRow[]) ?? []).map((row) => ({
    id: row.id,
    teamId: row.team_id,
    restaurant: row.restaurant,
    location: row.location ?? "",
    addedByMemberId: row.added_by_member_id,
    createdAt: row.created_at,
    ratings: ratingsByRestaurant.get(row.id) ?? [],
  }))
}

export async function getTeamRestaurant(
  teamId: string,
  restaurantId: string
): Promise<TeamRestaurant | undefined> {
  const all = await getTeamRestaurants(teamId)
  return all.find((r) => r.id === restaurantId)
}

// Adds a restaurant to the team's shared catalog AND the adding member's
// own rating, in one step. If the restaurant (same name+location) already
// exists for this team, reuses that row instead of creating a duplicate.
export async function addTeamRestaurant(
  teamId: string,
  memberId: string,
  restaurant: string,
  location: string,
  input: RatingInput
): Promise<TeamRestaurant> {
  const { supabase } = await getClientAndUser()

  const { data: existing } = await supabase
    .from("team_restaurants")
    .select("*")
    .eq("team_id", teamId)
    .eq("restaurant", restaurant)
    .eq("location", location)
    .maybeSingle()

  let restaurantRow = existing as RestaurantRow | null
  if (!restaurantRow) {
    const { data, error } = await supabase
      .from("team_restaurants")
      .insert({ team_id: teamId, restaurant, location, added_by_member_id: memberId })
      .select("*")
      .single()
    if (error) throw new Error(error.message)
    restaurantRow = data as RestaurantRow
  }

  await addOrUpdateRating(teamId, restaurantRow.id, memberId, input)

  const full = await getTeamRestaurant(teamId, restaurantRow.id)
  if (!full) throw new Error("Failed to load restaurant after creation")
  return full
}

// Adds (or updates, if this member already rated this restaurant) one
// member's full rating on an existing shared team restaurant.
export async function addOrUpdateRating(
  teamId: string,
  teamRestaurantId: string,
  memberId: string,
  input: RatingInput
): Promise<TeamRestaurantRating> {
  const { supabase } = await getClientAndUser()
  const row = {
    team_restaurant_id: teamRestaurantId,
    team_id: teamId,
    member_id: memberId,
    rating: input.rating,
    summary: input.summary,
    notes: input.notes,
    food_items: input.foodItems,
    visit_date: input.date || null,
    occasion: input.occasion,
    companions: input.companions,
    service_notes: input.serviceNotes,
    items_considered: input.itemsConsidered,
    want_to_try_next_time: input.wantToTryNextTime,
    total_spent: input.totalSpent,
    price_per_person: input.pricePerPerson,
    wait_time_minutes: input.waitTimeMinutes,
    atmosphere: input.atmosphere,
    cleanliness: input.cleanliness,
    overall_value: input.overallValue,
    photos: input.photos,
    critic_name: input.criticName ?? null,
    critic_rating: input.criticRating ?? null,
    critic_review_url: input.criticReviewUrl ?? null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase
    .from("team_restaurant_ratings")
    .upsert(row, { onConflict: "team_restaurant_id,member_id" })
    .select("*, team_members(display_name)")
    .single()
  if (error) throw new Error(error.message)
  return rowToRating(data as RatingRow)
}
