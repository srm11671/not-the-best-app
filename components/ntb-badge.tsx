import { NTB_TIERS, NTBRating } from "@/types"
import { cn } from "@/lib/utils"

interface NTBBadgeProps {
  rating: NTBRating
  size?: "sm" | "md" | "lg"
  showTagline?: boolean
}

export function NTBBadge({ rating, size = "md", showTagline = false }: NTBBadgeProps) {
  const tier = NTB_TIERS.find((t) => t.id === rating)!

  const sizeClasses = {
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3.5 py-1.5 gap-2",
  }

  return (
    <div className="inline-flex flex-col items-start">
      <div
        className={cn(
          "inline-flex items-center rounded-full border font-semibold uppercase tracking-wide stamp",
          sizeClasses[size]
        )}
        style={{
          color: tier.color,
          borderColor: tier.color,
          backgroundColor: `${tier.color}14`,
        }}
      >
        <span aria-hidden>{tier.glyph}</span>
        <span>{tier.label}</span>
      </div>
      {showTagline && (
        <span className="mt-1 text-xs italic text-ink-soft" style={{ color: "var(--ink-soft)" }}>
          {tier.tagline}
        </span>
      )}
    </div>
  )
}
