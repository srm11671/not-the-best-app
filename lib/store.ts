import { DiningVisit } from "@/types"

let visits: DiningVisit[] = [
  {
    id: "chucks-seafood-1",
    restaurant: "Chuck's Seafood",
    location: "Waterfront District",
    date: "2026-07-12",
    occasion: "Casual dinner with friends",
    companions: ["Jamie", "Priya"],
    overallRating: "its-fine",
    summary:
      "The visit was enjoyable overall, but several service issues and inconsistencies prevented it from being a higher-rated experience. While there were standout menu items that would absolutely be ordered again, other aspects created enough friction that the experience wasn't seamless.",
    serviceNotes: [
      "Repeatedly needed to get the bartender's attention.",
      "Appetizers arrived before plates, silverware, and napkins.",
      "Several menu items required asking for current market prices rather than displaying them on the menu.",
    ],
    foodItems: [
      {
        id: "f1",
        name: "Raw Oysters",
        rating: "hidden-gem",
        note: "Fresh, perfectly shucked, about $3 each, and would definitely be ordered again.",
        wouldOrderAgain: true,
      },
      {
        id: "f2",
        name: "Tuna Poke",
        rating: "solid-choice",
        note: "Excellent flavor but wasn't served quite cold enough. Would order again.",
        wouldOrderAgain: true,
      },
      {
        id: "f3",
        name: "Grouper Fingers",
        rating: "its-fine",
        note: "Fried nicely with creamy tartar sauce, but the fish lacked flavor and required salt, pepper, and lemon.",
        wouldOrderAgain: false,
      },
    ],
    itemsConsidered: [
      {
        id: "c1",
        name: "Prime Rib (10oz)",
        reason:
          "Premium prices are acceptable for an outstanding steak, but there wasn't enough confidence it would justify the cost, so it was not ordered.",
      },
    ],
    itemsPassedOn: [],
    wantToTryNextTime: ["Prime Rib, if a trusted review comes in first"],
    totalSpent: 138,
    pricePerPerson: 46,
    waitTimeMinutes: 15,
    atmosphere: 7,
    cleanliness: 8,
    overallValue: 6,
    privateNotes:
      "Sit at the raw bar next time — closer to the shucking station and faster service.",
    photos: 4,
  },
]

export function getVisits(): DiningVisit[] {
  return [...visits].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export function getVisit(id: string): DiningVisit | undefined {
  return visits.find((v) => v.id === id)
}

export function addVisit(visit: Omit<DiningVisit, "id">): DiningVisit {
  const newVisit: DiningVisit = { ...visit, id: crypto.randomUUID() }
  visits.push(newVisit)
  return newVisit
}

export function deleteVisit(id: string): boolean {
  const index = visits.findIndex((v) => v.id === id)
  if (index === -1) return false
  visits.splice(index, 1)
  return true
}
