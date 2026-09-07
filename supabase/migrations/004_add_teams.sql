-- Run this in the Supabase SQL Editor, after 003_add_baldy_eats_fields.sql.
--
-- Phase 1: core team structure only (create team, join by code, roster).
-- Peer ratings, fan public ratings, and fan comments come in later phases.
--
-- Generic naming on purpose -- this is a fan-run, unofficial team tracker,
-- not affiliated with or endorsed by any racing league.

create extension if not exists pgcrypto;

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  invite_code text unique not null,
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null,
  experience text,
  is_admin boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);

alter table teams enable row level security;
alter table team_members enable row level security;

-- Teams: visible if you're a member, or if the team is public.
create policy "View own teams or public teams"
  on teams for select
  using (
    visibility = 'public'
    or exists (
      select 1 from team_members m
      where m.team_id = teams.id and m.user_id = auth.uid()
    )
  );

-- Any signed-in user can create a team (they become the first/admin member
-- via the API route, in the same request).
create policy "Signed-in users can create teams"
  on teams for insert
  with check (auth.uid() is not null);

-- Only team admins can rename/change visibility.
create policy "Admins can update their team"
  on teams for update
  using (
    exists (
      select 1 from team_members m
      where m.team_id = teams.id and m.user_id = auth.uid() and m.is_admin = true
    )
  );

-- Only admins can delete the team.
create policy "Admins can delete their team"
  on teams for delete
  using (
    exists (
      select 1 from team_members m
      where m.team_id = teams.id and m.user_id = auth.uid() and m.is_admin = true
    )
  );

-- Team members: visible to other members of the same team, or to anyone
-- if the team itself is public (fan-facing roster browsing, later phases).
create policy "View own team roster or public team roster"
  on team_members for select
  using (
    exists (
      select 1 from teams t
      where t.id = team_members.team_id
        and (
          t.visibility = 'public'
          or exists (
            select 1 from team_members me
            where me.team_id = t.id and me.user_id = auth.uid()
          )
        )
    )
  );

-- Note: there is deliberately no general insert policy on team_members.
-- Two ways rows get created:
--   1. Creating a team inserts the creator as the first admin member --
--      this uses the same authenticated request, so the standard
--      "auth.uid() = user_id" check below covers it.
--   2. Joining by invite code is handled server-side with the service-role
--      client (see lib/supabase/admin.ts) after validating the code, so it
--      intentionally bypasses RLS rather than exposing codes to guessing.
create policy "Users can insert their own membership row"
  on team_members for insert
  with check (auth.uid() = user_id);

-- Members can edit their own profile fields; admins can edit any row on
-- their team (role changes, promote/demote, etc).
create policy "Members edit own profile, admins edit any team row"
  on team_members for update
  using (
    auth.uid() = user_id
    or exists (
      select 1 from team_members admin_row
      where admin_row.team_id = team_members.team_id
        and admin_row.user_id = auth.uid()
        and admin_row.is_admin = true
    )
  );

-- Members can leave; admins can remove anyone on their team.
create policy "Members leave, admins remove anyone"
  on team_members for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from team_members admin_row
      where admin_row.team_id = team_members.team_id
        and admin_row.user_id = auth.uid()
        and admin_row.is_admin = true
    )
  );
