export type NTBRating =
  | "hidden-gem"
  | "solid-choice"
  | "its-fine"
  | "skip-it"
  | "not-the-best"

export interface NTBTierInfo {
  id: NTBRating
  label: string
  tagline: string
  color: string
  glyph: string
}

export const NTB_TIERS: NTBTierInfo[] = [
  {
    id: "hidden-gem",
    label: "Hidden Gem",
    tagline: "Worth driving across town for.",
    color: "#C9982E",
    glyph: "◆",
  },
  {
    id: "solid-choice",
    label: "Solid Choice",
    tagline: "Consistently good food and service.",
    color: "#0F6B5C",
    glyph: "●",
  },
  {
    id: "its-fine",
    label: "It's Fine",
    tagline: "Average experience. Nothing terrible, nothing memorable.",
    color: "#8A6D3B",
    glyph: "▲",
  },
  {
    id: "skip-it",
    label: "Skip It",
    tagline: "Better options are available.",
    color: "#5C4A38",
    glyph: "▼",
  },
  {
    id: "not-the-best",
    label: "Not the Best®",
    tagline: "A poor experience. Not worth another visit.",
    color: "#7A1F2B",
    glyph: "✕",
  },
]

// Rough mapping so a 0-10 critic score can be compared against the
// NTB tiers. This is a presentational estimate, not a claim about
// what any specific critic intended their number to mean.
export function scoreToNTBTier(score: number): NTBRating {
  if (score >= 9) return "hidden-gem"
  if (score >= 7) return "solid-choice"
  if (score >= 5) return "its-fine"
  if (score >= 3) return "skip-it"
  return "not-the-best"
}

export interface FoodItem {
  id: string
  name: string
  rating: NTBRating
  note: string
  wouldOrderAgain: boolean
}

export interface ConsideredItem {
  id: string
  name: string
  reason: string
}

export interface DiningVisit {
  id: string
  restaurant: string
  location: string
  date: string
  occasion: string
  companions: string[]
  overallRating: NTBRating
  summary: string
  serviceNotes: string[]
  foodItems: FoodItem[]
  itemsConsidered: ConsideredItem[]
  itemsPassedOn: ConsideredItem[]
  wantToTryNextTime: string[]
  totalSpent: number
  pricePerPerson: number
  waitTimeMinutes: number
  atmosphere: number
  cleanliness: number
  overallValue: number
  privateNotes: string
  photos: number
  criticName?: string
  criticRating?: number
  criticReviewUrl?: string
  teamId?: string | null
}

export interface Team {
  id: string
  name: string
  slug: string
  // Only ever populated for the team owner. Everyone else gets undefined --
  // codes must never be visible on any public/list response.
  inviteCode?: string
  fanCode?: string
  visibility: "private" | "public"
  createdBy: string | null
  createdAt: string
  memberCount?: number
  isMember?: boolean
  isAdmin?: boolean
  isOwner?: boolean
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string | null
  displayName: string
  role: string
  experience: string
  isAdmin: boolean
  joinedAt: string
}

export interface TeamFan {
  id: string
  teamId: string
  userId: string | null
  displayName: string
  redeemedAt: string
}

export interface VisitComment {
  id: string
  visitId: string
  teamId: string
  userId: string | null
  displayName: string
  body: string
  createdAt: string
}

// A restaurant the team has visited -- created once by whichever member
// logs it first. Other members add their OWN rating to this same entry
// instead of creating a duplicate restaurant row.
export interface TeamRestaurant {
  id: string
  teamId: string
  restaurant: string
  location: string
  addedByMemberId: string | null
  createdAt: string
  ratings: TeamRestaurantRating[]
}

// One team member's individual rating of a shared team restaurant.
export interface TeamRestaurantRating {
  id: string
  teamRestaurantId: string
  teamId: string
  memberId: string
  memberDisplayName?: string
  rating: NTBRating
  summary: string
  notes: string
  foodItems: FoodItem[]
  createdAt: string
  updatedAt: string
}

// A comment on the team itself, or on a specific member's profile.
export interface TeamComment {
  id: string
  teamId: string
  targetType: "team" | "member"
  targetMemberId: string | null
  userId: string | null
  displayName: string
  body: string
  createdAt: string
}

// A fan's private rating of a restaurant -- never shared with the team.
export interface FanPrivateRating {
  id: string
  teamId: string
  fanId: string
  userId: string | null
  restaurant: string
  location: string
  rating: NTBRating
  notes: string
  createdAt: string
}
