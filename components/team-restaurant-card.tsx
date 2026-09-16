import Link from "next/link"
import { TeamRestaurant } from "@/types"
import { NTBBadge } from "@/components/ntb-badge"
import { MapPin, Plus } from "lucide-react"

interface TeamRestaurantCardProps {
  teamId: string
  restaurant: TeamRestaurant
  canRate: boolean
  myMemberId?: string
}

export function TeamRestaurantCard({ teamId, restaurant, canRate, myMemberId }: TeamRestaurantCardProps) {
  const alreadyRated = myMemberId ? restaurant.ratings.some((r) => r.memberId === myMemberId) : false

  return (
    <div className="paper-card rounded-md p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl font-semibold">{restaurant.restaurant}</h3>
          {restaurant.location && (
            <div className="mt-1 inline-flex items-center gap-1 text-sm" style={{ color: "var(--ink-soft)" }}>
              <MapPin className="h-3.5 w-3.5" /> {restaurant.location}
            </div>
          )}
        </div>
        {canRate && !alreadyRated && (
          <Link
            href={`/teams/${teamId}/restaurants/${restaurant.id}/rate`}
            className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm hover:text-[--rust] hover:border-[--rust] transition-colors"
            style={{ borderColor: "var(--line)" }}
          >
            <Plus className="h-3.5 w-3.5" /> Add your rating
          </Link>
        )}
      </div>

      {restaurant.ratings.length === 0 ? (
        <p className="mt-4 text-sm" style={{ color: "var(--ink-soft)" }}>
          No ratings yet.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {restaurant.ratings.map((r) => (
            <div key={r.id} className="border-t pt-4" style={{ borderColor: "var(--line)" }}>
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold">{r.memberDisplayName ?? "Team member"}</span>
                <NTBBadge rating={r.rating} size="sm" />
              </div>
              {r.summary && <p className="mt-1 text-sm">{r.summary}</p>}
              {r.foodItems.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.foodItems.map((item) => (
                    <span
                      key={item.id}
                      className="rounded border px-2 py-0.5 text-xs"
                      style={{ borderColor: "var(--line)" }}
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              )}
              {r.notes && (
                <p className="mt-2 text-xs italic" style={{ color: "var(--ink-soft)" }}>
                  {r.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
