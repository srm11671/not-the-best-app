import { getTeam, getTeamMembers } from "@/lib/teams-store"
import { getTeamVisits } from "@/lib/store"
import { createClient } from "@/lib/supabase/server"
import { Masthead } from "@/components/masthead"
import { InviteCodePanel } from "@/components/invite-code-panel"
import { VisitCard } from "@/components/visit-card"
import { Lock, Globe, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

const AUTH_REQUIRED = process.env.REQUIRE_AUTH === "false"

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  let team
  let members
  let visits: Awaited<ReturnType<typeof getTeamVisits>> = []
  try {
    team = await getTeam(params.id)
    members = team ? await getTeamMembers(params.id) : []
    visits = team ? await getTeamVisits(params.id) : []
  } catch {
    notFound()
  }

  if (!team) notFound()

  let isAdmin = !AUTH_REQUIRED
  if (AUTH_REQUIRED) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    isAdmin = !!user && members.some((m) => m.userId === user.id && m.isAdmin)
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Masthead />

      <Link href="/teams" className="mb-6 inline-flex items-center gap-1 text-sm underline decoration-dotted underline-offset-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Racing Teams
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold">{team.name}</h2>
          <span
            className="mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
            style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}
          >
            {team.visibility === "public" ? (
              <>
                <Globe className="h-3 w-3" /> Public
              </>
            ) : (
              <>
                <Lock className="h-3 w-3" /> Private
              </>
            )}
          </span>
        </div>
      </div>

      <p className="mb-6 text-sm" style={{ color: "var(--ink-soft)" }}>
        Fan-created team page -- not affiliated with or endorsed by any official league, series, or organization.
      </p>

      {isAdmin && (
        <div className="mb-8">
          <InviteCodePanel teamId={team.id} inviteCode={team.inviteCode} />
        </div>
      )}

      <h3 className="mb-4 font-display text-xl font-semibold">Roster</h3>
      {members.length === 0 ? (
        <div className="paper-card rounded-md p-8 text-center">
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>No members yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="paper-card flex items-center justify-between gap-4 rounded-md p-4">
              <div>
                <div className="font-semibold">
                  {member.displayName}
                  {member.isAdmin && (
                    <span className="ml-2 rounded-full border px-2 py-0.5 text-xs stamp" style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}>
                      Admin
                    </span>
                  )}
                </div>
                <div className="text-sm" style={{ color: "var(--ink-soft)" }}>{member.role}</div>
                {member.experience && (
                  <div className="mt-1 text-sm">{member.experience}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 mb-4 flex items-center justify-between">
        <h3 className="font-display text-xl font-semibold">Team Visits</h3>
        <Link
          href={`/visit/new?teamId=${team.id}`}
          className="rounded-full text-[--paper] px-4 py-2 text-sm hover:opacity-90 transition-opacity font-semibold"
          style={{ backgroundColor: "var(--ink)" }}
        >
          + Log a Visit
        </Link>
      </div>
      {visits.length === 0 ? (
        <div className="paper-card rounded-md p-8 text-center">
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            No visits logged for this team yet.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {visits.map((visit) => (
            <VisitCard key={visit.id} visit={visit} />
          ))}
        </div>
      )}
    </div>
  )
}
