import { NTBRating, scoreToNTBTier, NTB_TIERS } from "@/types"
import { Flame } from "lucide-react"

interface BaldyCompareBadgeProps {
  overallRating: NTBRating
  baldyRating: number
  baldyReviewUrl?: string
}

export function BaldyCompareBadge({ overallRating, baldyRating, baldyReviewUrl }: BaldyCompareBadgeProps) {
  const baldyTier = scoreToNTBTier(baldyRating)
  const matches = baldyTier === overallRating
  const tierInfo = NTB_TIERS.find((t) => t.id === baldyTier)

  const content = (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
      style={{
        borderColor: matches ? "var(--rust)" : "var(--line)",
        color: matches ? "var(--rust)" : "var(--ink-soft)",
      }}
      title={
        matches
          ? "Your rating matches Baldy Eats' tier"
          : `Baldy Eats rated this ${baldyRating}/10 (roughly "${tierInfo?.label}") -- different from your rating`
      }
    >
      <Flame className="h-3 w-3" />
      Baldy: {baldyRating}/10 {matches ? "· Matches you" : "· Differs from you"}
    </span>
  )

  if (!baldyReviewUrl) return content

  return (
    <a
      href={baldyReviewUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="hover:opacity-80 transition-opacity"
    >
      {content}
    </a>
  )
}
