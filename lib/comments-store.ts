import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { VisitComment } from "@/types"
import { getTeamFanForUser } from "@/lib/teams-store"

// Same toggle as lib/store.ts -- see that file for the full explanation.
const AUTH_REQUIRED = process.env.REQUIRE_AUTH === "true"

interface VisitCommentRow {
  id: string
  visit_id: string
  team_id: string
  user_id: string | null
  display_name: string
  body: string
  created_at: string
}

function rowToComment(row: VisitCommentRow): VisitComment {
  return {
    id: row.id,
    visitId: row.visit_id,
    teamId: row.team_id,
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

export async function getVisitComments(visitId: string): Promise<VisitComment[]> {
  const { supabase } = await getClientAndUser()
  const { data, error } = await supabase
    .from("visit_comments")
    .select("*")
    .eq("visit_id", visitId)
    .order("created_at", { ascending: true })
  if (error) throw new Error(error.message)
  return (data as VisitCommentRow[]).map(rowToComment)
}

// Only team members or redeemed fans of the team can comment -- checked
// here in addition to the RLS insert policy, so a rejected attempt gets
// a clear error message instead of a generic RLS failure.
export async function addComment(
  visitId: string,
  teamId: string,
  displayName: string,
  body: string
): Promise<VisitComment> {
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
    visit_id: visitId,
    team_id: teamId,
    user_id: AUTH_REQUIRED && user ? user.id : null,
    display_name: displayName,
    body,
  }

  const { data, error } = await supabase.from("visit_comments").insert(row).select("*").single()
  if (error) throw new Error(error.message)
  return rowToComment(data as VisitCommentRow)
}
