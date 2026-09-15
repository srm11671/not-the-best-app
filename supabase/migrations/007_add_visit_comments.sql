-- Run this in the Supabase SQL Editor, after 006_add_fan_codes.sql.
--
-- Lets team members and redeemed fans comment on a team's visits.

-- Note: visits.id is text (app-generated via crypto.randomUUID()), not a
-- native uuid column, so visit_id below matches that type.
create table if not exists visit_comments (
  id uuid primary key default gen_random_uuid(),
  visit_id text not null references visits(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists visit_comments_visit_id_idx on visit_comments(visit_id);

alter table visit_comments enable row level security;

-- Anyone who can see the team (member, redeemed fan, or public team) can
-- read its comments.
create policy "Viewable by anyone who can see the team"
  on visit_comments for select
  using (
    exists (
      select 1 from teams t
      where t.id = visit_comments.team_id
        and (
          t.visibility = 'public'
          or exists (select 1 from team_fans f where f.team_id = t.id and f.user_id = auth.uid())
          or exists (select 1 from team_members m where m.team_id = t.id and m.user_id = auth.uid())
        )
    )
  );

-- Only members or redeemed fans of the team can post a comment -- not
-- just anyone who happens to be able to view a public team.
create policy "Members or fans can comment"
  on visit_comments for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from teams t
      where t.id = visit_comments.team_id
        and (
          exists (select 1 from team_fans f where f.team_id = t.id and f.user_id = auth.uid())
          or exists (select 1 from team_members m where m.team_id = t.id and m.user_id = auth.uid())
        )
    )
  );

-- Commenters can delete their own comments; team admins can moderate/delete anyone's.
create policy "Authors delete own comments, admins delete any team comment"
  on visit_comments for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from team_members m
      where m.team_id = visit_comments.team_id and m.user_id = auth.uid() and m.is_admin = true
    )
  );
