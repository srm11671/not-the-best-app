import { supabase } from "@/lib/supabase"
import { DiningVisit } from "@/types"

interface VisitRow {
  id: string
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
  }
}

export async function getVisits(): Promise<DiningVisit[]> {
  const { data, error } = await supabase
    .from("visits")
    .select("*")
    .order("date", { ascending: false })
  if (error) throw new Error(error.message)
  return (data as VisitRow[]).map(rowToVisit)
}

export async function getVisit(id: string): Promise<DiningVisit | undefined> {
  const { data, error } = await supabase
    .from("visits")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? rowToVisit(data as VisitRow) : undefined
}

export async function addVisit(visit: Omit<DiningVisit, "id">): Promise<DiningVisit> {
  const id = crypto.randomUUID()
  const { data, error } = await supabase
    .from("visits")
    .insert({
      id,
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
    })
    .select("*")
    .single()
  if (error) throw new Error(error.message)
  return rowToVisit(data as VisitRow)
}

export async function deleteVisit(id: string): Promise<boolean> {
  const { error } = await supabase.from("visits").delete().eq("id", id)
  if (error) throw new Error(error.message)
  return true
}
