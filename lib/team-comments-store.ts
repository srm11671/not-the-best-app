import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { TeamComment } from "@/types"
import { getTeamFanForUser } from "@/lib/teams-store"

const AUTH_REQUIRED = process.env.REQUIRE_AUTH === "true"

interface TeamCommentRow {
  id: string
  team_id: string
  target_type: "team" | "member"
  target_member_id: string | null
  user_id: string | null
  display_name: string
  body: string
  created_at: string
}

function rowToComment(row: TeamCommentRow): TeamComment {
  return {
    id: row.id,
    teamId: row.team_id,
    targetType: row.target_type,
    targetMemberId: row.target_member_id,
    userId: row.user_id,
    displayName: row.display_name,
    body: row.body,
    createdAt: row.created_at,
  }
}

async function getClientAndUser() {
  if (!AUTH_REQUIRED) {
    return { supabase: createAdminClient(), user: null as { id: string } | null }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  return { supabase, user }
}

// targetMemberId omitted (or null) = team-level comments.
export async function getTeamComments(
  teamId: string,
  targetMemberId?: string
): Promise<TeamComment[]> {
  const { supabase } = await getClientAndUser()
  let query = supabase.from("team_comments").select("*").eq("team_id", teamId)
  query = targetMemberId
    ? query.eq("target_type", "member").eq("target_member_id", targetMemberId)
    : query.eq("target_type", "team")
  const { data, error } = await query.order("created_at", { ascending: true })
  if (error) throw new Error(error.message)
  return (data as TeamCommentRow[]).map(rowToComment)
}

// Only team members or redeemed fans of the team can comment.
export async function addTeamComment(
  teamId: string,
  displayName: string,
  body: string,
  targetMemberId?: string
): Promise<TeamComment> {
  const { supabase, user } = await getClientAndUser()

  if (AUTH_REQUIRED && user) {
    const { data: member } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .maybeSingle()
    if (!member) {
      const fan = await getTeamFanForUser(teamId, user.id)
      if (!fan) throw new Error("Only team members or fans who've redeemed the fan code can comment")
    }
  }

  const row = {
    team_id: teamId,
    target_type: targetMemberId ? ("member" as const) : ("team" as const),
    target_member_id: targetMemberId ?? null,
    user_id: AUTH_REQUIRED && user ? user.id : null,
    display_name: displayName,
    body,
  }

  const { data, error } = await supabase.from("team_comments").insert(row).select("*").single()
  if (error) throw new Error(error.message)
  return rowToComment(data as TeamCommentRow)
}
