import { getPublicTeamsSummary } from "@/lib/teams-store"
import { Users, Globe } from "lucide-react"
import Link from "next/link"

// Deliberately isolated from the personal dining timeline: this component
// makes its own call to a public-only summary function (name, visibility,
// member count -- never codes, rosters, or ratings) so team data can never
// leak into or mix with the private dining experience above it.
export async function TeamsSection() {
  let teams: Awaited<ReturnType<typeof getPublicTeamsSummary>> = []
  try {
    teams = await getPublicTeamsSummary()
  } catch {
    teams = []
  }

  return (
    <section className="mt-16 border-t-2 pt-10" style={{ borderColor: "var(--ink)" }}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">Mo&apos;s Not The Best Teams</h2>
        <Link href="/teams" className="text-sm underline decoration-dotted underline-offset-4">
          View all teams
        </Link>
      </div>
      <p className="mb-6 text-sm" style={{ color: "var(--ink-soft)" }}>
        Fan-run team pages, separate from your personal dining timeline. Teams share ratings among
        members; fans follow along with a fan code.
      </p>

      {teams.length === 0 ? (
        <div className="paper-card rounded-md p-8 text-center">
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            No public teams yet.{" "}
            <Link href="/teams/new" className="underline decoration-dotted underline-offset-4">
              Create one
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="paper-card block rounded-md p-4 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-lg font-semibold">{team.name}</span>
                <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--ink-soft)" }}>
                  <Globe className="h-3 w-3" /> Public
                </span>
              </div>
              <div className="mt-1 inline-flex items-center gap-1 text-sm" style={{ color: "var(--ink-soft)" }}>
                <Users className="h-3.5 w-3.5" /> {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
