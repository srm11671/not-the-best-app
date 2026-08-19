import Link from "next/link"
import { DiningVisit } from "@/types"
import { NTBBadge } from "@/components/ntb-badge"
import { MapPin, Calendar, Users, Image as ImageIcon } from "lucide-react"
import { format, parseISO } from "date-fns"

interface VisitCardProps {
  visit: DiningVisit
}

export function VisitCard({ visit }: VisitCardProps) {
  return (
    <Link
      href={`/visit/${visit.id}`}
      className="paper-card block rounded-md p-6 transition-transform hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl font-semibold">{visit.restaurant}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" style={{ color: "var(--ink-soft)" }}>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {visit.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> {format(parseISO(visit.date), "MMM d, yyyy")}
            </span>
            {visit.companions.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {visit.companions.join(", ")}
              </span>
            )}
            {visit.photos > 0 && (
              <span className="inline-flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5" /> {visit.photos}
              </span>
            )}
          </div>
        </div>
        <NTBBadge rating={visit.overallRating} />
      </div>
      <p className="mt-3 line-clamp-2 text-[15px] leading-relaxed">{visit.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {visit.foodItems.slice(0, 4).map((item) => (
          <span
            key={item.id}
            className="rounded border px-2 py-0.5 text-xs"
            style={{ borderColor: "var(--line)" }}
          >
            {item.name}
          </span>
        ))}
      </div>
    </Link>
  )
}
