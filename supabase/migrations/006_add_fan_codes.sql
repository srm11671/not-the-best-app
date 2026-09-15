-- Run this in the Supabase SQL Editor, after 005_add_team_id_to_visits.sql.
--
-- Adds a second, separate code per team: the fan code. Members share the
-- invite_code with each other to join and contribute; a team shares its
-- fan_code publicly (or with specific fans) to grant read-only viewing of
-- that team's visits plus commenting, without giving fans any ability to
-- edit the roster or log visits.

alter table teams add column if not exists fan_code text unique;

-- Backfill any existing teams with a fan code so the column can be made
-- required going forward. Uses the same alphabet as invite codes.
do $$
declare
  r record;
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code text;
begin
  for r in select id from teams where fan_code is null loop
    loop
      new_code := '';
      for i in 1..8 loop
        new_code := new_code || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
      end loop;
      exit when not exists (select 1 from teams where fan_code = new_code);
    end loop;
    update teams set fan_code = new_code where id = r.id;
  end loop;
end $$;

alter table teams alter column fan_code set not null;

-- Extend team visibility: fans (once they've redeemed the fan code) need
-- to be able to see the team row itself, not just its visits. Replaces
-- the original policy from 004_add_teams.sql.
drop policy if exists "View own teams or public teams" on teams;
create policy "View own teams, public teams, or teams you follow as a fan"
  on teams for select
  using (
    visibility = 'public'
    or exists (
      select 1 from team_members m
      where m.team_id = teams.id and m.user_id = auth.uid()
    )
    or exists (
      select 1 from team_fans f
      where f.team_id = teams.id and f.user_id = auth.uid()
    )
  );

-- Tracks who has redeemed a fan code for which team. Separate from
-- team_members -- fans aren't roster members, they're read-only viewers
-- who can comment.
create table if not exists team_fans (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null,
  redeemed_at timestamptz not null default now(),
  unique (team_id, user_id)
);

alter table team_fans enable row level security;

-- A fan can see their own fan record; team admins can see who their fans are.
create policy "Fans view own record, admins view all fans"
  on team_fans for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from team_members m
      where m.team_id = team_fans.team_id and m.user_id = auth.uid() and m.is_admin = true
    )
  );

-- Note: deliberately no general insert policy here, same reasoning as
-- team_members -- redeeming a fan code goes through the service-role
-- client after validating the code server-side (see lib/teams-store.ts).

-- Extend visit visibility: team members already see their team's visits
-- via the app's admin-client / RLS combo; this policy additionally lets
-- redeemed fans (and anyone, if the team is public) see team-tagged visits.
create policy "Fans or public-team viewers can see team visits"
  on visits for select
  using (
    team_id is not null and exists (
      select 1 from teams t
      where t.id = visits.team_id
        and (
          t.visibility = 'public'
          or exists (
            select 1 from team_fans f
            where f.team_id = t.id and f.user_id = auth.uid()
          )
          or exists (
            select 1 from team_members m
            where m.team_id = t.id and m.user_id = auth.uid()
          )
        )
    )
  );
