import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Team, TeamMember, TeamFan } from "@/types"

// Same toggle as lib/store.ts -- see that file for the full explanation.
const AUTH_REQUIRED = process.env.REQUIRE_AUTH === "true"

interface TeamRow {
  id: string
  name: string
  slug: string
  invite_code: string
  fan_code: string
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

interface TeamFanRow {
  id: string
  team_id: string
  user_id: string | null
  display_name: string
  redeemed_at: string
}

function rowToTeam(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    inviteCode: row.invite_code,
    fanCode: row.fan_code,
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

function rowToFan(row: TeamFanRow): TeamFan {
  return {
    id: row.id,
    teamId: row.team_id,
    userId: row.user_id,
    displayName: row.display_name,
    redeemedAt: row.redeemed_at,
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

function generateCode(): string {
  // Short, human-typeable code -- uppercase letters + digits, no ambiguous chars.
  // Used for both team codes (members) and fan codes (read-only viewers).
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

// Teams you belong to, plus every public team (for browsing). Codes are
// stripped by the API layer before this ever reaches a non-owner --
// this function itself always returns the raw row.
export async function getTeams(): Promise<Team[]> {
  const { supabase } = await getClientAndUser()
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return (data as TeamRow[]).map(rowToTeam)
}

// Public, homepage-safe team summary. Deliberately its own query (not a
// filtered version of getTeams()) so the "Mo's Not The Best Teams" section
// on the main page never touches invite/fan codes, rosters, or ratings --
// it only ever selects name + visibility + a member count.
export async function getPublicTeamsSummary(): Promise<
  { id: string; name: string; visibility: "private" | "public"; memberCount: number }[]
> {
  const admin = createAdminClient()
  const { data: teams, error } = await admin
    .from("teams")
    .select("id, name, visibility")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(50)
  if (error) throw new Error(error.message)

  const ids = (teams ?? []).map((t) => t.id)
  if (ids.length === 0) return []

  const { data: members } = await admin.from("team_members").select("team_id").in("team_id", ids)
  const counts = new Map<string, number>()
  for (const m of members ?? []) {
    counts.set(m.team_id, (counts.get(m.team_id) ?? 0) + 1)
  }

  return (teams ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    visibility: t.visibility,
    memberCount: counts.get(t.id) ?? 0,
  }))
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

export async function getTeamMember(teamId: string, memberId: string): Promise<TeamMember | undefined> {
  const { supabase } = await getClientAndUser()
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", teamId)
    .eq("id", memberId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? rowToMember(data as TeamMemberRow) : undefined
}

// Fans who've redeemed this team's fan code. Admin-only view (see the
// RLS policy on team_fans).
export async function getTeamFans(teamId: string): Promise<TeamFan[]> {
  const { supabase } = await getClientAndUser()
  const { data, error } = await supabase
    .from("team_fans")
    .select("*")
    .eq("team_id", teamId)
    .order("redeemed_at", { ascending: true })
  if (error) throw new Error(error.message)
  return (data as TeamFanRow[]).map(rowToFan)
}

// Whether/how the given user has redeemed this team's fan code. Used by
// the team page to decide what a visitor who isn't a member gets to see,
// and to prefill their display name on the comment form.
export async function getTeamFanForUser(teamId: string, userId: string): Promise<TeamFan | undefined> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("team_fans")
    .select("*")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? rowToFan(data as TeamFanRow) : undefined
}

// Creates the team, then adds the creator as its first admin member (and
// owner -- created_by is the only user who will ever see this team's codes).
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
    invite_code: generateCode(),
    fan_code: generateCode(),
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
    .update({ invite_code: generateCode() })
    .eq("id", id)
    .select("*")
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? rowToTeam(data as TeamRow) : undefined
}

export async function regenerateFanCode(id: string): Promise<Team | undefined> {
  const { supabase } = await getClientAndUser()
  const { data, error } = await supabase
    .from("teams")
    .update({ fan_code: generateCode() })
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
// validating the code ourselves -- this keeps team codes from being
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
  if (!team) throw new Error("Invalid team code")

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

// Same trust boundary as joinTeamByCode -- the fan code is validated
// server-side with the service-role client, never exposed to RLS-select
// guessing. Fans get read-only viewing of the team's restaurant catalog
// plus commenting, but never a roster row or edit rights.
export async function joinTeamAsFan(
  code: string,
  displayName: string,
  userId: string | null
): Promise<{ team: Team; fan: TeamFan }> {
  const admin = createAdminClient()

  const { data: team, error: teamError } = await admin
    .from("teams")
    .select("*")
    .eq("fan_code", code.trim().toUpperCase())
    .maybeSingle()
  if (teamError) throw new Error(teamError.message)
  if (!team) throw new Error("Invalid fan code")

  const fanRow = {
    team_id: team.id,
    user_id: AUTH_REQUIRED ? userId : null,
    display_name: displayName,
  }

  const { data: fan, error: fanError } = await admin
    .from("team_fans")
    .insert(fanRow)
    .select("*")
    .single()
  if (fanError) {
    if (fanError.code === "23505") {
      throw new Error("You're already following this team")
    }
    throw new Error(fanError.message)
  }

  return { team: rowToTeam(team as TeamRow), fan: rowToFan(fan as TeamFanRow) }
}
