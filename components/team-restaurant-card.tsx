import Link from "next/link"
import { TeamRestaurant } from "@/types"
import { NTBBadge } from "@/components/ntb-badge"
import { MapPin, Plus, Calendar, Users } from "lucide-react"
import { format, parseISO } from "date-fns"

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
        <div className="mt-4 space-y-6">
          {restaurant.ratings.map((r) => (
            <div key={r.id} className="border-t pt-4" style={{ borderColor: "var(--line)" }}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{r.memberDisplayName ?? "Team member"}</span>
                <NTBBadge rating={r.rating} size="sm" />
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: "var(--ink-soft)" }}>
                {r.date && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {format(parseISO(r.date), "MMM d, yyyy")}
                  </span>
                )}
                {r.companions.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" /> {r.companions.join(", ")}
                  </span>
                )}
                {r.occasion && <span className="italic">{r.occasion}</span>}
              </div>

              {r.summary && <p className="mt-2 text-sm">{r.summary}</p>}

              {(r.totalSpent > 0 || r.waitTimeMinutes > 0) && (
                <div className="mt-2 grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
                  {r.totalSpent > 0 && (
                    <div className="rounded border p-2" style={{ borderColor: "var(--line)" }}>
                      <div className="font-display text-sm font-bold">${r.totalSpent}</div>
                      <div className="text-[10px] stamp" style={{ color: "var(--ink-soft)" }}>Total Spent</div>
                    </div>
                  )}
                  {r.pricePerPerson > 0 && (
                    <div className="rounded border p-2" style={{ borderColor: "var(--line)" }}>
                      <div className="font-display text-sm font-bold">${r.pricePerPerson.toFixed(2)}</div>
                      <div className="text-[10px] stamp" style={{ color: "var(--ink-soft)" }}>Per Person</div>
                    </div>
                  )}
                  {r.waitTimeMinutes > 0 && (
                    <div className="rounded border p-2" style={{ borderColor: "var(--line)" }}>
                      <div className="font-display text-sm font-bold">{r.waitTimeMinutes}m</div>
                      <div className="text-[10px] stamp" style={{ color: "var(--ink-soft)" }}>Wait Time</div>
                    </div>
                  )}
                  <div className="rounded border p-2" style={{ borderColor: "var(--line)" }}>
                    <div className="font-display text-sm font-bold">{r.atmosphere}/10</div>
                    <div className="text-[10px] stamp" style={{ color: "var(--ink-soft)" }}>Atmosphere</div>
                  </div>
                  <div className="rounded border p-2" style={{ borderColor: "var(--line)" }}>
                    <div className="font-display text-sm font-bold">{r.cleanliness}/10</div>
                    <div className="text-[10px] stamp" style={{ color: "var(--ink-soft)" }}>Cleanliness</div>
                  </div>
                  <div className="rounded border p-2" style={{ borderColor: "var(--line)" }}>
                    <div className="font-display text-sm font-bold">{r.overallValue}/10</div>
                    <div className="text-[10px] stamp" style={{ color: "var(--ink-soft)" }}>Value</div>
                  </div>
                </div>
              )}

              {r.foodItems.length > 0 && (
                <div className="mt-3 space-y-2">
                  {r.foodItems.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <span className="font-semibold">{item.name}</span>
                        {item.wouldOrderAgain && <span className="ml-2 text-xs italic" style={{ color: "var(--ink-soft)" }}>would order again</span>}
                        {item.note && <div className="text-xs" style={{ color: "var(--ink-soft)" }}>{item.note}</div>}
                      </div>
                      <NTBBadge rating={item.rating} size="sm" />
                    </div>
                  ))}
                </div>
              )}

              {r.itemsConsidered.length > 0 && (
                <div className="mt-2 text-xs" style={{ color: "var(--ink-soft)" }}>
                  Considered: {r.itemsConsidered.map((c) => c.name).join(", ")}
                </div>
              )}

              {r.wantToTryNextTime.length > 0 && (
                <div className="mt-2 text-xs" style={{ color: "var(--ink-soft)" }}>
                  Next time: {r.wantToTryNextTime.join(", ")}
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
