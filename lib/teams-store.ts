import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Team, TeamMember } from "@/types"

// Same toggle as lib/store.ts -- see that file for the full explanation.
const AUTH_REQUIRED = process.env.REQUIRE_AUTH === "false"

interface TeamRow {
  id: string
  name: string
  slug: string
  invite_code: string
  visibility: "private" | "public"
  created_by: string | null
  created_at: string
}

interface TeamMemberRow {
  id: string
  team_id: string
  user_id: string | null
  display_name: string
  role: string
  experience: string | null
  is_admin: boolean
  joined_at: string
}

function rowToTeam(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    inviteCode: row.invite_code,
    visibility: row.visibility,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}

function rowToMember(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    teamId: row.team_id,
    userId: row.user_id,
    displayName: row.display_name,
    role: row.role,
    experience: row.experience ?? "",
    isAdmin: row.is_admin,
    joinedAt: row.joined_at,
  }
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  const suffix = Math.random().toString(36).slice(2, 7)
  return `${base || "team"}-${suffix}`
}

function generateInviteCode(): string {
  // Short, human-typeable code -- uppercase letters + digits, no ambiguous chars.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 8; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
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

// Teams you belong to, plus every public team (for browsing).
export async function getTeams(): Promise<Team[]> {
  const { supabase } = await getClientAndUser()
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return (data as TeamRow[]).map(rowToTeam)
}

export async function getTeam(id: string): Promise<Team | undefined> {
  const { supabase } = await getClientAndUser()
  const { data, error } = await supabase.from("teams").select("*").eq("id", id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? rowToTeam(data as TeamRow) : undefined
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const { supabase } = await getClientAndUser()
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", teamId)
    .order("joined_at", { ascending: true })
  if (error) throw new Error(error.message)
  return (data as TeamMemberRow[]).map(rowToMember)
}

// Creates the team, then adds the creator as its first admin member.
// Not wrapped in a DB transaction (Supabase JS doesn't expose one directly),
// so if the second insert fails we clean up the orphaned team row.
export async function createTeam(
  name: string,
  creatorDisplayName: string,
  creatorRole: string
): Promise<Team> {
  const { supabase, user } = await getClientAndUser()

  const teamRow = {
    name,
    slug: slugify(name),
    invite_code: generateInviteCode(),
    visibility: "private" as const,
    created_by: AUTH_REQUIRED && user ? user.id : null,
  }

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert(teamRow)
    .select("*")
    .single()
  if (teamError) throw new Error(teamError.message)

  const memberRow = {
    team_id: team.id,
    user_id: AUTH_REQUIRED && user ? user.id : null,
    display_name: creatorDisplayName,
    role: creatorRole,
    is_admin: true,
  }

  const { error: memberError } = await supabase.from("team_members").insert(memberRow)
  if (memberError) {
    await supabase.from("teams").delete().eq("id", team.id)
    throw new Error(memberError.message)
  }

  return rowToTeam(team as TeamRow)
}

export async function updateTeam(
  id: string,
  updates: { name?: string; visibility?: "private" | "public" }
): Promise<Team | undefined> {
  const { supabase } = await getClientAndUser()
  const { data, error } = await supabase
    .from("teams")
    .update(updates)
    .eq("id", id)
    .select("*")
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? rowToTeam(data as TeamRow) : undefined
}

export async function regenerateInviteCode(id: string): Promise<Team | undefined> {
  const { supabase } = await getClientAndUser()
  const { data, error } = await supabase
    .from("teams")
    .update({ invite_code: generateInviteCode() })
    .eq("id", id)
    .select("*")
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? rowToTeam(data as TeamRow) : undefined
}

export async function deleteTeam(id: string): Promise<boolean> {
  const { supabase } = await getClientAndUser()
  const { error } = await supabase.from("teams").delete().eq("id", id)
  if (error) throw new Error(error.message)
  return true
}

// Join-by-code always goes through the service-role client, after
// validating the code ourselves -- this keeps invite codes from being
// guessable via RLS-select timing/behavior, matching the same trust
// boundary the Stripe webhook uses elsewhere in this app.
export async function joinTeamByCode(
  code: string,
  displayName: string,
  role: string,
  experience: string,
  userId: string | null
): Promise<{ team: Team; member: TeamMember }> {
  const admin = createAdminClient()

  const { data: team, error: teamError } = await admin
    .from("teams")
    .select("*")
    .eq("invite_code", code.trim().toUpperCase())
    .maybeSingle()
  if (teamError) throw new Error(teamError.message)
  if (!team) throw new Error("Invalid invite code")

  const memberRow = {
    team_id: team.id,
    user_id: AUTH_REQUIRED ? userId : null,
    display_name: displayName,
    role,
    experience: experience || null,
    is_admin: false,
  }

  const { data: member, error: memberError } = await admin
    .from("team_members")
    .insert(memberRow)
    .select("*")
    .single()
  if (memberError) {
    if (memberError.code === "23505") {
      throw new Error("You're already on this team")
    }
    throw new Error(memberError.message)
  }

  return { team: rowToTeam(team as TeamRow), member: rowToMember(member as TeamMemberRow) }
}
