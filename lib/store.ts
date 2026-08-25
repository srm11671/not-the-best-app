import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { DiningVisit } from "@/types"

const AUTH_REQUIRED = process.env.REQUIRE_AUTH === "true"

interface VisitRow {
  id: string
  user_id: string | null
  restaurant: string
  location: string
  date: string
  occasion: string
  companions: string[]
  overall_rating: string
  summary: string
  service_notes: string[]
  food_items: DiningVisit["foodItems"]
  items_considered: DiningVisit["itemsConsidered"]
  items_passed_on: DiningVisit["itemsPassedOn"]
  want_to_try_next_time: string[]
  total_spent: number
  price_per_person: number
  wait_time_minutes: number
  atmosphere: number
  cleanliness: number
  overall_value: number
  private_notes: string
  photos: number
  baldy_rating: number | null
  baldy_review_url: string | null
}

function rowToVisit(row: VisitRow): DiningVisit {
  return {
    id: row.id,
    restaurant: row.restaurant,
    location: row.location,
    date: row.date,
    occasion: row.occasion,
    companions: row.companions ?? [],
    overallRating: row.overall_rating as DiningVisit["overallRating"],
    summary: row.summary,
    serviceNotes: row.service_notes ?? [],
    foodItems: row.food_items ?? [],
    itemsConsidered: row.items_considered ?? [],
    itemsPassedOn: row.items_passed_on ?? [],
    wantToTryNextTime: row.want_to_try_next_time ?? [],
    totalSpent: Number(row.total_spent) || 0,
    pricePerPerson: Number(row.price_per_person) || 0,
    waitTimeMinutes: Number(row.wait_time_minutes) || 0,
    atmosphere: Number(row.atmosphere) || 0,
    cleanliness: Number(row.cleanliness) || 0,
    overallValue: Number(row.overall_value) || 0,
    privateNotes: row.private_notes,
    photos: Number(row.photos) || 0,
    baldyRating: row.baldy_rating !== null ? Number(row.baldy_rating) : undefined,
    baldyReviewUrl: row.baldy_review_url ?? undefined,
  }
}

function visitToRow(visit: Omit<DiningVisit, "id">) {
  return {
    restaurant: visit.restaurant,
    location: visit.location,
    date: visit.date,
    occasion: visit.occasion,
    companions: visit.companions,
    overall_rating: visit.overallRating,
    summary: visit.summary,
    service_notes: visit.serviceNotes,
    food_items: visit.foodItems,
    items_considered: visit.itemsConsidered,
    items_passed_on: visit.itemsPassedOn,
    want_to_try_next_time: visit.wantToTryNextTime,
    total_spent: visit.totalSpent,
    price_per_person: visit.pricePerPerson,
    wait_time_minutes: visit.waitTimeMinutes,
    atmosphere: visit.atmosphere,
    cleanliness: visit.cleanliness,
    overall_value: visit.overallValue,
    private_notes: visit.privateNotes,
    photos: visit.photos,
    baldy_rating: visit.baldyRating ?? null,
    baldy_review_url: visit.baldyReviewUrl ?? null,
  }
}

// Two modes, controlled by the REQUIRE_AUTH env var:
//
// - REQUIRE_AUTH=true: private mode. Uses the per-request client tied
//   to the logged-in user's session. Combined with Row Level Security,
//   a user can only ever read/write their own rows.
//
// - REQUIRE_AUTH unset/false: open mode. Everyone shares one pool of
//   data. Uses the admin (service-role) client since there's no logged
//   -in user to scope to, and skips user_id filtering entirely.
//
// Flip the env var later to switch back to private mode -- no code
// changes needed.

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

export async function getVisits(): Promise<DiningVisit[]> {
  const { supabase, user } = await getClientAndUser()
  let query = supabase.from("visits").select("*").order("date", { ascending: false })
  if (AUTH_REQUIRED && user) query = query.eq("user_id", user.id)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data as VisitRow[]).map(rowToVisit)
}

export async function getVisit(id: string): Promise<DiningVisit | undefined> {
  const { supabase, user } = await getClientAndUser()
  let query = supabase.from("visits").select("*").eq("id", id)
  if (AUTH_REQUIRED && user) query = query.eq("user_id", user.id)
  const { data, error } = await query.maybeSingle()
  if (error) throw new Error(error.message)
  return data ? rowToVisit(data as VisitRow) : undefined
}

export async function addVisit(visit: Omit<DiningVisit, "id">): Promise<DiningVisit> {
  const { supabase, user } = await getClientAndUser()
  const id = crypto.randomUUID()
  const row = {
    id,
    ...(AUTH_REQUIRED && user ? { user_id: user.id } : {}),
    ...visitToRow(visit),
  }
  const { data, error } = await supabase.from("visits").insert(row).select("*").single()
  if (error) throw new Error(error.message)
  return rowToVisit(data as VisitRow)
}

export async function updateVisit(
  id: string,
  visit: Omit<DiningVisit, "id">
): Promise<DiningVisit | undefined> {
  const { supabase, user } = await getClientAndUser()
  let query = supabase.from("visits").update(visitToRow(visit)).eq("id", id)
  if (AUTH_REQUIRED && user) query = query.eq("user_id", user.id)
  const { data, error } = await query.select("*").maybeSingle()
  if (error) throw new Error(error.message)
  return data ? rowToVisit(data as VisitRow) : undefined
}

export async function deleteVisit(id: string): Promise<boolean> {
  const { supabase, user } = await getClientAndUser()
  let query = supabase.from("visits").delete().eq("id", id)
  if (AUTH_REQUIRED && user) query = query.eq("user_id", user.id)
  const { error } = await query
  if (error) throw new Error(error.message)
  return true
}