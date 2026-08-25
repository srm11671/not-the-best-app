import { NTBRating, scoreToNTBTier, NTB_TIERS } from "@/types"
import { Flame } from "lucide-react"

interface CriticCompareBadgeProps {
  overallRating: NTBRating
  criticRating: number
  criticReviewUrl?: string
  criticName?: string
}

export function CriticCompareBadge({ overallRating, criticRating, criticReviewUrl, criticName }: CriticCompareBadgeProps) {
  const name = criticName?.trim() || "Local critic"
  const criticTier = scoreToNTBTier(criticRating)
  const matches = criticTier === overallRating
  const tierInfo = NTB_TIERS.find((t) => t.id === criticTier)

  const content = (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
      style={{
        borderColor: matches ? "var(--rust)" : "var(--line)",
        color: matches ? "var(--rust)" : "var(--ink-soft)",
      }}
      title={
        matches
          ? `Your rating matches ${name}'s tier`
          : `${name} rated this ${criticRating}/10 (roughly "${tierInfo?.label}") -- different from your rating`
      }
    >
      <Flame className="h-3 w-3" />
      {name}: {criticRating}/10 {matches ? "· Matches you" : "· Differs from you"}
    </span>
  )

  if (!criticReviewUrl) return content

  return (
    <a href={criticReviewUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="hover:opacity-80 transition-opacity">
      {content}
    </a>
  )
}