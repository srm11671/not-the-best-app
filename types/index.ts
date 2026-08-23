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

// Rough mapping so a 0-10 score (like Baldy Eats' rating scale) can be
// compared against the NTB tiers. This is a presentational estimate,
// not a claim about what Baldy himself intended his number to mean.
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
  baldyRating?: number
  baldyReviewUrl?: string
}
