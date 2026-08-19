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
    color: "#C08A2E",
    glyph: "◆",
  },
  {
    id: "solid-choice",
    label: "Solid Choice",
    tagline: "Consistently good food and service.",
    color: "#5C7A5E",
    glyph: "●",
  },
  {
    id: "its-fine",
    label: "It's Fine",
    tagline: "Average experience. Nothing terrible, nothing memorable.",
    color: "#A68A5B",
    glyph: "▲",
  },
  {
    id: "skip-it",
    label: "Skip It",
    tagline: "Better options are available.",
    color: "#9C6B4F",
    glyph: "▼",
  },
  {
    id: "not-the-best",
    label: "Not the Best®",
    tagline: "A poor experience. Not worth another visit.",
    color: "#8B3A3A",
    glyph: "✕",
  },
]

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
}
