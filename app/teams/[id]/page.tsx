import { getTeam, getTeamMembers, getTeamFanForUser } from "@/lib/teams-store"
import { getTeamVisits } from "@/lib/store"
import { getVisitComments } from "@/lib/comments-store"
import { createClient } from "@/lib/supabase/server"
import { Masthead } from "@/components/masthead"
import { InviteCodePanel } from "@/components/invite-code-panel"
import { FanCodePanel } from "@/components/fan-code-panel"
import { CommentThread } from "@/components/comment-thread"
import { VisitCard } from "@/components/visit-card"
import { Lock, Globe, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

const AUTH_REQUIRED = process.env.REQUIRE_AUTH === "true"

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  let team
  let members: Awaited<ReturnType<typeof getTeamMembers>> = []
  try {
    team = await getTeam(params.id)
    members = team ? await getTeamMembers(params.id) : []
  } catch {
    notFound()
  }

  if (!team) notFound()

  let isMember = !AUTH_REQUIRED
  let isAdmin = !AUTH_REQUIRED
  let isFan = !AUTH_REQUIRED
  let memberDisplayName: string | undefined
  let fanDisplayName: string | undefined

  if (AUTH_REQUIRED) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const myMembership = user ? members.find((m) => m.userId === user.id) : undefined
    isMember = !!myMembership
    isAdmin = !!myMembership?.isAdmin
    memberDisplayName = myMembership?.displayName

    if (!isMember && user) {
      const fanRecord = await getTeamFanForUser(team.id, user.id)
      isFan = !!fanRecord
      fanDisplayName = fanRecord?.displayName
    }
  }

  const isPublic = team.visibility === "public"
  const canView = isMember || isFan || isPublic
  const canComment = isMember || isFan || isPublic
  const viewerDisplayName = memberDisplayName ?? fanDisplayName

  if (!canView) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Masthead />
        <Link href="/teams" className="mb-6 inline-flex items-center gap-1 text-sm underline decoration-dotted underline-offset-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Racing Teams
        </Link>
        <div className="paper-card rounded-md p-10 text-center">
          <p className="font-display text-xl mb-2">{team.name}</p>
          <p className="text-sm mb-6" style={{ color: "var(--ink-soft)" }}>
            This team's page is private. Ask a teammate for an invite code, or a fan code to follow along.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/teams/join" className="text-sm underline decoration-dotted underline-offset-4">
              Join with an invite code
            </Link>
            <Link href="/teams/fan-join" className="text-sm underline decoration-dotted underline-offset-4">
              View with a fan code
            </Link>
          </div>
        </div>
      </div>
    )
  }

  let visits: Awaited<ReturnType<typeof getTeamVisits>> = []
  try {
    visits = await getTeamVisits(params.id)
  } catch {
    visits = []
  }

  const visitComments = await Promise.all(
    visits.map(async (visit) => {
      try {
        return await getVisitComments(visit.id)
      } catch {
        return []
      }
    })
  )

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Masthead />

      <Link href="/teams" className="mb-6 inline-flex items-center gap-1 text-sm underline decoration-dotted underline-offset-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Racing Teams
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold">{team.name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
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
            {!isMember && isFan && (
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}
              >
                Fan view
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="mb-6 text-sm" style={{ color: "var(--ink-soft)" }}>
        Fan-created team page -- not affiliated with or endorsed by any official league, series, or organization.
      </p>

      {isAdmin && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <InviteCodePanel teamId={team.id} inviteCode={team.inviteCode} />
          <FanCodePanel teamId={team.id} fanCode={team.fanCode} />
        </div>
      )}

      {(isMember || isAdmin) && (
        <>
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
        </>
      )}

      <div className="mt-10 mb-4 flex items-center justify-between">
        <h3 className="font-display text-xl font-semibold">Team Visits</h3>
        {(isMember || isAdmin) && (
          <Link
            href={`/visit/new?teamId=${team.id}`}
            className="rounded-full text-[--paper] px-4 py-2 text-sm hover:opacity-90 transition-opacity font-semibold"
            style={{ backgroundColor: "var(--ink)" }}
          >
            + Log a Visit
          </Link>
        )}
      </div>
      {visits.length === 0 ? (
        <div className="paper-card rounded-md p-8 text-center">
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            No visits logged for this team yet.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {visits.map((visit, i) => (
            <div key={visit.id}>
              <VisitCard visit={visit} />
              <CommentThread
                visitId={visit.id}
                comments={visitComments[i]}
                canComment={canComment}
                defaultDisplayName={viewerDisplayName}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
