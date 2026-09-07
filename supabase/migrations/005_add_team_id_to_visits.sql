-- Run this in the Supabase SQL Editor, after 004_add_teams.sql.
--
-- Lets a dining visit be tagged to a team. Team-tagged visits are excluded
-- from the main personal timeline and shown only on that team's page.

alter table visits add column if not exists team_id uuid references teams(id) on delete set null;

create index if not exists visits_team_id_idx on visits(team_id);
