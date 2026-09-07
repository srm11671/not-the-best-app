import { getTeams } from "@/lib/teams-store"
import { Masthead } from "@/components/masthead"
import { TeamCard } from "@/components/team-card"
import Link from "next/link"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export default async function TeamsPage() {
  let teams: Awaited<ReturnType<typeof getTeams>> = []
  let loadError = false
  try {
    teams = await getTeams()
  } catch {
    loadError = true
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Masthead />

      <div className="mb-2">
        <h2 className="font-display text-2xl font-semibold">Racing Teams</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
          Fan-created drag racing team pages. Not affiliated with or endorsed by any official league,
          series, or organization.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Link href="/teams/new" className="text-sm underline decoration-dotted underline-offset-4">
          + Create a team
        </Link>
        <Link href="/teams/join" className="text-sm underline decoration-dotted underline-offset-4">
          Join with an invite code
        </Link>
      </div>

      {loadError ? (
        <div className="paper-card rounded-md p-10 text-center">
          <p className="font-display text-xl mb-2">Sign in to see your teams.</p>
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            <Link href="/login" className="underline decoration-dotted underline-offset-4">
              Log in
            </Link>{" "}
            to create or join a racing team.
          </p>
        </div>
      ) : teams.length === 0 ? (
        <div className="paper-card rounded-md p-10 text-center">
          <p className="font-display text-xl mb-2">No teams yet.</p>
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            Create a team, or join one with an invite code from a teammate.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  )
}
