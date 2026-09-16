import { getTeam } from "@/lib/teams-store"
import { getMyFanRatings } from "@/lib/fan-ratings-store"
import { Masthead } from "@/components/masthead"
import { FanRatingForm, FanRatingsList } from "@/components/fan-rating-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export default async function FanRatingsPage({ params }: { params: { id: string } }) {
  const team = await getTeam(params.id).catch(() => undefined)
  if (!team) notFound()

  let ratings: Awaited<ReturnType<typeof getMyFanRatings>> = []
  try {
    ratings = await getMyFanRatings(params.id)
  } catch {
    ratings = []
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Masthead />
      <Link
        href={`/teams/${params.id}`}
        className="mb-6 inline-flex items-center gap-1 text-sm underline decoration-dotted underline-offset-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to {team.name}
      </Link>

      <h2 className="mb-2 font-display text-2xl font-semibold">Your Private Ratings</h2>
      <p className="mb-6 text-sm" style={{ color: "var(--ink-soft)" }}>
        Log your own opinion of restaurants tied to this team &mdash; visible only to you, never to the team.
      </p>

      <div className="mb-8">
        <FanRatingForm teamId={params.id} />
      </div>

      <FanRatingsList ratings={ratings} />
    </div>
  )
}
