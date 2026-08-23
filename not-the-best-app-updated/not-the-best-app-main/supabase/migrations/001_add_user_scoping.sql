-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query).
--
-- IMPORTANT: if you already have visits in the table from testing, this
-- migration will fail on the NOT NULL step until those old rows either
-- get deleted or assigned to a real user. See the note below.

-- 1. Add the column that ties each visit to the user who created it.
alter table visits
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 2. (Optional) If you have old test rows with no owner, either delete them:
--      delete from visits where user_id is null;
--    ...or assign them to yourself after you've signed in once, so you
--    have a user id to use:
--      update visits set user_id = 'YOUR-USER-UUID-HERE' where user_id is null;

-- 3. Once every row has an owner, make the column required.
alter table visits
  alter column user_id set not null;

-- 4. Turn on Row Level Security -- this is what actually enforces
--    privacy at the database level, independent of app code.
alter table visits enable row level security;

-- 5. Policies: a user can only select/insert/update/delete their own rows.
create policy "Users can view their own visits"
  on visits for select
  using (auth.uid() = user_id);

create policy "Users can insert their own visits"
  on visits for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own visits"
  on visits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own visits"
  on visits for delete
  using (auth.uid() = user_id);
