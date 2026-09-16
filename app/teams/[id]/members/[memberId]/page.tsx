import { getTeam, getTeamMember, getTeamFanForUser } from "@/lib/teams-store"
import { getTeamComments } from "@/lib/team-comments-store"
import { createClient } from "@/lib/supabase/server"
import { Masthead } from "@/components/masthead"
import { CommentThread } from "@/components/comment-thread"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

const AUTH_REQUIRED = process.env.REQUIRE_AUTH === "true"

export default async function TeamMemberPage({
  params,
}: {
  params: { id: string; memberId: string }
}) {
  let team
  let member
  try {
    team = await getTeam(params.id)
    member = team ? await getTeamMember(params.id, params.memberId) : undefined
  } catch {
    notFound()
  }
  if (!team || !member) notFound()

  let canComment = !AUTH_REQUIRED
  let viewerDisplayName: string | undefined
  if (AUTH_REQUIRED) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const fan = await getTeamFanForUser(team.id, user.id).catch(() => undefined)
      canComment = true
      viewerDisplayName = fan?.displayName
    }
  }

  let comments: Awaited<ReturnType<typeof getTeamComments>> = []
  try {
    comments = await getTeamComments(team.id, member.id)
  } catch {
    comments = []
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Masthead />
      <Link
        href={`/teams/${team.id}`}
        className="mb-6 inline-flex items-center gap-1 text-sm underline decoration-dotted underline-offset-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to {team.name}
      </Link>

      <div className="paper-card rounded-md p-6 mb-6">
        <h2 className="font-display text-2xl font-semibold">
          {member.displayName}
          {member.isAdmin && (
            <span
              className="ml-2 rounded-full border px-2 py-0.5 text-xs stamp"
              style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}
            >
              Admin
            </span>
          )}
        </h2>
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>{member.role}</p>
        {member.experience && <p className="mt-2 text-sm">{member.experience}</p>}
      </div>

      <CommentThread
        apiPath={`/api/teams/${team.id}/members/${member.id}/comments`}
        comments={comments}
        canComment={canComment}
        defaultDisplayName={viewerDisplayName}
      />
    </div>
  )
}
