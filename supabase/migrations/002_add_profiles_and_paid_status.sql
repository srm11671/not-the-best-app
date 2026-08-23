-- Run this in the Supabase SQL Editor, after 001_add_user_scoping.sql.

-- 1. A profile row per user: tracks trial window and paid status.
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  paid boolean not null default false,
  trial_ends_at timestamptz not null default (now() + interval '7 days'),
  stripe_customer_id text,
  stripe_checkout_session_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = user_id);

-- Note: there is deliberately no insert/update policy for regular
-- users. The profile row is created by the trigger below, and `paid`
-- is only ever flipped to true by the Stripe webhook, which uses the
-- service-role key and bypasses RLS entirely. A signed-in user can
-- read their own row but can never grant themselves access by editing
-- it -- there's no policy that allows them to write to this table at all.

-- 2. Auto-create a profile row the moment someone signs up, starting
--    their 7-day trial from that moment.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
