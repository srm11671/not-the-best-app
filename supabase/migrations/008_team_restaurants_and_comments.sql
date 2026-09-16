-- Run this in the Supabase SQL Editor, after 007_add_visit_comments.sql.
--
-- Replaces the "log a personal-style visit tagged to a team" model with a
-- shared team restaurant catalog: one member adds a restaurant once, then
-- any member can add their OWN rating to that same entry (no duplicate
-- restaurant rows). Also adds team/member-level comments and a private,
-- team-invisible rating log for fans.

create table if not exists team_restaurants (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  restaurant text not null,
  location text,
  added_by_member_id uuid references team_members(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (team_id, restaurant, location)
);

alter table team_restaurants enable row level security;

create policy "Members, fans, or public-team viewers can see team restaurants"
  on team_restaurants for select
  using (
    exists (
      select 1 from teams t
      where t.id = team_restaurants.team_id
        and (
          t.visibility = 'public'
          or exists (select 1 from team_fans f where f.team_id = t.id and f.user_id = auth.uid())
          or exists (select 1 from team_members m where m.team_id = t.id and m.user_id = auth.uid())
        )
    )
  );

create policy "Members can add team restaurants"
  on team_restaurants for insert
  with check (
    exists (
      select 1 from team_members m
      where m.team_id = team_restaurants.team_id and m.user_id = auth.uid()
    )
  );

create table if not exists team_restaurant_ratings (
  id uuid primary key default gen_random_uuid(),
  team_restaurant_id uuid not null references team_restaurants(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  member_id uuid not null references team_members(id) on delete cascade,
  rating text not null,
  summary text,
  notes text,
  food_items jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_restaurant_id, member_id)
);

alter table team_restaurant_ratings enable row level security;

create policy "Members, fans, or public-team viewers can see restaurant ratings"
  on team_restaurant_ratings for select
  using (
    exists (
      select 1 from teams t
      where t.id = team_restaurant_ratings.team_id
        and (
          t.visibility = 'public'
          or exists (select 1 from team_fans f where f.team_id = t.id and f.user_id = auth.uid())
          or exists (select 1 from team_members m where m.team_id = t.id and m.user_id = auth.uid())
        )
    )
  );

create policy "Members can add their own restaurant rating"
  on team_restaurant_ratings for insert
  with check (
    exists (
      select 1 from team_members m
      where m.id = team_restaurant_ratings.member_id
        and m.user_id = auth.uid()
        and m.team_id = team_restaurant_ratings.team_id
    )
  );

create policy "Members can update their own restaurant rating"
  on team_restaurant_ratings for update
  using (
    exists (
      select 1 from team_members m
      where m.id = team_restaurant_ratings.member_id and m.user_id = auth.uid()
    )
  );

-- Team-level and member-level comments. Separate from visit_comments,
-- which stays scoped to legacy personal DiningVisit rows tagged to a team.
create table if not exists team_comments (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  target_type text not null check (target_type in ('team','member')),
  target_member_id uuid references team_members(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists team_comments_team_id_idx on team_comments(team_id);

alter table team_comments enable row level security;

create policy "Viewable by anyone who can see the team"
  on team_comments for select
  using (
    exists (
      select 1 from teams t
      where t.id = team_comments.team_id
        and (
          t.visibility = 'public'
          or exists (select 1 from team_fans f where f.team_id = t.id and f.user_id = auth.uid())
          or exists (select 1 from team_members m where m.team_id = t.id and m.user_id = auth.uid())
        )
    )
  );

create policy "Members or fans can comment on team or member"
  on team_comments for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from teams t
      where t.id = team_comments.team_id
        and (
          exists (select 1 from team_fans f where f.team_id = t.id and f.user_id = auth.uid())
          or exists (select 1 from team_members m where m.team_id = t.id and m.user_id = auth.uid())
        )
    )
  );

-- Fans' private restaurant ratings -- never visible to the team.
create table if not exists fan_private_ratings (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  fan_id uuid not null references team_fans(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  restaurant text not null,
  location text,
  rating text not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table fan_private_ratings enable row level security;

create policy "Fans see only their own private ratings"
  on fan_private_ratings for select
  using (auth.uid() = user_id);

create policy "Fans insert only their own private ratings"
  on fan_private_ratings for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from team_fans f where f.id = fan_private_ratings.fan_id and f.user_id = auth.uid()
    )
  );
