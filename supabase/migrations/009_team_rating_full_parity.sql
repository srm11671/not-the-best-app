-- Run this in the Supabase SQL Editor, after 008_team_restaurants_and_comments.sql.
--
-- Brings a team member's restaurant rating up to full parity with the personal
-- "Log a Dining Memory" form (DiningVisit) so the Team "Add a Restaurant" /
-- "Rate" flow captures the exact same fields as the private experience.

alter table team_restaurant_ratings
  add column if not exists visit_date date,
  add column if not exists occasion text,
  add column if not exists companions text[] not null default '{}',
  add column if not exists service_notes text[] not null default '{}',
  add column if not exists items_considered jsonb not null default '[]',
  add column if not exists want_to_try_next_time text[] not null default '{}',
  add column if not exists total_spent numeric not null default 0,
  add column if not exists price_per_person numeric not null default 0,
  add column if not exists wait_time_minutes integer not null default 0,
  add column if not exists atmosphere integer not null default 7,
  add column if not exists cleanliness integer not null default 7,
  add column if not exists overall_value integer not null default 7,
  add column if not exists photos integer not null default 0,
  add column if not exists critic_name text,
  add column if not exists critic_rating numeric,
  add column if not exists critic_review_url text;
