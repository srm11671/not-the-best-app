import { getTeam, getTeamMembers, getTeamFanForUser } from "@/lib/teams-store"
import { getTeamRestaurants } from "@/lib/team-restaurants-store"
import { getTeamComments } from "@/lib/team-comments-store"
import { createClient } from "@/lib/supabase/server"
import { Masthead } from "@/components/masthead"
import { InviteCodePanel } from "@/components/invite-code-panel"
import { FanCodePanel } from "@/components/fan-code-panel"
import { CommentThread } from "@/components/comment-thread"
import { TeamRestaurantCard } from "@/components/team-restaurant-card"
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
  let isOwner = !AUTH_REQUIRED
  let isFan = !AUTH_REQUIRED
  let myMemberId: string | undefined
  let memberDisplayName: string | undefined
  let fanDisplayName: string | undefined

  if (AUTH_REQUIRED) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const myMembership = user ? members.find((m) => m.userId === user.id) : undefined
    isMember = !!myMembership
    myMemberId = myMembership?.id
    memberDisplayName = myMembership?.displayName
    isOwner = !!user && team.createdBy === user.id

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
  // A viewer only ever gets ONE role at a time: owners/members manage the team
  // and never see fan-only affordances, even while REQUIRE_AUTH is off and
  // every flag defaults to true. Fan-only UI (the private-ratings link, the
  // "Fan view" badge) must always check `!isMember` first.
  const isFanOnly = isFan && !isMember

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
            This team's page is private. Ask a teammate for a team code, or a fan code to follow along.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/teams/join" className="text-sm underline decoration-dotted underline-offset-4">
              Join with a team code
            </Link>
            <Link href="/teams/fan-join" className="text-sm underline decoration-dotted underline-offset-4">
              View with a fan code
            </Link>
          </div>
        </div>
      </div>
    )
  }

  let restaurants: Awaited<ReturnType<typeof getTeamRestaurants>> = []
  try {
    restaurants = await getTeamRestaurants(params.id)
  } catch {
    restaurants = []
  }

  let teamComments: Awaited<ReturnType<typeof getTeamComments>> = []
  try {
    teamComments = await getTeamComments(team.id)
  } catch {
    teamComments = []
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
            {isFanOnly && (
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}
              >
                Fan view
              </span>
            )}
          </div>
        </div>
        {isFanOnly && (
          <Link
            href={`/teams/${team.id}/fan-ratings`}
            className="text-sm underline decoration-dotted underline-offset-4"
          >
            My private ratings
          </Link>
        )}
      </div>

      {isOwner && (
        <p className="mb-6 text-sm" style={{ color: "var(--ink-soft)" }}>
          Only you can see and share this team's codes below — they're never shown anywhere public.
        </p>
      )}

      {isOwner && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <InviteCodePanel teamId={team.id} inviteCode={team.inviteCode ?? ""} />
          <FanCodePanel teamId={team.id} fanCode={team.fanCode ?? ""} />
        </div>
      )}

      {(isMember || isOwner) && (
        <>
          <h3 className="mb-4 font-display text-xl font-semibold">Roster</h3>
          {members.length === 0 ? (
            <div className="paper-card rounded-md p-8 text-center">
              <p className="text-sm" style={{ color: "var(--ink-soft)" }}>No members yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <Link
                  key={member.id}
                  href={`/teams/${team.id}/members/${member.id}`}
                  className="paper-card flex items-center justify-between gap-4 rounded-md p-4 block hover:-translate-y-0.5 transition-transform"
                >
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
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-10 mb-4 flex items-center justify-between">
        <h3 className="font-display text-xl font-semibold">Restaurants</h3>
        {isMember && (
          <Link
            href={`/teams/${team.id}/restaurants/new`}
            className="rounded-full text-[--paper] px-4 py-2 text-sm hover:opacity-90 transition-opacity font-semibold"
            style={{ backgroundColor: "var(--ink)" }}
          >
            + Add a Restaurant
          </Link>
        )}
      </div>
      {restaurants.length === 0 ? (
        <div className="paper-card rounded-md p-8 text-center">
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            No restaurants logged for this team yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {restaurants.map((r) => (
            <TeamRestaurantCard
              key={r.id}
              teamId={team.id}
              restaurant={r}
              canRate={isMember}
              myMemberId={myMemberId}
            />
          ))}
        </div>
      )}

      <div className="mt-10">
        <CommentThread
          apiPath={`/api/teams/${team.id}/comments`}
          comments={teamComments}
          canComment={canComment}
          defaultDisplayName={viewerDisplayName}
        />
      </div>
    </div>
  )
}
